import "server-only";

/**
 * Reviews contract — shared by the mock and the Firebase adapter.
 * Provider types must not leak through here.
 */

export interface ReviewBreakdown {
  trato: number;
  puntualidad: number;
  conversacion: number;
  presentacion: number;
  discrecion: number;
}

export interface ReviewItem {
  id: string;
  alias: string;
  city: string;
  date: string;
  rating: number;
  body: string;
  helpful: number;
  notHelpful: number;
  verified: boolean;
}

export interface ReviewsAggregate {
  total: number;
  averageRating: number;
  /** 0–100. */
  recommendRate: number;
  distribution: ReadonlyArray<{
    stars: number;
    count: number;
    percent: number;
  }>;
  breakdown: ReviewBreakdown;
  anonymousLikes: number;
  anonymousDislikes: number;
  reviews: ReadonlyArray<ReviewItem>;
}

/**
 * Public input shape for `submitReview`. Validated by the server schema —
 * authorUid is derived from the authenticated session, NEVER from the
 * client (Addendum 001 §14).
 */
export interface SubmitReviewInput {
  listingSlug: string;
  rating: 1 | 2 | 3 | 4 | 5;
  body: string;
  city: string;
  alias?: string;
}

/**
 * Adapter-internal input — includes the server-derived authorUid.
 * Features must NOT construct this directly; they go through the barrel.
 */
export interface SubmitReviewRawInput {
  listingSlug: string;
  authorUid: string;
  alias: string;
  city: string;
  rating: number;
  body: string;
}

/**
 * Limits enforced by the schema. Centralized so UI can mirror them in
 * client-side validation (cosmetic; the server is the source of truth).
 */
export const REVIEW_LIMITS = {
  bodyMin: 20,
  bodyMax: 2000,
  cityMax: 80,
  aliasMax: 40,
} as const;
