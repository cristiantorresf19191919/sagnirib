import "server-only";

/**
 * Mock counterpart for `recordListingViewRaw`.
 *
 * Mocks are dev-only and the seeded `totalViews` numbers are intentionally
 * baked into `data.ts` — incrementing here would diverge the seed snapshot
 * from what tests / Storybook assert against. No-op is the right move.
 */
export async function recordListingViewRaw(_slug: string): Promise<void> {
  // intentional no-op — see docstring
}
