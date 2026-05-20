import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import type {
  BookingRequestInput,
  BookingRequestRecord,
} from "@/server/biringas/booking-types";

import { getDb } from "@/server/adapters/firebase/client";
import { wrapFirestoreError } from "@/server/adapters/firebase/errors";
import { mapBookingDoc } from "@/server/mappers/firebase-booking";

/**
 * Firestore adapter for booking requests (ADR-016).
 *
 * Layout: `bookings/{auto-id}`. Auto-id is Firestore-generated; no
 * application logic depends on its content. Auth + audit happen in the
 * barrel (`@/server/biringas#requestBooking` and friends); this adapter
 * persists.
 */

const COLLECTION = "bookings";

/** Firestore `in` clause cap. */
const IN_CHUNK_SIZE = 30;

/** Reply-median tunables — same constants used by the mock. */
const REPLY_MIN_SAMPLE = 2;
const REPLY_WINDOW_SIZE = 20;

type BookingDocFields = Record<string, unknown>;

interface RawArgs {
  input: BookingRequestInput;
  requesterUid: string;
}

export async function requestBookingRaw(
  args: RawArgs,
): Promise<{ id: string }> {
  const db = getDb();
  try {
    const ref = db.collection(COLLECTION).doc();
    const proposed = new Date(args.input.proposedAt);
    if (!Number.isFinite(proposed.getTime())) {
      throw wrapFirestoreError(
        "requestBooking",
        new Error("proposedAt is not a parseable date"),
      );
    }
    await ref.set({
      listingSlug: args.input.listingSlug,
      requesterUid: args.requesterUid,
      proposedAt: Timestamp.fromDate(proposed),
      durationHours: args.input.durationHours,
      meetingType: args.input.meetingType,
      contactPreference: args.input.contactPreference,
      message: args.input.message,
      submittedAt: FieldValue.serverTimestamp(),
      respondedAt: null,
      status: "pending" as const,
    });
    return { id: ref.id };
  } catch (err) {
    throw wrapFirestoreError("requestBooking", err);
  }
}

/**
 * Inbox query for the seller dashboard. Chunks the slugs list into
 * Firestore's `in` cap (30) and runs the chunks in parallel; results
 * merged and sorted newest-first to match the in-memory mock's
 * contract.
 */
export async function listBookingsForListingsRaw(
  slugs: ReadonlyArray<string>,
): Promise<ReadonlyArray<BookingRequestRecord>> {
  if (slugs.length === 0) return [];
  const db = getDb();
  const chunks: string[][] = [];
  for (let i = 0; i < slugs.length; i += IN_CHUNK_SIZE) {
    chunks.push(slugs.slice(i, i + IN_CHUNK_SIZE));
  }

  try {
    const snapshots = await Promise.all(
      chunks.map((chunk) =>
        db
          .collection(COLLECTION)
          .where("listingSlug", "in", chunk)
          .orderBy("submittedAt", "desc")
          .get(),
      ),
    );
    const records: BookingRequestRecord[] = [];
    for (const snap of snapshots) {
      for (const doc of snap.docs) {
        records.push(mapBookingDoc(doc.id, doc.data() as BookingDocFields));
      }
    }
    // Re-sort after merging the per-chunk results.
    records.sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() -
        new Date(a.submittedAt).getTime(),
    );
    return records;
  } catch (err) {
    throw wrapFirestoreError("listBookingsForListings", err);
  }
}

/**
 * Flips a booking's status. `respondedAt` is set only on the first
 * transition out of `pending` — subsequent status changes preserve the
 * original first-response timestamp so the listing's reply-median
 * measures the buyer-facing latency, not internal lifecycle steps.
 *
 * Returns `null` when the id is unknown.
 */
export async function updateBookingStatusRaw(
  id: string,
  status: BookingRequestRecord["status"],
  respondedAt?: string,
): Promise<BookingRequestRecord | null> {
  const db = getDb();
  const ref = db.collection(COLLECTION).doc(id);
  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return null;
      const data = snap.data() as BookingDocFields;
      const currentStatus = data.status as BookingRequestRecord["status"];

      const update: BookingDocFields = { status };
      if (
        respondedAt &&
        currentStatus === "pending" &&
        !data.respondedAt
      ) {
        update.respondedAt = Timestamp.fromDate(new Date(respondedAt));
      }
      tx.update(ref, update);

      // Compose the post-update record locally so we don't need a
      // second read. `submittedAt` and other immutable fields stay
      // from the pre-update snapshot.
      const merged: BookingDocFields = { ...data, ...update };
      return mapBookingDoc(id, merged);
    });
  } catch (err) {
    throw wrapFirestoreError("updateBookingStatus", err);
  }
}

/**
 * Attaches a seller-to-buyer review to a completed booking. Idempotent
 * at the booking level — re-submitting overwrites the previous review.
 * Ownership + status guards live in the barrel.
 */
export async function attachBuyerReviewRaw(
  bookingId: string,
  review: NonNullable<BookingRequestRecord["buyerReview"]>,
): Promise<BookingRequestRecord | null> {
  const db = getDb();
  const ref = db.collection(COLLECTION).doc(bookingId);
  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return null;
      const fields: BookingDocFields = {
        rating: review.rating,
        submittedAt: Timestamp.fromDate(new Date(review.submittedAt)),
      };
      if (review.comment !== undefined) {
        fields.comment = review.comment;
      }
      tx.update(ref, { buyerReview: fields });
      const data = snap.data() as BookingDocFields;
      return mapBookingDoc(bookingId, { ...data, buyerReview: fields });
    });
  } catch (err) {
    throw wrapFirestoreError("attachBuyerReview", err);
  }
}

/**
 * Computes the median minutes between `submittedAt` and `respondedAt`
 * across the listing's responded bookings (newest `REPLY_WINDOW_SIZE`).
 * Returns `null` when fewer than `REPLY_MIN_SAMPLE` responses exist —
 * the catalog hides the "Responde ~Xmin" chip in that case rather than
 * surface a flimsy median.
 */
export async function computeReplyMedianMinutesForSlug(
  listingSlug: string,
): Promise<number | null> {
  const db = getDb();
  try {
    // `orderBy('respondedAt', 'desc')` naturally excludes docs where
    // `respondedAt === null` (Firestore skips null on orderBy), so we
    // do not need an additional `where` clause to filter pending bookings.
    const snap = await db
      .collection(COLLECTION)
      .where("listingSlug", "==", listingSlug)
      .orderBy("respondedAt", "desc")
      .limit(REPLY_WINDOW_SIZE)
      .get();

    if (snap.size < REPLY_MIN_SAMPLE) return null;

    const deltas: number[] = [];
    for (const doc of snap.docs) {
      const data = doc.data() as BookingDocFields;
      const respondedAt = data.respondedAt;
      const submittedAt = data.submittedAt;
      if (!(respondedAt instanceof Timestamp)) continue;
      if (!(submittedAt instanceof Timestamp)) continue;
      const diffMs =
        respondedAt.toMillis() - submittedAt.toMillis();
      if (!Number.isFinite(diffMs) || diffMs < 0) continue;
      deltas.push(diffMs / 60_000);
    }
    if (deltas.length < REPLY_MIN_SAMPLE) return null;

    deltas.sort((a, b) => a - b);
    const mid = Math.floor(deltas.length / 2);
    const median =
      deltas.length % 2 === 0
        ? (deltas[mid - 1] + deltas[mid]) / 2
        : deltas[mid];
    return Math.max(1, Math.round(median));
  } catch (err) {
    throw wrapFirestoreError("computeReplyMedianMinutes", err);
  }
}

/**
 * Persists the computed reply median onto the listing doc. `null`
 * clears the field via `FieldValue.delete()` so the mapper falls back
 * to `undefined` and surfaces hide the chip.
 *
 * Tolerant of stale slugs (no-op when nothing matches) — same shape as
 * `recordListingViewRaw`. Listing lookups by slug live in the catalog
 * adapter's read paths; cross-cutting it here is acceptable because
 * the barrel guarantees the slug originated from an authenticated
 * owner action.
 */
export async function setListingReplyMedianMinutesRaw(
  slug: string,
  minutes: number | null,
): Promise<void> {
  const db = getDb();
  try {
    const snap = await db
      .collection("listings")
      .where("slug", "==", slug)
      .limit(1)
      .get();
    if (snap.empty) return;
    await snap.docs[0].ref.update({
      "reputation.replyMedianMinutes":
        minutes === null ? FieldValue.delete() : minutes,
    });
  } catch (err) {
    throw wrapFirestoreError("setListingReplyMedianMinutes", err);
  }
}
