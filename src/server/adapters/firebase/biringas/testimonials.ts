import "server-only";

import { unstable_cache } from "next/cache";

import { CACHE_TAGS } from "@/server/biringas/cache-tags";
import type { Testimonial } from "@/server/biringas/testimonial-types";
import { getDb } from "@/server/adapters/firebase/client";
import { wrapFirestoreError } from "@/server/adapters/firebase/errors";
import { mapListing, mapReviewItem } from "@/server/mappers/firebase-biringa";

/**
 * Home-page testimonials derived from real reviews under
 * `listings/{listingId}/reviews/{reviewId}`.
 *
 * Why derive instead of curating a separate collection: testimonials must
 * be real client comments (founder requirement). Curated marketing copy
 * is dishonest if the catalog has not earned it yet. By reading the same
 * docs `submitReviewRaw` writes, the home surface stays in lockstep with
 * the actual platform reputation — when a real 5★ review lands, it can
 * surface on the home as soon as the next cache window expires.
 *
 * Selection rules (intentionally conservative for marketing context):
 *   - `verified === true`           — anonymous reviews never surface.
 *   - `rating >= 4`                 — only positive quotes.
 *   - `body.length ∈ [40, 200]`     — fits the card layout without ellipsis.
 *   - one quote per listing         — diversity across the catalog.
 *
 * If/when a moderation kill-switch is needed (e.g. a verified review that
 * still reads badly in marketing context), add an optional
 * `featuredOnHome: boolean` field on the review doc — default-true,
 * admin can flip to false — and add it to the where-clause here.
 */

const CARD_BODY_MIN = 40;
const CARD_BODY_MAX = 200;
const MIN_RATING = 4;
/** Generous pool so the in-memory dedupe by listing still leaves enough. */
const CANDIDATE_FETCH = 60;

async function listTestimonialsUncached(
  limit: number,
): Promise<ReadonlyArray<Testimonial>> {
  const db = getDb();

  let candidates: FirebaseFirestore.QuerySnapshot;
  try {
    candidates = await db
      .collectionGroup("reviews")
      .where("verified", "==", true)
      .orderBy("date", "desc")
      .limit(CANDIDATE_FETCH)
      .get();
  } catch (err) {
    throw wrapFirestoreError("listTestimonials:query", err);
  }
  if (candidates.empty) return [];

  // Filter + dedupe by parent listing in a single pass. Stop once we have
  // `limit` winners so the listing fetch downstream stays bounded.
  const seenListing = new Set<string>();
  const winners: Array<{
    listingId: string;
    review: ReturnType<typeof mapReviewItem>;
  }> = [];
  for (const doc of candidates.docs) {
    const parent = doc.ref.parent.parent;
    if (!parent) continue;
    if (seenListing.has(parent.id)) continue;
    const data = doc.data() as Record<string, unknown>;
    let review: ReturnType<typeof mapReviewItem>;
    try {
      review = mapReviewItem(doc.id, data);
    } catch {
      // A single malformed review must not poison the home surface.
      continue;
    }
    if (review.rating < MIN_RATING) continue;
    const len = review.body.length;
    if (len < CARD_BODY_MIN || len > CARD_BODY_MAX) continue;
    seenListing.add(parent.id);
    winners.push({ listingId: parent.id, review });
    if (winners.length >= limit) break;
  }

  if (winners.length === 0) return [];

  // Resolve each winner's parent listing in a single round-trip. `getAll`
  // preserves order so we can correlate by index without a Map for tiny
  // batches — Map kept anyway for defensive handling if a doc is missing.
  const refs = winners.map((w) =>
    db.collection("listings").doc(w.listingId),
  );
  let listingDocs: FirebaseFirestore.DocumentSnapshot[];
  try {
    listingDocs = await db.getAll(...refs);
  } catch (err) {
    throw wrapFirestoreError("listTestimonials:listings", err);
  }
  const listingById = new Map<
    string,
    ReturnType<typeof mapListing>
  >();
  for (const doc of listingDocs) {
    if (!doc.exists) continue;
    try {
      listingById.set(
        doc.id,
        mapListing(doc.id, doc.data() as Record<string, unknown>),
      );
    } catch {
      // Skip listings whose docs don't satisfy the mapper — same
      // poison-resistance as the review loop above.
    }
  }

  const out: Testimonial[] = [];
  for (const w of winners) {
    const listing = listingById.get(w.listingId);
    if (!listing) continue;
    out.push({
      id: w.review.id,
      alias: w.review.alias,
      city: w.review.city,
      quote: w.review.body,
      rating: clampRating(w.review.rating),
      date: w.review.date,
      verified: w.review.verified,
      listing: {
        slug: listing.slug,
        name: listing.name,
        image: listing.mainImage,
      },
    });
  }
  return out;
}

function clampRating(n: number): 1 | 2 | 3 | 4 | 5 {
  const r = Math.max(1, Math.min(5, Math.round(n)));
  return r as 1 | 2 | 3 | 4 | 5;
}

/**
 * Tagged with `CACHE_TAGS.listings` so the home refresh piggy-backs on the
 * same invalidation that `submitReview` already triggers (`updateTag` on
 * the listings tag inside the barrel). 5-minute hard TTL acts as a safety
 * net if a write somehow bypasses the action layer.
 */
export async function listTestimonials(
  limit = 6,
): Promise<ReadonlyArray<Testimonial>> {
  return unstable_cache(
    () => listTestimonialsUncached(limit),
    ["listTestimonials", String(limit)],
    { tags: [CACHE_TAGS.listings], revalidate: 300 },
  )();
}
