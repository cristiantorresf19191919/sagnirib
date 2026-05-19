import "server-only";

import {
  APPEARANCE_CATALOG,
  ATTENTION_CATALOG,
  BIRINGA_LISTINGS,
  CATEGORIES,
  CONTACT_CATALOG,
  MEETING_CONTEXT_CATALOG,
  SERVICE_CATALOG,
  SPECIAL_SERVICE_CATALOG,
  SUPPORTED_CITIES,
} from "./data";
import type {
  BiringaListing,
  ListingsFilters,
  PaginatedListings,
} from "./types";

const DEFAULT_PAGE_SIZE = 24;

function intersects<T>(a: ReadonlyArray<T>, b: ReadonlyArray<T>): boolean {
  if (a.length === 0 || b.length === 0) return false;
  return a.some((value) => b.includes(value));
}

function applyFilters(
  source: ReadonlyArray<BiringaListing>,
  filters: ListingsFilters,
): BiringaListing[] {
  let results = [...source];

  if (filters.category) {
    results = results.filter((ad) => ad.category === filters.category);
  }
  if (filters.sex) {
    results = results.filter((ad) => ad.sex === filters.sex);
  }
  if (filters.city) {
    const needle = filters.city.toLowerCase();
    results = results.filter((ad) => ad.city.toLowerCase() === needle);
  }
  if (filters.search) {
    const needle = filters.search.toLowerCase();
    results = results.filter(
      (ad) =>
        ad.name.toLowerCase().includes(needle) ||
        ad.bio.toLowerCase().includes(needle) ||
        ad.shortBio.toLowerCase().includes(needle) ||
        ad.tags.some((t) => t.toLowerCase().includes(needle)) ||
        ad.services.some((s) => s.toLowerCase().includes(needle)),
    );
  }
  if (filters.priceMin !== undefined) {
    results = results.filter((ad) => ad.pricePerHour >= filters.priceMin!);
  }
  if (filters.priceMax !== undefined) {
    results = results.filter((ad) => ad.pricePerHour <= filters.priceMax!);
  }
  if (filters.ageMin !== undefined) {
    results = results.filter((ad) => ad.age >= filters.ageMin!);
  }
  if (filters.ageMax !== undefined) {
    results = results.filter((ad) => ad.age <= filters.ageMax!);
  }
  if (filters.verifiedOnly) {
    results = results.filter((ad) => ad.verified);
  }
  if (filters.withVideo) {
    results = results.filter((ad) => ad.hasVideo);
  }
  if (filters.withAudio) {
    results = results.filter((ad) => ad.hasAudio);
  }
  if (filters.withReviews) {
    results = results.filter((ad) => ad.reputation.reviewCount > 0);
  }
  if (filters.faceVisible) {
    results = results.filter((ad) => ad.faceVisible);
  }
  if (filters.paymentByCard) {
    results = results.filter((ad) => ad.paymentByCard);
  }
  if (filters.availableNow) {
    results = results.filter((ad) => ad.availableNow);
  }
  if (filters.attention && filters.attention.length > 0) {
    const wanted = filters.attention;
    results = results.filter((ad) => intersects(ad.attention, wanted));
  }
  if (filters.contactChannels && filters.contactChannels.length > 0) {
    const wanted = filters.contactChannels;
    results = results.filter((ad) =>
      intersects(ad.contactChannels, wanted),
    );
  }
  if (filters.services && filters.services.length > 0) {
    const wanted = filters.services.map((s) => s.toLowerCase());
    results = results.filter((ad) =>
      wanted.some((w) => ad.services.some((s) => s.toLowerCase() === w)),
    );
  }
  if (filters.specialServices && filters.specialServices.length > 0) {
    const wanted = filters.specialServices.map((s) => s.toLowerCase());
    results = results.filter((ad) =>
      wanted.some((w) =>
        ad.specialServices.some((s) => s.toLowerCase() === w),
      ),
    );
  }
  if (filters.meetingContexts && filters.meetingContexts.length > 0) {
    const wanted = filters.meetingContexts.map((s) => s.toLowerCase());
    results = results.filter((ad) =>
      wanted.some((w) =>
        ad.meetingContexts.some((s) => s.toLowerCase().includes(w)),
      ),
    );
  }
  if (filters.attributes) {
    for (const [key, values] of Object.entries(filters.attributes)) {
      if (!values || values.length === 0) continue;
      results = results.filter((ad) => {
        const attr = ad.attributes[key as keyof typeof ad.attributes];
        if (typeof attr !== "string") return false;
        const lower = attr.toLowerCase();
        return values.some((v) => lower.includes(v.toLowerCase()));
      });
    }
  }

  switch (filters.sortBy) {
    case "price_asc":
      results.sort((a, b) => a.pricePerHour - b.pricePerHour);
      break;
    case "price_desc":
      results.sort((a, b) => b.pricePerHour - a.pricePerHour);
      break;
    case "rating":
      results.sort((a, b) => b.reputation.score - a.reputation.score);
      break;
    case "recent":
    default:
      results.sort((a, b) => {
        // Prioritize storyAt if present, otherwise updatedAt.
        const aTs = new Date(a.storyAt ?? a.updatedAt).getTime();
        const bTs = new Date(b.storyAt ?? b.updatedAt).getTime();
        return bTs - aTs;
      });
  }

  return results;
}

export async function listAll(
  filters: ListingsFilters = {},
): Promise<PaginatedListings> {
  const filtered = applyFilters(BIRINGA_LISTINGS, filters);
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);

  return { data, meta: { total, page, pageSize, totalPages } };
}

/**
 * Featured listings — verified + high score, sorted by daysFeatured.
 * Used by surfaces that want a curated list (home hero, OG previews, etc.).
 */
export async function listFeatured(
  limit = 8,
): Promise<ReadonlyArray<BiringaListing>> {
  return BIRINGA_LISTINGS.filter(
    (ad) => ad.verified && ad.reputation.score >= 4.5,
  )
    .slice()
    .sort((a, b) => b.reputation.daysFeatured - a.reputation.daysFeatured)
    .slice(0, limit);
}

/**
 * Editorial hero mosaic — curated mix surfaced on the home hero.
 * Composition: ~33% "live now" + ~33% top-rated verified + ~33% random.
 * The mix keeps the hero relevant (live + top) without being predictable.
 *
 * Why: founder wants the first surface to feel editorial, not algorithmic;
 * the curation is deterministic per request so SSR + hydration agree.
 */
/**
 * Hero mosaic — Bayesian-ranked hall of fame.
 *
 * Mirrors the Firestore adapter exactly so dev (mock) and prod render the
 * same hero. Bayesian smoothing keeps 5★/1-review entries out:
 *
 *   rank = score × (reviewCount / (reviewCount + C))
 *
 * With C=10 and a `reviewCount >= 3` floor a profile needs both stars AND
 * volume to crack the mosaic.
 */
const HERO_BAYESIAN_C = 10;
const HERO_MIN_REVIEWS = 3;

export async function listHeroMosaic(
  limit = 12,
): Promise<ReadonlyArray<BiringaListing>> {
  const verified = BIRINGA_LISTINGS.filter((ad) => ad.verified);

  const ranked = verified
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

  // Soft fallback for tiny catalogs — backfill by raw score.
  const seen = new Set(ranked.map((l) => l.id));
  const backfill = verified
    .filter((l) => !seen.has(l.id))
    .slice()
    .sort((a, b) => b.reputation.score - a.reputation.score)
    .slice(0, limit - ranked.length);
  return [...ranked, ...backfill];
}

export async function findBySlug(slug: string): Promise<BiringaListing | null> {
  return BIRINGA_LISTINGS.find((ad) => ad.slug === slug) ?? null;
}

export async function listCities(): Promise<ReadonlyArray<string>> {
  return SUPPORTED_CITIES;
}

export async function listServiceCatalog(): Promise<ReadonlyArray<string>> {
  return SERVICE_CATALOG;
}

export async function listMeetingContextCatalog(): Promise<
  ReadonlyArray<string>
> {
  return MEETING_CONTEXT_CATALOG;
}

export {
  APPEARANCE_CATALOG,
  ATTENTION_CATALOG,
  BIRINGA_LISTINGS,
  CATEGORIES,
  CONTACT_CATALOG,
  MEETING_CONTEXT_CATALOG,
  SERVICE_CATALOG,
  SPECIAL_SERVICE_CATALOG,
  SUPPORTED_CITIES,
};

export type {
  AttentionTarget,
  BiringaAttributes,
  BiringaListing,
  BiringaReputation,
  Category,
  ContactChannel,
  ListingsFilters,
  PaginatedListings,
  Sex,
} from "./types";

export { getListingReviews } from "./reviews";
export type {
  ReviewBreakdown,
  ReviewItem,
  ReviewsAggregate,
} from "./reviews";

export { listTestimonials } from "./testimonials";

export { getPrivateContactRaw } from "./private-contact";
export { submitReviewRaw } from "./submit-review";
export { createListingDraftRaw } from "./create-draft";
export { listSimilar } from "./similar";
