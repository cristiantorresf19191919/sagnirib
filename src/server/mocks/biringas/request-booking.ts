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
