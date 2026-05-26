import "server-only";

import { unstable_cache } from "next/cache";

import type {
  BiringaListing,
  ListingsFilters,
  PaginatedListings,
} from "@/server/biringas/types";

import { CACHE_TAGS } from "@/server/biringas/cache-tags";
import { getDb } from "@/server/adapters/firebase/client";
import { wrapFirestoreError } from "@/server/adapters/firebase/errors";
import { mapListing } from "@/server/mappers/firebase-biringa";

import { applyMemoryFilters } from "./filters";

export { CACHE_TAGS };

/**
 * Firestore adapter for the Biringas catalog.
 *
 * Strategy (see docs/architecture/firebase-schema.md):
 *   - Push down cheap equality filters: category, city, verifiedOnly,
 *     availableNow. Everything else runs in memory after the read.
 *   - Sort by `updatedAt desc` at the query level; final sort
 *     (`storyAt ?? updatedAt`) happens in memory.
 *   - Pagination is offset-based for parity with the existing mock contract;
 *     switch to cursor-based when volume warrants it.
 *
 * Cache: results go through `unstable_cache` keyed by the filters JSON, with
 * tag `biringa:listings`. Mutations (admin tools, cloud functions) must
 * call `revalidateTag("biringa:listings")` to invalidate.
 */

const DEFAULT_PAGE_SIZE = 24;
const FETCH_LIMIT = 500; // Memory post-filter cap; raise when catalog grows.

type ListingDocFields = Record<string, unknown>;

async function fetchCandidates(
  filters: ListingsFilters,
): Promise<BiringaListing[]> {
  const db = getDb();
  let query = db
    .collection("listings")
    .orderBy("updatedAt", "desc") as FirebaseFirestore.Query;

  if (filters.category) {
    query = query.where("category", "==", filters.category);
  }
  if (filters.city) {
    query = query.where("city", "==", filters.city);
  }
  if (filters.verifiedOnly) {
    query = query.where("verified", "==", true);
  }
  if (filters.availableNow) {
    query = query.where("availableNow", "==", true);
  }

  query = query.limit(FETCH_LIMIT);

  try {
    const snap = await query.get();
    return snap.docs.map((doc) =>
      mapListing(doc.id, doc.data() as ListingDocFields),
    );
  } catch (err) {
    throw wrapFirestoreError("listAll:fetchCandidates", err);
  }
}

async function listAllUncached(
  filters: ListingsFilters,
): Promise<PaginatedListings> {
  const candidates = await fetchCandidates(filters);
  const filtered = applyMemoryFilters(candidates, filters);

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);

  return { data, meta: { total, page, pageSize, totalPages } };
}

export async function listAll(
  filters: ListingsFilters = {},
): Promise<PaginatedListings> {
  // unstable_cache keys on the function args. Stringify filters so identical
  // queries hit the same entry.
  const key = ["listAll", JSON.stringify(filters)];
  return unstable_cache(() => listAllUncached(filters), key, {
    tags: [CACHE_TAGS.listings],
    revalidate: 60,
  })();
}

async function listFeaturedUncached(
  limit: number,
): Promise<ReadonlyArray<BiringaListing>> {
  const db = getDb();
  try {
    // "Destacada" requires a paid plan with `activeUntil` in the future
    // (ADR: BiringaListing.plan). The query pushes the cheap range
    // filter down to Firestore (single-field index on
    // `plan.activeUntil`, auto-indexed), then filters `verified` in
    // memory. Avoids needing a new composite index — paid-plan
    // cardinality stays small (hundreds), so the post-filter overhead
    // is negligible.
    const now = new Date();
    const snap = await db
      .collection("listings")
      .where("plan.activeUntil", ">", now)
      .orderBy("plan.activeUntil", "desc")
      .limit(limit * 4)
      .get();
    const docs = snap.docs.map((doc) =>
      mapListing(doc.id, doc.data() as ListingDocFields),
    );
    return docs
      .filter((l) => l.verified)
      .sort((a, b) => b.reputation.score - a.reputation.score)
      .slice(0, limit);
  } catch (err) {
    throw wrapFirestoreError("listFeatured", err);
  }
}

export async function listFeatured(
  limit = 8,
): Promise<ReadonlyArray<BiringaListing>> {
  return unstable_cache(
    () => listFeaturedUncached(limit),
    ["listFeatured", String(limit)],
    { tags: [CACHE_TAGS.listings], revalidate: 300 },
  )();
}

/**
 * Bayesian smoothing constant for the hero ranking. Higher = more demanding
 * on review volume before a listing can climb. With C=10:
 *   5.0 × 2 reviews   → rank 0.83  (suppressed)
 *   4.7 × 30 reviews  → rank 3.53  (winner)
 *   4.9 × 60 reviews  → rank 4.20  (top tier)
 */
const HERO_BAYESIAN_C = 10;
/** Minimum reviews to qualify for the hero — keeps 5★/1-review entries out. */
const HERO_MIN_REVIEWS = 3;

async function listHeroMosaicUncached(
  limit: number,
): Promise<ReadonlyArray<BiringaListing>> {
  const db = getDb();
  // Pull a generous candidate pool by score, then rerank in memory using a
  // Bayesian-smoothed score so high-rating / low-review entries can't crack
  // the hero. Single Firestore round-trip, reuses the existing
  // (verified, score) composite index.
  const FETCH_LIMIT = Math.max(limit * 4, 50);
  try {
    const snap = await db
      .collection("listings")
      .where("verified", "==", true)
      .orderBy("reputation.score", "desc")
      .limit(FETCH_LIMIT)
      .get();
    const candidates = snap.docs.map((d) =>
      mapListing(d.id, d.data() as ListingDocFields),
    );
    const ranked = candidates
      .filter((l) => l.reputation.reviewCount >= HERO_MIN_REVIEWS)
      .map((l) => ({
        listing: l,
        rank:
          l.reputation.score *
          (l.reputation.reviewCount /
            (l.reputation.reviewCount + HERO_BAYESIAN_C)),
      }))
      .sort((a, b) => b.rank - a.rank)
      .slice(0, limit)
      .map((r) => r.listing);

    if (ranked.length >= limit) return ranked;

    // Soft fallback for early-stage catalogs where few listings clear the
    // review-count floor — backfill with the next best by raw score.
    const seen = new Set(ranked.map((l) => l.id));
    const backfill = candidates
      .filter((l) => !seen.has(l.id))
      .slice(0, limit - ranked.length);
    return [...ranked, ...backfill];
  } catch (err) {
    throw wrapFirestoreError("listHeroMosaic", err);
  }
}

export async function listHeroMosaic(
  limit = 12,
): Promise<ReadonlyArray<BiringaListing>> {
  return unstable_cache(
    () => listHeroMosaicUncached(limit),
    ["listHeroMosaic", String(limit)],
    { tags: [CACHE_TAGS.listings], revalidate: 60 },
  )();
}

async function findBySlugUncached(
  slug: string,
): Promise<BiringaListing | null> {
  const db = getDb();
  try {
    const snap = await db
      .collection("listings")
      .where("slug", "==", slug)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return mapListing(doc.id, doc.data() as ListingDocFields);
  } catch (err) {
    throw wrapFirestoreError("findBySlug", err);
  }
}

export async function findBySlug(
  slug: string,
): Promise<BiringaListing | null> {
  return unstable_cache(
    () => findBySlugUncached(slug),
    ["findBySlug", slug],
    {
      tags: [CACHE_TAGS.listings, CACHE_TAGS.listing(slug)],
      revalidate: 60,
    },
  )();
}

export {
  listCities,
  listServiceCatalog,
  listMeetingContextCatalog,
} from "./catalogs";
export { getListingReviews } from "./reviews";
export { listTestimonials } from "./testimonials";
export { getPrivateContactRaw } from "./private-contact";
export { submitReviewRaw } from "./submit-review";
export {
  createListingDraftRaw,
  findActiveDraftBySlug,
  cancelDraftRaw,
} from "./create-draft";
export { listSimilar } from "./similar";
export {
  requestBookingRaw,
  listBookingsForListingsRaw,
  updateBookingStatusRaw,
  attachBuyerReviewRaw,
  computeReplyMedianMinutesForSlug,
  setListingReplyMedianMinutesRaw,
} from "./request-booking";
export { reportListingRaw } from "./report-listing";
export { recordListingViewRaw } from "./record-view";
export { setListingAvailableNowRaw } from "./set-availability";
export { setListingPlanRaw } from "./set-plan";
export {
  listDraftsByOwnerRaw,
  getDraftByIdForOwnerRaw,
  type DraftSummary,
} from "./create-draft";
export {
  getReferralStatsRaw,
  redeemReferralRaw,
  type RedeemOutcome,
} from "./referrals";
export {
  createCheckoutSessionRaw,
  completeCheckoutMockRaw,
  findCheckoutSessionRaw,
} from "./checkout";
