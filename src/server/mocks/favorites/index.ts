import "server-only";

import {
  FAVORITE_LIMITS,
  type AddFavoriteInput,
  type AddFavoriteRawInput,
  type FavoriteRecord,
  type RemoveFavoriteRawInput,
} from "@/server/favorites/types";

/**
 * Mock counterpart for the favorites port (ADR-013).
 *
 * Process-scoped in-memory map keyed by `uid`. Same call shape as the
 * Firestore adapter so the barrel routes either at module load without
 * features noticing.
 *
 * In production mock mode `requireAuth()` throws (no auth provider), so
 * the barrel never actually reaches `addFavoriteRaw` / `removeFavoriteRaw`.
 * `listMyFavoritesRaw` is reachable because the barrel calls it through
 * `getSession()` (which returns `null` in the mock), but the barrel
 * short-circuits with an empty array before consulting the adapter.
 *
 * Tests can still exercise the raw shape via direct adapter import,
 * which is why the storage and the cap are still enforced.
 */

interface StoredItem {
  listingId: string;
  listingSlug: string;
  addedAtMs: number;
}

const STORE = new Map<string, StoredItem[]>(); // uid → newest-first

function getList(uid: string): StoredItem[] {
  let list = STORE.get(uid);
  if (!list) {
    list = [];
    STORE.set(uid, list);
  }
  return list;
}

function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

export async function listMyFavoritesRaw(
  uid: string,
): Promise<ReadonlyArray<string>> {
  return getList(uid).map((it) => it.listingId);
}

export async function addFavoriteRaw(
  input: AddFavoriteRawInput,
): Promise<FavoriteRecord> {
  const list = getList(input.uid);
  const existingIdx = list.findIndex((it) => it.listingId === input.listingId);
  if (existingIdx < 0 && list.length >= FAVORITE_LIMITS.perUserMax) {
    const err = new Error(
      `addFavorite: per-user limit reached (${FAVORITE_LIMITS.perUserMax})`,
    );
    (err as { kind?: string }).kind = "invalid-argument";
    throw err;
  }
  // Idempotent upsert — refresh the timestamp so re-adding moves the
  // item to the top of the list, matching Firestore's `set({merge:true})`
  // behavior with `serverTimestamp()`.
  const now = Date.now();
  const item: StoredItem = {
    listingId: input.listingId,
    listingSlug: input.listingSlug,
    addedAtMs: now,
  };
  if (existingIdx >= 0) list.splice(existingIdx, 1);
  list.unshift(item);
  return {
    listingId: item.listingId,
    listingSlug: item.listingSlug,
    addedAt: toIso(item.addedAtMs),
  };
}

export async function removeFavoriteRaw(
  input: RemoveFavoriteRawInput,
): Promise<{ removed: boolean }> {
  const list = getList(input.uid);
  const idx = list.findIndex((it) => it.listingId === input.listingId);
  if (idx < 0) return { removed: false };
  list.splice(idx, 1);
  return { removed: true };
}

export async function syncFavoritesRaw(input: {
  uid: string;
  items: ReadonlyArray<AddFavoriteInput>;
}): Promise<{ written: number; skipped: number }> {
  if (input.items.length === 0) return { written: 0, skipped: 0 };
  const list = getList(input.uid);
  const existingIds = new Set(list.map((it) => it.listingId));
  const newItems = input.items.filter((it) => !existingIds.has(it.listingId));
  if (list.length + newItems.length > FAVORITE_LIMITS.perUserMax) {
    const err = new Error(
      `syncFavorites: merge would exceed per-user limit (${FAVORITE_LIMITS.perUserMax})`,
    );
    (err as { kind?: string }).kind = "invalid-argument";
    throw err;
  }
  const now = Date.now();
  // Preserve incoming order — newest in the array becomes newest in the
  // list, matching the Firestore variant that uses a single
  // serverTimestamp tick for the whole batch.
  for (const it of newItems) {
    list.unshift({
      listingId: it.listingId,
      listingSlug: it.listingSlug,
      addedAtMs: now,
    });
  }
  return {
    written: newItems.length,
    skipped: input.items.length - newItems.length,
  };
}

/** Test-only escape hatch — clears the in-memory store. */
export function __resetFavoritesMock(): void {
  STORE.clear();
}
