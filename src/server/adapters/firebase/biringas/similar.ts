import "server-only";

import { unstable_cache } from "next/cache";

import type { BiringaListing } from "@/server/biringas/types";
import { CACHE_TAGS } from "@/server/biringas/cache-tags";
import { getDb } from "@/server/adapters/firebase/client";
import { wrapFirestoreError } from "@/server/adapters/firebase/errors";
import { mapListing } from "@/server/mappers/firebase-biringa";

/**
 * Mirrors the mock heuristic (mocks/biringas/similar.ts) on top of Firestore.
 *
 * Strategy: push down the equality predicates (city, category) to Firestore
 * and apply the price/score band in memory. Firestore disallows two
 * inequality fields in one query, so the band cannot be pushed down.
 *
 * Falls back to "same city only" when the strict band returns nothing — the
 * caller (SimilarProfiles) should never render an empty rail when there is
 * any candidate at all.
 */
type ListingDocFields = Record<string, unknown>;

async function listSimilarUncached(
  slug: string,
  limit: number,
): Promise<ReadonlyArray<BiringaListing>> {
  const db = getDb();
  try {
    const sourceSnap = await db
      .collection("listings")
      .where("slug", "==", slug)
      .limit(1)
      .get();
    if (sourceSnap.empty) return [];
    const source = mapListing(
      sourceSnap.docs[0].id,
      sourceSnap.docs[0].data() as ListingDocFields,
    );

    const minPrice = source.pricePerHour * 0.7;
    const maxPrice = source.pricePerHour * 1.3;
    const minScore = Math.max(0, source.reputation.score - 0.3);
    const maxScore = Math.min(5, source.reputation.score + 0.3);

    const candSnap = await db
      .collection("listings")
      .where("city", "==", source.city)
      .where("category", "==", source.category)
      .limit(50)
      .get();
    const candidates = candSnap.docs
      .map((d) => mapListing(d.id, d.data() as ListingDocFields))
      .filter((ad) => ad.id !== source.id);

    const banded = candidates.filter(
      (ad) =>
        ad.pricePerHour >= minPrice &&
        ad.pricePerHour <= maxPrice &&
        ad.reputation.score >= minScore &&
        ad.reputation.score <= maxScore,
    );

    const pool = banded.length > 0 ? banded : candidates;

    return pool
      .slice()
      .sort((a, b) => {
        const score = b.reputation.score - a.reputation.score;
        if (score !== 0) return score;
        const days = b.reputation.daysFeatured - a.reputation.daysFeatured;
        if (days !== 0) return days;
        return a.slug.localeCompare(b.slug);
      })
      .slice(0, limit);
  } catch (err) {
    throw wrapFirestoreError("listSimilar", err);
  }
}

export async function listSimilar(
  slug: string,
  limit = 4,
): Promise<ReadonlyArray<BiringaListing>> {
  return unstable_cache(
    () => listSimilarUncached(slug, limit),
    ["listSimilar", slug, String(limit)],
    {
      tags: [CACHE_TAGS.listings, CACHE_TAGS.listing(slug)],
      revalidate: 300,
    },
  )();
}
