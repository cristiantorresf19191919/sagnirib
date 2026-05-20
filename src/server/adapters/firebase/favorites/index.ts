import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getDb } from "@/server/adapters/firebase/client";
import {
  FirebaseAdapterError,
  wrapFirestoreError,
} from "@/server/adapters/firebase/errors";
import {
  FAVORITE_LIMITS,
  type AddFavoriteInput,
  type AddFavoriteRawInput,
  type FavoriteRecord,
  type RemoveFavoriteRawInput,
} from "@/server/favorites/types";

/**
 * Firestore adapter for the favorites port (ADR-013).
 *
 * Layout: `favorites/{uid}/items/{listingId}`. The parent `{uid}` doc
 * is empty — Firestore materialises it implicitly when the first item
 * is written, and the adapter never reads it directly.
 *
 * All entry points are auth-gated at the barrel layer; this adapter
 * accepts the uid as an input and trusts the wrapper. The audit script
 * (`pnpm firebase:audit`) keeps any feature from reaching these
 * functions without going through `@/server/favorites`.
 */

const COLLECTION_ROOT = "favorites";
const ITEMS_SUBCOLLECTION = "items";

function itemsCollection(uid: string) {
  return getDb()
    .collection(COLLECTION_ROOT)
    .doc(uid)
    .collection(ITEMS_SUBCOLLECTION);
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

/**
 * Returns the listing ids the user has favorited, newest-first. Empty
 * array for users with no favorites yet (Firestore returns an empty
 * snapshot for a non-existent parent — no special-case needed).
 */
export async function listMyFavoritesRaw(
  uid: string,
): Promise<ReadonlyArray<string>> {
  try {
    const snap = await itemsCollection(uid)
      .orderBy("addedAt", "desc")
      .limit(FAVORITE_LIMITS.perUserMax)
      .get();
    return snap.docs.map((d) => d.id);
  } catch (err) {
    throw wrapFirestoreError("favorites:listMine", err);
  }
}

/**
 * Idempotent add. Uses `set({merge:true})` so re-adding the same
 * listing refreshes `addedAt` without throwing, but the limit check
 * runs first so a user at the cap cannot resurrect a stale write.
 */
export async function addFavoriteRaw(
  input: AddFavoriteRawInput,
): Promise<FavoriteRecord> {
  const col = itemsCollection(input.uid);
  const ref = col.doc(input.listingId);

  try {
    // Limit check — read the current size before writing. Two-step
    // (count + write) is fine for the personal-shortlist write rate
    // (a few per minute at peak). A transaction would only matter
    // under bursty concurrent writes that this product does not see.
    const existing = await ref.get();
    if (!existing.exists) {
      const total = await col.count().get();
      const count = total.data().count;
      if (count >= FAVORITE_LIMITS.perUserMax) {
        throw new FirebaseAdapterError(
          "invalid-argument",
          `addFavorite: per-user limit reached (${FAVORITE_LIMITS.perUserMax})`,
        );
      }
    }

    const payload = {
      listingId: input.listingId,
      listingSlug: input.listingSlug,
      addedAt: FieldValue.serverTimestamp(),
    };
    await ref.set(payload, { merge: true });

    // Read-back to expose the materialised timestamp without a second
    // round-trip in normal operation. If the doc was just created, the
    // serverTimestamp resolves on the read.
    const written = await ref.get();
    const data = written.data() ?? {};
    return {
      listingId: input.listingId,
      listingSlug: input.listingSlug,
      addedAt: toIso(data.addedAt),
    };
  } catch (err) {
    if (err instanceof FirebaseAdapterError) throw err;
    throw wrapFirestoreError("favorites:add", err);
  }
}

/**
 * Idempotent remove. Firestore `delete()` on a non-existent doc is a
 * no-op, so `{ removed: false }` is computed from the prior existence
 * check rather than from the delete itself.
 */
export async function removeFavoriteRaw(
  input: RemoveFavoriteRawInput,
): Promise<{ removed: boolean }> {
  const ref = itemsCollection(input.uid).doc(input.listingId);
  try {
    const existing = await ref.get();
    if (!existing.exists) return { removed: false };
    await ref.delete();
    return { removed: true };
  } catch (err) {
    throw wrapFirestoreError("favorites:remove", err);
  }
}

/**
 * Bulk upsert used by the anonymous → signed-in merge path. Skips
 * entries already present so the user-facing `addedAt` order reflects
 * the original favoriting order, not the moment of sign-in. Batches
 * writes so a 50-item shortlist costs one round-trip.
 *
 * Returns `{ written, skipped }` so the action layer can decide
 * whether the merge is worth surfacing in the UI.
 */
export async function syncFavoritesRaw(input: {
  uid: string;
  items: ReadonlyArray<AddFavoriteInput>;
}): Promise<{ written: number; skipped: number }> {
  if (input.items.length === 0) return { written: 0, skipped: 0 };

  const col = itemsCollection(input.uid);
  try {
    const refs = input.items.map((it) => col.doc(it.listingId));
    const snaps = await getDb().getAll(...refs);
    const batch = getDb().batch();
    let written = 0;
    let skipped = 0;

    // Pre-write headroom check — fail fast instead of writing half
    // the batch and then erroring on the cap.
    const total = await col.count().get();
    const startingCount = total.data().count;
    const wouldBe =
      startingCount +
      snaps.filter((s) => !s.exists).length;
    if (wouldBe > FAVORITE_LIMITS.perUserMax) {
      throw new FirebaseAdapterError(
        "invalid-argument",
        `syncFavorites: merge would exceed per-user limit (${FAVORITE_LIMITS.perUserMax})`,
      );
    }

    for (let i = 0; i < input.items.length; i += 1) {
      const item = input.items[i]!;
      if (snaps[i]!.exists) {
        skipped += 1;
        continue;
      }
      batch.set(
        refs[i]!,
        {
          listingId: item.listingId,
          listingSlug: item.listingSlug,
          addedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      written += 1;
    }

    if (written > 0) await batch.commit();
    return { written, skipped };
  } catch (err) {
    if (err instanceof FirebaseAdapterError) throw err;
    throw wrapFirestoreError("favorites:sync", err);
  }
}
