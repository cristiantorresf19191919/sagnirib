/**
 * Plan-active check — shared between catalog surfaces, Server Components,
 * and Client Components. Pure function, no `server-only` import so the
 * "Destacada" badge logic can also run in the client when needed.
 *
 * Single source of truth for "is this listing on a paid plan right now?".
 * Call sites must NOT inline the date comparison — concentrate the
 * semantics here so a future change (grace periods, timezone handling,
 * tier-specific predicates) lives in one place.
 */

import type { PlanTier } from "./checkout-types";

interface PlanLike {
  plan?: {
    tier: PlanTier;
    activeUntil: string;
  };
}

/**
 * Returns `true` when the listing has any active paid plan. Drives the
 * "Destacada" badge on catalog cards and the `listFeatured` query.
 */
export function isPlanActive(listing: PlanLike, now: Date = new Date()): boolean {
  const plan = listing.plan;
  if (!plan) return false;
  const until = new Date(plan.activeUntil).getTime();
  if (!Number.isFinite(until)) return false;
  return now.getTime() < until;
}

/**
 * Returns the active plan tier, or `null` when no plan is active.
 * Used by surfaces that want tier-specific UI (e.g. a future "Elite"
 * ribbon distinct from the generic "Destacada" badge).
 */
export function activePlanTier(
  listing: PlanLike,
  now: Date = new Date(),
): PlanTier | null {
  if (!isPlanActive(listing, now)) return null;
  return listing.plan!.tier;
}
