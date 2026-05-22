import "server-only";

import type { ReviewItem } from "@/server/biringas/review-types";
import type { Testimonial } from "@/server/biringas/testimonial-types";

import { BIRINGA_LISTINGS } from "./data";
import { getListingReviews } from "./reviews";

/**
 * Mock parity for the Firestore `listTestimonials` adapter.
 *
 * Why parity matters: the home page reads from the barrel, which routes
 * either to Firestore or to this mock at module load. If the mock has a
 * different selection rule than the adapter, devs see one thing locally
 * and prod ships another — that's exactly the bug the audit boundary
 * was designed to prevent.
 *
 * Selection rules MUST match `src/server/adapters/firebase/biringas/testimonials.ts`:
 *   - `verified === true`
 *   - `rating >= 4`
 *   - `body.length ∈ [40, 200]`
 *   - one quote per listing
 *   - newest-first
 *
 * The seed catalog's `getListingReviews` mock generates per-listing
 * reviews deterministically from the slug, so SSR + hydration agree and
 * the home renders the same testimonials across requests.
 */

const CARD_BODY_MIN = 40;
const CARD_BODY_MAX = 200;
const MIN_RATING = 4;

export async function listTestimonials(
  limit = 6,
): Promise<ReadonlyArray<Testimonial>> {
  if (BIRINGA_LISTINGS.length === 0) return [];

  type Entry = {
    listingIndex: number;
    review: ReviewItem;
  };

  const candidates: Entry[] = [];
  for (let i = 0; i < BIRINGA_LISTINGS.length; i++) {
    const listing = BIRINGA_LISTINGS[i]!;
    if (!listing.verified) continue;
    const agg = await getListingReviews(listing.slug);
    if (!agg) continue;
    for (const review of agg.reviews) {
      if (!review.verified) continue;
      if (review.rating < MIN_RATING) continue;
      const len = review.body.length;
      if (len < CARD_BODY_MIN || len > CARD_BODY_MAX) continue;
      candidates.push({ listingIndex: i, review });
    }
  }

  candidates.sort(
    (a, b) => Date.parse(b.review.date) - Date.parse(a.review.date),
  );

  const seen = new Set<number>();
  const out: Testimonial[] = [];
  for (const c of candidates) {
    if (seen.has(c.listingIndex)) continue;
    seen.add(c.listingIndex);
    const listing = BIRINGA_LISTINGS[c.listingIndex]!;
    out.push({
      id: c.review.id,
      alias: c.review.alias,
      city: c.review.city,
      quote: c.review.body,
      rating: clampRating(c.review.rating),
      date: c.review.date,
      verified: c.review.verified,
      listing: {
        slug: listing.slug,
        name: listing.name,
        image: listing.mainImage,
      },
    });
    if (out.length >= limit) break;
  }
  return out;
}

function clampRating(n: number): 1 | 2 | 3 | 4 | 5 {
  const r = Math.max(1, Math.min(5, Math.round(n)));
  return r as 1 | 2 | 3 | 4 | 5;
}
