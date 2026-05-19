import "server-only";

/**
 * Testimonials contract — used by the marketing surfaces (home page) to
 * showcase curated quotes from verified clients across the catalog.
 *
 * A `Testimonial` is distinct from a `ReviewItem` (which is per-listing
 * UGC): testimonials are curated, marketing-grade quotes intended for
 * the homepage carousel. The shapes overlap, but separating them keeps
 * the editorial intent explicit and lets the Firebase adapter route
 * each to its own collection (`reviews/*` vs `testimonials/*`) later.
 *
 * Provider types (Firestore Timestamp, DocumentReference) MUST NOT leak
 * through this module — same rule as the rest of the biringas port
 * (Addendum 001 §15 + ADR-009).
 */

export interface TestimonialListingRef {
  /** Profile slug — links the testimonial back to its listing. */
  slug: string;
  /** Display name shown beside the quote. */
  name: string;
  /** Square avatar used in the testimonial card. */
  image: string;
}

export interface Testimonial {
  id: string;
  /** Display alias of the client who left the quote — never their real name. */
  alias: string;
  /** City of the client (anchors trust without revealing geography). */
  city: string;
  /** The curated quote. Kept short (<=180 chars) for the card layout. */
  quote: string;
  /** 1–5 stars. */
  rating: 1 | 2 | 3 | 4 | 5;
  /** ISO timestamp of the original review. */
  date: string;
  /** True when the client was identity-verified at the time of the review. */
  verified: boolean;
  /** The listing the testimonial speaks about. */
  listing: TestimonialListingRef;
}
