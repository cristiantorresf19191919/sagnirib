import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { getDb } from "@/server/adapters/firebase/client";
import { wrapFirestoreError } from "@/server/adapters/firebase/errors";

/**
 * Increments the public view counter on a listing.
 *
 * Resolves the listing by slug because the catalog already keys public reads
 * that way (see `findBySlug`) — the action layer has the slug, not the doc id.
 * Silently returns when no listing matches the slug so a probing visit to a
 * stale URL does not throw on render.
 *
 * Dedupe (per-session cookie) is enforced by the Server Action wrapper in
 * `@/server/biringas`, not here — this adapter is the dumb increment.
 */
export async function recordListingViewRaw(slug: string): Promise<void> {
  const db = getDb();
  try {
    const snap = await db
      .collection("listings")
      .where("slug", "==", slug)
      .limit(1)
      .get();
    if (snap.empty) return;
    await snap.docs[0].ref.update({
      "reputation.totalViews": FieldValue.increment(1),
    });
  } catch (err) {
    throw wrapFirestoreError("recordListingView", err);
  }
}
