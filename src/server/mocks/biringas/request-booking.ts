import "server-only";

import type {
  BookingRequestInput,
  BookingRequestRecord,
} from "@/server/biringas/booking-types";

import { BIRINGA_LISTINGS } from "./data";

/**
 * In-memory mock store for booking requests.
 *
 * Lives for the life of the dev server process — fine for prototyping
 * the end-to-end UX before the Firestore adapter ships. When the
 * Firebase adapter lands, it gets its own `request-booking.ts` that
 * writes to a `bookings` collection with the same shape.
 */
const STORE: BookingRequestRecord[] = [];

let counter = 0;
function nextId() {
  counter += 1;
  return `booking-${Date.now()}-${counter}`;
}

interface RawArgs {
  input: BookingRequestInput;
  requesterUid: string;
}

export async function requestBookingRaw({
  input,
  requesterUid,
}: RawArgs): Promise<{ id: string }> {
  const record: BookingRequestRecord = {
    ...input,
    id: nextId(),
    requesterUid,
    submittedAt: new Date().toISOString(),
    status: "pending",
  };
  STORE.push(record);
  return { id: record.id };
}

/** Test/inspection helper — read-only view of the in-memory store. */
export async function listBookingRequestsRaw(): Promise<
  ReadonlyArray<BookingRequestRecord>
> {
  return STORE.slice();
}

/**
 * Returns all bookings filed against any of the given listing slugs,
 * sorted newest-first. Used by the seller dashboard inbox where the
 * user owns one or more listings. Empty input → empty output.
 */
export async function listBookingsForListingsRaw(
  slugs: ReadonlyArray<string>,
): Promise<ReadonlyArray<BookingRequestRecord>> {
  if (slugs.length === 0) return [];
  const set = new Set(slugs);
  return STORE.filter((b) => set.has(b.listingSlug)).sort(
    (a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

/**
 * Flips a booking's status. Used by the seller dashboard to
 * confirm / decline / cancel a request. Returns the updated record so
 * the caller can revalidate UI immediately. `null` when the id is
 * unknown (caller renders a friendly "ya no existe" message).
 *
 * `respondedAt` is set the first time the booking leaves `pending` —
 * subsequent status flips (e.g. `confirmed` → `completed`) preserve the
 * original response timestamp so the listing's median reply time keeps
 * measuring the buyer-facing latency, not internal lifecycle steps.
 *
 * The barrel layer is responsible for authorising the call — this
 * adapter accepts any id and trusts the wrapper.
 */
export async function updateBookingStatusRaw(
  id: string,
  status: BookingRequestRecord["status"],
  respondedAt?: string,
): Promise<BookingRequestRecord | null> {
  const idx = STORE.findIndex((b) => b.id === id);
  if (idx < 0) return null;
  const current = STORE[idx]!;
  const next: BookingRequestRecord = {
    ...current,
    status,
    respondedAt:
      current.respondedAt ??
      (respondedAt && current.status === "pending"
        ? respondedAt
        : current.respondedAt),
  };
  STORE[idx] = next;
  return next;
}

/**
 * Computes the median minutes between `submittedAt` and `respondedAt`
 * across all bookings of the given listing slug that have been responded
 * to. Returns `null` when the listing has fewer than `MIN_SAMPLE`
 * responded bookings — there's no honest median to surface yet.
 *
 * Capped at the last `WINDOW_SIZE` responses so a fast period of activity
 * dominates the signal — buyers care about recent responsiveness, not
 * historical averages from months ago.
 */
const REPLY_MIN_SAMPLE = 2;
const REPLY_WINDOW_SIZE = 20;

export async function computeReplyMedianMinutesForSlug(
  listingSlug: string,
): Promise<number | null> {
  const responded = STORE.filter(
    (b) => b.listingSlug === listingSlug && b.respondedAt,
  )
    .sort(
      (a, b) =>
        new Date(b.respondedAt!).getTime() -
        new Date(a.respondedAt!).getTime(),
    )
    .slice(0, REPLY_WINDOW_SIZE);

  if (responded.length < REPLY_MIN_SAMPLE) return null;

  const deltas = responded
    .map(
      (b) =>
        (new Date(b.respondedAt!).getTime() -
          new Date(b.submittedAt).getTime()) /
        60000,
    )
    .filter((m) => Number.isFinite(m) && m >= 0)
    .sort((a, b) => a - b);

  if (deltas.length === 0) return null;
  const mid = Math.floor(deltas.length / 2);
  const median =
    deltas.length % 2 === 0
      ? (deltas[mid - 1] + deltas[mid]) / 2
      : deltas[mid];
  return Math.max(1, Math.round(median));
}

/**
 * Persists the computed reply median onto the seed listing so the
 * catalog / profile surfaces can read it back through `findBySlug` /
 * `listAll`.
 *
 * Mutates the underlying object in place. BIRINGA_LISTINGS is `const`
 * (array binding immutable), but the nested `reputation` object is a
 * plain JS object — same pattern that would work against Firestore's
 * `listings/{id}.reputation.replyMedianMinutes` field. Dev-only side
 * effect; tests that rely on baseline seed state should refresh between
 * runs.
 *
 * Passing `null` clears the field (mirrors how the Firestore adapter
 * deletes it via `FieldValue.delete()`).
 */
export async function setListingReplyMedianMinutesRaw(
  slug: string,
  minutes: number | null,
): Promise<void> {
  const listing = BIRINGA_LISTINGS.find((l) => l.slug === slug);
  if (!listing) return;
  const reputation = listing.reputation as {
    replyMedianMinutes?: number;
  };
  if (minutes === null) {
    delete reputation.replyMedianMinutes;
  } else {
    reputation.replyMedianMinutes = minutes;
  }
}

/**
 * Attaches a seller-to-buyer review to a completed booking. Idempotent
 * at the booking level — re-submitting overwrites the previous review.
 * Returns the updated record so the caller can immediately render the
 * new state without a round-trip.
 *
 * Authorization (caller owns the booking's listing) lives in the
 * barrel — this raw helper trusts the wrapper.
 */
export async function attachBuyerReviewRaw(
  bookingId: string,
  review: NonNullable<BookingRequestRecord["buyerReview"]>,
): Promise<BookingRequestRecord | null> {
  const idx = STORE.findIndex((b) => b.id === bookingId);
  if (idx < 0) return null;
  STORE[idx] = { ...STORE[idx]!, buyerReview: review };
  return STORE[idx];
}
