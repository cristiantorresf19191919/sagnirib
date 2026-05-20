import "server-only";

import { updateTag } from "next/cache";

import { isFirebaseConfigured } from "@/core/config/firebase";
import { auditLog } from "@/server/security/audit-log";
import { requireAuth } from "@/server/security/require-auth";
import { validateActionInput } from "@/server/security/validate-action-input";

import { FAVORITES_CACHE_TAGS } from "./cache-tags";
import { addFavoriteSchema, removeFavoriteSchema } from "./schemas";
import {
  FAVORITE_LIMITS,
  type AddFavoriteInput,
  type FavoriteRecord,
  type RemoveFavoriteInput,
} from "./types";

/**
 * Public barrel for the favorites port (ADR-013).
 *
 * Features import from here ONLY — never from `@/server/mocks/...` or
 * `@/server/adapters/...` directly. The barrel routes dynamic data access
 * to the configured provider at module load:
 *
 *   - `FIREBASE_*` env vars set  → Firestore adapter
 *   - otherwise                  → in-memory mock (dev-friendly fallback)
 */

export type {
  AddFavoriteInput,
  FavoriteRecord,
  RemoveFavoriteInput,
} from "./types";
export { FAVORITE_LIMITS } from "./types";
export { FAVORITES_CACHE_TAGS } from "./cache-tags";

const adapter = isFirebaseConfigured()
  ? await import("@/server/adapters/firebase/favorites")
  : await import("@/server/mocks/favorites");

const listMyFavoritesRaw = adapter.listMyFavoritesRaw;
const addFavoriteRaw = adapter.addFavoriteRaw;
const removeFavoriteRaw = adapter.removeFavoriteRaw;
const syncFavoritesRaw = adapter.syncFavoritesRaw;

/**
 * Returns the listing ids the current user has saved, newest-first.
 * Anonymous callers receive an empty array — no auth error is thrown
 * because every Server Component that hydrates the favorites provider
 * needs to call this and gracefully render the anonymous state.
 *
 * NOT audited — reads are frequent and cheap, and the auth log is
 * reserved for writes per ADR-010 §5.
 */
export async function listMyFavorites(): Promise<ReadonlyArray<string>> {
  const { getSession } = await import("@/server/auth");
  const user = await getSession();
  if (!user) return [];
  return listMyFavoritesRaw(user.uid);
}

/**
 * Adds a listing to the current user's favorites.
 *
 * Idempotent — re-adding an already-favorited listing returns `null`
 * for `addedAt` so the caller can detect the no-op (rare; the UI
 * normally hides the toggle when already saved). Auth-gated;
 * anonymous callers receive `AuthError("no-session")` — the client
 * `useFavorites` hook short-circuits anonymous writes so this path
 * only fires for signed-in users.
 *
 * Enforces `FAVORITE_LIMITS.perUserMax`. Beyond the cap, throws
 * `kind: 'limit-exceeded'` so the action wrapper can surface a
 * friendly toast.
 */
export async function addFavorite(
  rawInput: unknown,
): Promise<FavoriteRecord> {
  const input: AddFavoriteInput = validateActionInput(
    addFavoriteSchema,
    rawInput,
  );
  const user = await requireAuth();

  const result = await addFavoriteRaw({
    uid: user.uid,
    listingId: input.listingId,
    listingSlug: input.listingSlug,
  });

  await auditLog({
    event: "biringa.favorite.added",
    actorId: user.uid,
    resource: `listing:${input.listingId}`,
  });

  updateTag(FAVORITES_CACHE_TAGS.user(user.uid));

  return result;
}

/**
 * Removes a listing from the current user's favorites. Idempotent —
 * removing nothing returns `{ removed: false }` and is not an error.
 */
export async function removeFavorite(
  rawInput: unknown,
): Promise<{ removed: boolean }> {
  const input: RemoveFavoriteInput = validateActionInput(
    removeFavoriteSchema,
    rawInput,
  );
  const user = await requireAuth();

  const result = await removeFavoriteRaw({
    uid: user.uid,
    listingId: input.listingId,
  });

  await auditLog({
    event: "biringa.favorite.removed",
    actorId: user.uid,
    resource: `listing:${input.listingId}`,
  });

  updateTag(FAVORITES_CACHE_TAGS.user(user.uid));

  return result;
}

/**
 * Bulk-merge anonymous favorites into the server-side set after
 * sign-in. Each entry is upserted (idempotent at the doc-id level);
 * the response reports the count actually written so the client can
 * decide whether to surface a toast ("X favoritas guardadas").
 *
 * One audit event for the whole batch — rapid-fire per-id events
 * after sign-in would dwarf the action's actual information content.
 */
export async function syncFavoritesFromAnonymous(
  rawInput: unknown,
): Promise<{ written: number; skipped: number }> {
  if (!rawInput || typeof rawInput !== "object") {
    throw new Error("syncFavorites: input must be an object");
  }
  const r = rawInput as Record<string, unknown>;
  const items = Array.isArray(r.items) ? r.items : null;
  if (!items) {
    throw new Error("syncFavorites: items must be an array");
  }
  // Validate each pair through the same schema as `addFavorite` so the
  // server treats the bulk path with the same input rigour as the
  // singular one.
  const parsed: AddFavoriteInput[] = items.map((raw) =>
    validateActionInput(addFavoriteSchema, raw),
  );
  if (parsed.length === 0) {
    return { written: 0, skipped: 0 };
  }
  if (parsed.length > FAVORITE_LIMITS.perUserMax) {
    const err = new Error(
      `syncFavorites: too many items (max ${FAVORITE_LIMITS.perUserMax})`,
    );
    (err as { kind?: string }).kind = "limit-exceeded";
    throw err;
  }

  const user = await requireAuth();
  const result = await syncFavoritesRaw({
    uid: user.uid,
    items: parsed,
  });

  await auditLog({
    event: "biringa.favorite.synced",
    actorId: user.uid,
    resource: `user:${user.uid}`,
    metadata: { count: result.written },
  });

  updateTag(FAVORITES_CACHE_TAGS.user(user.uid));

  return result;
}
