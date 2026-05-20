"use server";

import { listAll } from "@/server/biringas";

export interface OnlineFavorite {
  id: string;
  slug: string;
  name: string;
}

/**
 * Server Action: given a list of favorite listing ids, return the
 * subset that is currently `availableNow`. Used by `BackOnlinePill`
 * to surface "your favorite just came online" without requiring a
 * full catalog snapshot in the client bundle.
 *
 * Implementation: leans on the existing `listAll` reader (paged) and
 * filters in memory. The mock catalog is tiny (≈18 entries) so this
 * is fine; when this goes to Firestore, swap to a `findByIds(ids)`
 * indexed query — the action signature stays the same.
 *
 * Anonymous-safe (no auth). The favorites set is client-only data the
 * caller already owns, so this is just a public "are these online?"
 * probe — no privacy surface to gate.
 */
export async function findOnlineFavorites(
  ids: ReadonlyArray<string>,
): Promise<ReadonlyArray<OnlineFavorite>> {
  if (!Array.isArray(ids) || ids.length === 0) return [];

  // Hard cap so a malicious / accidental caller can't ask for the
  // whole catalog. Favorites store caps at ~50 client-side; the
  // server cap here is the belt-and-suspenders version.
  const safeIds = ids
    .filter((s): s is string => typeof s === "string" && s.length > 0)
    .slice(0, 100);
  if (safeIds.length === 0) return [];
  const idSet = new Set(safeIds);

  try {
    const { data } = await listAll({ pageSize: 200 });
    return data
      .filter((listing) => idSet.has(listing.id) && listing.availableNow)
      .map((listing) => ({
        id: listing.id,
        slug: listing.slug,
        name: listing.name,
      }));
  } catch (err) {
    console.error("[favorites] findOnlineFavorites failed", err);
    return [];
  }
}
