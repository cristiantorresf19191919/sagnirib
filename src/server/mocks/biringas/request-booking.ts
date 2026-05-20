import "server-only";

import type {
  BookingRequestInput,
  BookingRequestRecord,
} from "@/server/biringas/booking-types";

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
 * The barrel layer is responsible for authorising the call — this
 * adapter accepts any id and trusts the wrapper.
 */
export async function updateBookingStatusRaw(
  id: string,
  status: BookingRequestRecord["status"],
): Promise<BookingRequestRecord | null> {
  const idx = STORE.findIndex((b) => b.id === id);
  if (idx < 0) return null;
  STORE[idx] = { ...STORE[idx]!, status };
  return STORE[idx];
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
