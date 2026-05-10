import "server-only";

import { BIRINGA_LISTINGS } from "./data";
import type { BiringaListing } from "./types";

/**
 * Returns up to `limit` listings considered "similar" to the one with `slug`.
 *
 * Heuristic — purely deterministic so SSR + revalidation produce the same
 * ordering for any given input:
 *  1. Same city as the source listing.
 *  2. Price within ±30% of the source price.
 *  3. Score within ±0.3 of the source score (caps the gulf).
 *  4. Same category.
 *  5. Tied scores break on `daysFeatured` then on slug (stable).
 *
 * Returns an empty list when the source slug is unknown (the caller decides
 * how to render that — typically by skipping the rail entirely).
 */
export async function listSimilar(
  slug: string,
  limit = 4,
): Promise<ReadonlyArray<BiringaListing>> {
  const source = BIRINGA_LISTINGS.find((ad) => ad.slug === slug);
  if (!source) return [];

  const minPrice = source.pricePerHour * 0.7;
  const maxPrice = source.pricePerHour * 1.3;
  const minScore = Math.max(0, source.reputation.score - 0.3);
  const maxScore = Math.min(5, source.reputation.score + 0.3);

  const candidates = BIRINGA_LISTINGS.filter((ad) => ad.id !== source.id)
    .filter((ad) => ad.city === source.city)
    .filter((ad) => ad.category === source.category)
    .filter(
      (ad) => ad.pricePerHour >= minPrice && ad.pricePerHour <= maxPrice,
    )
    .filter(
      (ad) =>
        ad.reputation.score >= minScore && ad.reputation.score <= maxScore,
    );

  // Fallback — if the strict band returned nothing, relax to same city only
  // so the rail never renders empty when we have *any* nearby option.
  const pool =
    candidates.length > 0
      ? candidates
      : BIRINGA_LISTINGS.filter(
          (ad) => ad.id !== source.id && ad.city === source.city,
        );

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
}
