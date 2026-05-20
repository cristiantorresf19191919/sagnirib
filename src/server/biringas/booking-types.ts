import "server-only";

/**
 * Booking-request domain contract.
 *
 * A booking REQUEST is the buyer-side proposal that the listing receives
 * and confirms/rejects out-of-band. The MVP is intentionally not a full
 * scheduling system: it captures the buyer's intent (date/duration/
 * meeting type + freeform message + preferred contact channel) and
 * persists it for the listing owner to act on.
 *
 * When the Firebase adapter ships, the same shape becomes a `bookings/{id}`
 * document. Until then, the mock just appends to an in-memory array so
 * the UX is end-to-end testable.
 */

export type BookingMeetingType = "outcall" | "incall" | "videocall";

export type BookingContactPreference =
  | "whatsapp"
  | "telegram"
  | "platform";

export interface BookingRequestInput {
  /** Slug of the listing being requested — wired into the action payload. */
  listingSlug: string;
  /** ISO date string of the proposed encounter (YYYY-MM-DD or full ISO). */
  proposedAt: string;
  /** Duration in hours — 1, 2, 3, 4, 8, 12, 24. */
  durationHours: 1 | 2 | 3 | 4 | 8 | 12 | 24;
  meetingType: BookingMeetingType;
  /** Buyer's preferred channel for the listing owner to follow up. */
  contactPreference: BookingContactPreference;
  /** Freeform note — etiquette, special requests, context. */
  message: string;
}

export interface BookingRequestRecord extends BookingRequestInput {
  id: string;
  requesterUid: string;
  /** ISO timestamp of when the request was submitted. */
  submittedAt: string;
  /** Pending → owner-confirmed → completed; or cancelled / declined. */
  status:
    | "pending"
    | "confirmed"
    | "declined"
    | "cancelled"
    | "completed";
  /** Seller's review of the buyer, attached after a `completed` booking.
   *  Missing when the seller hasn't rated yet. Anonymous reviewers
   *  (seller-side) — we never display the seller name on the buyer's
   *  profile. Mutual-review system follows Airbnb's "rate within 14
   *  days" model; expiry isn't enforced yet. */
  buyerReview?: {
    rating: 1 | 2 | 3 | 4 | 5;
    /** Optional private comment. Visible to internal moderation only. */
    comment?: string;
    submittedAt: string;
  };
}

/**
 * Input for `submitBuyerReview`. The seller rating a buyer post
 * `completed` booking. `bookingId` is the binding key; the barrel
 * resolves the listing slug from it and enforces that the caller
 * actually owns the listing before persisting.
 */
export interface SubmitBuyerReviewInput {
  bookingId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
}

export const BUYER_REVIEW_LIMITS = {
  commentMax: 600,
} as const;

/**
 * Limits enforced by the schema. UI mirrors these client-side for the
 * form copy; server is the source of truth.
 */
export const BOOKING_LIMITS = {
  messageMin: 12,
  messageMax: 1000,
} as const;

export const BOOKING_DURATIONS: ReadonlyArray<
  BookingRequestInput["durationHours"]
> = [1, 2, 3, 4, 8, 12, 24];
