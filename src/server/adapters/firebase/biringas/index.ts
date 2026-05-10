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
    const snap = await db
      .collection("listings")
      .where("verified", "==", true)
      .where("reputation.score", ">=", 4.5)
      .orderBy("reputation.score", "desc")
      .orderBy("reputation.daysFeatured", "desc")
      .limit(limit * 2)
      .get();
    const docs = snap.docs.map((doc) =>
      mapListing(doc.id, doc.data() as ListingDocFields),
    );
    return docs
      .slice()
      .sort(
        (a, b) =>
          b.reputation.daysFeatured - a.reputation.daysFeatured,
      )
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

async function listHeroMosaicUncached(
  limit: number,
): Promise<ReadonlyArray<BiringaListing>> {
  const db = getDb();
  const liveTarget = Math.ceil(limit / 3);
  const topTarget = Math.ceil(limit / 3);
  const seen = new Set<string>();
  const pick = (ad: BiringaListing) => {
    if (seen.has(ad.id)) return false;
    seen.add(ad.id);
    return true;
  };

  let live: BiringaListing[] = [];
  let top: BiringaListing[] = [];
  let pool: BiringaListing[] = [];

  try {
    const [liveSnap, topSnap, poolSnap] = await Promise.all([
      db
        .collection("listings")
        .where("verified", "==", true)
        .where("availableNow", "==", true)
        .orderBy("updatedAt", "desc")
        .limit(liveTarget * 2)
        .get(),
      db
        .collection("listings")
        .where("verified", "==", true)
        .where("reputation.score", ">=", 4.7)
        .orderBy("reputation.score", "desc")
        .limit(topTarget * 2)
        .get(),
      db
        .collection("listings")
        .where("verified", "==", true)
        .orderBy("updatedAt", "desc")
        .limit(limit * 2)
        .get(),
    ]);

    live = liveSnap.docs
      .map((d) => mapListing(d.id, d.data() as ListingDocFields))
      .filter(pick)
      .slice(0, liveTarget);
    top = topSnap.docs
      .map((d) => mapListing(d.id, d.data() as ListingDocFields))
      .filter(pick)
      .slice(0, topTarget);
    pool = poolSnap.docs
      .map((d) => mapListing(d.id, d.data() as ListingDocFields))
      .filter(pick);
  } catch (err) {
    throw wrapFirestoreError("listHeroMosaic", err);
  }

  // Deterministic fill so SSR is stable per request body.
  const remaining = limit - live.length - top.length;
  const seed = pool.reduce((acc, ad) => acc + ad.id.length, 0);
  const fill: BiringaListing[] = [];
  for (let i = 0; i < remaining && pool.length > 0; i += 1) {
    const idx = (seed + i * 13) % pool.length;
    const [item] = pool.splice(idx, 1);
    if (item) fill.push(item);
  }

  return [...live, ...top, ...fill].slice(0, limit);
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
      revalidate: 300,
    },
  )();
}

export {
  listCities,
  listServiceCatalog,
  listMeetingContextCatalog,
} from "./catalogs";
export { getListingReviews } from "./reviews";
export { getPrivateContactRaw } from "./private-contact";
export { submitReviewRaw } from "./submit-review";
