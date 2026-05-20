import "server-only";

import { BIRINGA_LISTINGS } from "./data";

/**
 * Mock counterpart for `setListingAvailableNowRaw`.
 *
 * Mutates the seed listing's `availableNow` flag in place. BIRINGA_LISTINGS
 * is a `const` array, but the listing objects inside it are JavaScript-
 * mutable — same pattern used by `setListingReplyMedianMinutesRaw`.
 *
 * Tolerant of stale slugs (no-op when nothing matches). Returns `true`
 * when the listing existed and was updated, `false` otherwise — the
 * barrel uses this to surface a friendly "ya no existe" message
 * instead of throwing.
 *
 * In production mock mode `requireAuth()` throws (no auth provider)
 * so this function is only reachable from tests / direct adapter
 * imports.
 */
export async function setListingAvailableNowRaw(
  slug: string,
  available: boolean,
): Promise<boolean> {
  const listing = BIRINGA_LISTINGS.find((l) => l.slug === slug);
  if (!listing) return false;
  // Need an `any`-style cast because availableNow is declared as
  // `boolean` (not `readonly`) but `BIRINGA_LISTINGS` is typed as a
  // ReadonlyArray of immutable records in some surfaces — at runtime
  // the object is plain.
  (listing as { availableNow: boolean }).availableNow = available;
  return true;
}
