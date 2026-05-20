import "server-only";

import type {
  BookingRequestInput,
  BookingRequestRecord,
} from "@/server/biringas/booking-types";

/**
 * Firestore adapter for booking requests — STUB.
 *
 * The booking domain shipped first as an in-memory mock so the buyer-side
 * UX is end-to-end testable. When this stub is replaced, the implementation
 * should write `bookings/{auto-id}` with the same shape as
 * `BookingRequestRecord` plus server timestamps for `submittedAt`. The
 * audit log entry + cache-tag invalidation already happen in the barrel
 * (`@/server/biringas#requestBooking`); this adapter only persists.
 *
 * Throwing here surfaces a friendly error in the UI (`booking-disabled`)
 * instead of a silent no-op, which is the safer default while the
 * Firestore collection + security rules are still being drafted.
 */

interface RawArgs {
  input: BookingRequestInput;
  requesterUid: string;
}

export async function requestBookingRaw(
  _args: RawArgs,
): Promise<{ id: string }> {
  throw new BookingDisabledError(
    "Las reservas en Firestore aún no están implementadas. Configura la app en modo mock o implementa el adaptador.",
  );
}

/**
 * Inbox query — returns an empty list until the Firestore collection +
 * security rules ship. The seller-dashboard inbox renders a friendly
 * empty state in that case (same path users without bookings see).
 */
export async function listBookingsForListingsRaw(
  _slugs: ReadonlyArray<string>,
): Promise<ReadonlyArray<BookingRequestRecord>> {
  return [];
}

/**
 * Status mutation stub — surfaces a typed error so the action layer can
 * render a friendly "no implementado" message. The barrel handles auth
 * + audit before this is reached.
 */
export async function updateBookingStatusRaw(
  _id: string,
  _status: BookingRequestRecord["status"],
): Promise<BookingRequestRecord | null> {
  throw new BookingDisabledError(
    "Actualizar el estado de reservas requiere la colección `bookings` en Firestore.",
  );
}

class BookingDisabledError extends Error {
  readonly kind = "booking-disabled" as const;
  constructor(message: string) {
    super(message);
    this.name = "BookingDisabledError";
  }
}
