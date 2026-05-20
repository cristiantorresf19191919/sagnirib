import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { getDb } from "@/server/adapters/firebase/client";
import { wrapFirestoreError } from "@/server/adapters/firebase/errors";

/**
 * Flips a listing's `availableNow` flag.
 *
 * Resolves the listing by slug (the action layer has the slug, not the
 * doc id — same shape as `recordListingViewRaw`). Returns `false` when
 * no listing matches so the barrel can surface a friendly "ya no
 * existe" message instead of throwing.
 *
 * Bumps `updatedAt` so the catalog's default `orderBy('updatedAt')`
 * sort floats the listing back to the top when the owner flips it on
 * — a small reward for staying current with the toggle.
 *
 * Ownership is enforced by the barrel layer (the caller must own a
 * draft whose `preferredSlug === slug` and be `approved`). This
 * adapter trusts the wrapper.
 */
export async function setListingAvailableNowRaw(
  slug: string,
  available: boolean,
): Promise<boolean> {
  const db = getDb();
  try {
    const snap = await db
      .collection("listings")
      .where("slug", "==", slug)
      .limit(1)
      .get();
    if (snap.empty) return false;
    await snap.docs[0].ref.update({
      availableNow: available,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return true;
  } catch (err) {
    throw wrapFirestoreError("setListingAvailableNow", err);
  }
}
