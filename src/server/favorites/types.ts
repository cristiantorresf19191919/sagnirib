import "server-only";

/**
 * Domain types for the favorites port (ADR-013).
 *
 * Provider types (Firestore Timestamp, doc refs) MUST NOT leak through
 * this module. The adapter / mapper layers are the only places that
 * touch SDK shapes.
 */

/**
 * A single favorited listing belonging to a user. The doc id equals
 * `listingId` so re-adding the same listing is a deterministic
 * upsert (idempotent) instead of producing duplicate rows.
 */
export interface FavoriteRecord {
  /** Opaque Firestore listing id (matches `BiringaListing.id`). */
  listingId: string;
  /**
   * Slug snapshot at the time of favoriting. Survives renames of the
   * underlying listing — used for display fallback when the listing
   * has been deleted or the slug has changed since.
   */
  listingSlug: string;
  /** ISO timestamp of when the favorite was added. */
  addedAt: string;
}

/**
 * Public input shape for `addFavorite`. The `uid` is derived from the
 * authenticated session in the barrel — features must never pass it.
 */
export interface AddFavoriteInput {
  listingId: string;
  listingSlug: string;
}

/**
 * Adapter-internal input — includes the server-derived `uid`.
 * Features must NOT construct this directly; they go through the
 * barrel's `addFavorite()`.
 */
export interface AddFavoriteRawInput extends AddFavoriteInput {
  uid: string;
}

export interface RemoveFavoriteInput {
  listingId: string;
}

export interface RemoveFavoriteRawInput extends RemoveFavoriteInput {
  uid: string;
}

/**
 * Limits enforced by the schema. Centralised so UI can mirror them
 * — the server stays the source of truth.
 */
export const FAVORITE_LIMITS = {
  listingIdMax: 200,
  listingSlugMax: 200,
  /**
   * Hard cap per user. Beyond this, `addFavorite` rejects with a
   * typed error so the UI can surface a friendly "demasiadas
   * favoritas" toast. Prevents both UI sprawl and write-rate abuse.
   */
  perUserMax: 500,
} as const;
