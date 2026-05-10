import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import type { SubmitReviewRawInput } from "@/server/biringas/review-types";
import { getDb } from "@/server/adapters/firebase/client";
import {
  FirebaseAdapterError,
  wrapFirestoreError,
} from "@/server/adapters/firebase/errors";

/**
 * Writes a review under `listings/{listingId}/reviews/{authorUid}`.
 *
 * Document id == authorUid → enforces "one review per (user, listing)" at
 * the Firestore level via `create()` (which fails with `already-exists` if
 * the doc already exists). No transaction needed.
 *
 * The aggregate `reputation.reviewCount` on the parent listing is NOT
 * incremented here — that belongs to a Cloud Function trigger so the
 * counter survives concurrent writes. This adapter only inserts the row.
 *
 * NEVER expose this directly — features call `submitReview` from the
 * barrel, which adds requireAuth + validation + audit + revalidate.
 */
export async function submitReviewRaw(
  input: SubmitReviewRawInput,
): Promise<{ id: string }> {
  const db = getDb();

  // 1. Resolve listing slug → id.
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

  // 2. Create review doc — fails atomically if the user already reviewed.
  const reviewRef = db
    .collection("listings")
    .doc(listingId)
    .collection("reviews")
    .doc(input.authorUid);

  try {
    await reviewRef.create({
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
  } catch (err) {
    const code = (err as { code?: string | number } | undefined)?.code;
    if (code === 6 || code === "already-exists") {
      throw new FirebaseAdapterError(
        "invalid-argument",
        "submitReview: this user already reviewed this listing",
        err,
      );
    }
    throw wrapFirestoreError("submitReview:create", err);
  }

  return { id: input.authorUid };
}
