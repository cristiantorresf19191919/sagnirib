import "server-only";

import type {
  BiringaListing,
  ListingsFilters,
} from "@/server/biringas/types";

import { getDepartmentForCity } from "@/server/mocks/biringas/colombia-locations";

/**
 * Filters that we DO NOT push to Firestore (full-text, nested attribute maps,
 * multi-value array containment). They run in memory after the initial fetch.
 *
 * Why not all in Firestore? Three constraints:
 *   1. Firestore allows a single inequality field per query.
 *   2. `array-contains-any` accepts max 30 values — fine for our taxonomies
 *      but doubling up across array fields is illegal.
 *   3. Full-text search is not native — needs Algolia/Meilisearch.
 *
 * For the catalog scale (low thousands of listings) memory post-filtering
 * is correct and cheap. Push down the cheap predicates (category, city,
 * verified) and let the rest run in memory.
 */

function intersects<T>(a: ReadonlyArray<T>, b: ReadonlyArray<T>): boolean {
  if (a.length === 0 || b.length === 0) return false;
  return a.some((value) => b.includes(value));
}

export function applyMemoryFilters(
  source: ReadonlyArray<BiringaListing>,
  filters: ListingsFilters,
): BiringaListing[] {
  let results = [...source];

  if (filters.sex) {
    results = results.filter((ad) => ad.sex === filters.sex);
  }
  // Department is derived from the city (never stored); locality matches the
  // listing's neighborhood. City itself is pushed down to Firestore.
  if (filters.department) {
    results = results.filter(
      (ad) => getDepartmentForCity(ad.city) === filters.department,
    );
  }
  if (filters.locality) {
    const needle = filters.locality.toLowerCase();
    results = results.filter(
      (ad) => (ad.neighborhood ?? "").toLowerCase() === needle,
    );
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
        // Prioritize storyAt if present, otherwise updatedAt — Firestore
        // can't coalesce these in an orderBy, so it happens here.
        const aTs = new Date(a.storyAt ?? a.updatedAt).getTime();
        const bTs = new Date(b.storyAt ?? b.updatedAt).getTime();
        return bTs - aTs;
      });
  }

  return results;
}
