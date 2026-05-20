import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import type { SubmitReviewRawInput } from "@/server/biringas/review-types";
import { getDb } from "@/server/adapters/firebase/client";
import {
  FirebaseAdapterError,
  wrapFirestoreError,
} from "@/server/adapters/firebase/errors";

/**
 * Writes a review under `listings/{listingId}/reviews/{authorUid}` and
 * updates the parent listing's `reputation.score` + `reputation.reviewCount`
 * atomically.
 *
 * Document id == authorUid → enforces "one review per (user, listing)" by
 * checking existence inside the transaction. The transaction reads the
 * current aggregates, recomputes them with the incoming rating, and writes
 * both the new review and the updated listing in a single commit, so the
 * counter survives concurrent writes without a separate Cloud Function
 * trigger.
 *
 * Score recompute: `newScore = (oldScore * oldCount + newRating) / newCount`.
 * Rounded to one decimal so values render the same as the seed catalog.
 *
 * NEVER expose this directly — features call `submitReview` from the
 * barrel, which adds requireAuth + validation + audit + revalidate.
 */
export async function submitReviewRaw(
  input: SubmitReviewRawInput,
): Promise<{ id: string }> {
  const db = getDb();

  // 1. Resolve listing slug → id. Done outside the transaction so the slug
  //    lookup query (which Firestore transactions do not support) runs once.
  let listingId: string;
  try {
    const slugSnap = await db
      .collection("listings")
      .where("slug", "==", input.listingSlug)
      .limit(1)
      .get();
    if (slugSnap.empty) {
      throw new FirebaseAdapterError(
        "not-found",
        `submitReview: listing not found: ${input.listingSlug}`,
      );
    }
    listingId = slugSnap.docs[0].id;
  } catch (err) {
    if (err instanceof FirebaseAdapterError) throw err;
    throw wrapFirestoreError("submitReview:findSlug", err);
  }

  const listingRef = db.collection("listings").doc(listingId);
  const reviewRef = listingRef.collection("reviews").doc(input.authorUid);

  try {
    await db.runTransaction(async (tx) => {
      const [listingDoc, existingReview] = await Promise.all([
        tx.get(listingRef),
        tx.get(reviewRef),
      ]);

      if (existingReview.exists) {
        throw new FirebaseAdapterError(
          "invalid-argument",
          "submitReview: this user already reviewed this listing",
        );
      }
      if (!listingDoc.exists) {
        throw new FirebaseAdapterError(
          "not-found",
          `submitReview: listing vanished mid-transaction: ${input.listingSlug}`,
        );
      }

      const data = listingDoc.data() ?? {};
      const reputation =
        (data.reputation as Record<string, unknown> | undefined) ?? {};
      const oldScore =
        typeof reputation.score === "number" && Number.isFinite(reputation.score)
          ? reputation.score
          : 0;
      const oldCount =
        typeof reputation.reviewCount === "number" &&
        Number.isFinite(reputation.reviewCount)
          ? reputation.reviewCount
          : 0;

      const newCount = oldCount + 1;
      const newScore = Math.round(
        ((oldScore * oldCount + input.rating) / newCount) * 10,
      ) / 10;

      tx.create(reviewRef, {
        authorUid: input.authorUid,
        alias: input.alias,
        city: input.city,
        date: Timestamp.now(),
        rating: input.rating,
        body: input.body,
        helpful: 0,
        notHelpful: 0,
        verified: true,
        createdAt: FieldValue.serverTimestamp(),
      });

      tx.update(listingRef, {
        "reputation.score": newScore,
        "reputation.reviewCount": newCount,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  } catch (err) {
    if (err instanceof FirebaseAdapterError) throw err;
    const code = (err as { code?: string | number } | undefined)?.code;
    if (code === 6 || code === "already-exists") {
      throw new FirebaseAdapterError(
        "invalid-argument",
        "submitReview: this user already reviewed this listing",
        err,
      );
    }
    throw wrapFirestoreError("submitReview:transaction", err);
  }

  return { id: input.authorUid };
}
