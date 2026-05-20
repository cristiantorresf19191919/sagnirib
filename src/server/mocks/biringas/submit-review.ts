import "server-only";

import type { SubmitReviewRawInput } from "@/server/biringas/review-types";

/**
 * Mock-side `submitReviewRaw`. Reachable in practice ONLY from tests, since
 * in mock mode `requireAuth()` throws (no auth provider) so the barrel
 * never gets here. Tests can still exercise the call shape via direct
 * adapter import.
 *
 * Implementation: process-scoped in-memory map. Sufficient for unit tests
 * to exercise duplicate detection and id assignment. Cleared per process.
 *
 * The Firestore adapter recomputes the parent listing's
 * `reputation.reviewCount` + `reputation.score` inside a transaction
 * (see `adapters/firebase/biringas/submit-review.ts`). The mock does
 * NOT mutate the seed array — BIRINGA_LISTINGS is a const fixture and
 * production-style aggregate behavior is tested against the Firestore
 * adapter, not the mock.
 */

const writes = new Map<string, Set<string>>(); // slug → Set<authorUid>

export async function submitReviewRaw(
  input: SubmitReviewRawInput,
): Promise<{ id: string }> {
  const seen = writes.get(input.listingSlug) ?? new Set<string>();
  if (seen.has(input.authorUid)) {
    throw new Error("submitReview: this user already reviewed this listing");
  }
  seen.add(input.authorUid);
  writes.set(input.listingSlug, seen);
  return { id: input.authorUid };
}

/** Test-only escape hatch — clears the in-memory store. */
export function __resetSubmitReviewMock(): void {
  writes.clear();
}
