import "server-only";

import type { PlanTier } from "@/server/biringas/checkout-types";

import { BIRINGA_LISTINGS } from "./data";

/**
 * Mock counterpart for `setListingPlanRaw`.
 *
 * Mutates the seed listing's `plan` field in place. BIRINGA_LISTINGS
 * is a `const` array but the listing objects inside are mutable —
 * same pattern as `setListingAvailableNowRaw` and
 * `setListingReplyMedianMinutesRaw`.
 *
 * Pass `null` to clear the plan (expired window, refund flow). The
 * read-time `isPlanActive(listing)` helper already treats absent +
 * past `activeUntil` identically, so clearing on expiry is cosmetic
 * but keeps the doc clean.
 *
 * Tolerant of stale slugs (no-op when nothing matches). Returns
 * `true` when the listing existed and was updated.
 */
export async function setListingPlanRaw(
  slug: string,
  plan: { tier: PlanTier; activeUntil: string } | null,
): Promise<boolean> {
  const listing = BIRINGA_LISTINGS.find((l) => l.slug === slug);
  if (!listing) return false;
  const mutable = listing as {
    plan?: { tier: PlanTier; activeUntil: string };
  };
  if (plan === null) {
    delete mutable.plan;
  } else {
    mutable.plan = plan;
  }
  return true;
}
