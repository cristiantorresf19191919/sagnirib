import "server-only";

/**
 * Cache tags for the favorites port (ADR-013).
 *
 * Per-user only by design — favorites are private and a cross-cutting
 * tag would invalidate every user's cache on every write. The barrel's
 * mutations call `updateTag(CACHE_TAGS.user(uid))` so the next Server
 * Component render for that user re-reads the shortlist.
 */
export const FAVORITES_CACHE_TAGS = {
  user: (uid: string) => `favorites:user:${uid}`,
} as const;
