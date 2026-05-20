import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import type { CreateListingDraftRawInput } from "@/server/biringas/draft-types";
import { getDb } from "@/server/adapters/firebase/client";
import { wrapFirestoreError } from "@/server/adapters/firebase/errors";

/**
 * Writes a new draft under `listing_drafts/{draftId}` (ADR-011).
 *
 * `status` is always `pending_review` at write time — promotion to
 * `approved` / `rejected` is admin-side and out of scope for this adapter.
 *
 * The `draftId` is supplied by the barrel (server-minted UUID v4) so the
 * Storage `copyStagedToDraftForOwner` call can address the same id BEFORE
 * the Firestore row exists. If the Firestore write fails after the copy,
 * the resulting orphan blobs are recoverable via the admin sweep.
 *
 * NEVER expose this directly — features call `createListingDraft` from the
 * barrel, which adds validate + requireAuth + audit + role-grant +
 * revalidate.
 *
 * Returns `{ id, hasOtherDrafts }`. `hasOtherDrafts` decides the role-grant
 * branch in the barrel (only on the very first draft per user).
 */
export async function createListingDraftRaw(
  input: CreateListingDraftRawInput,
): Promise<{ id: string; hasOtherDrafts: boolean }> {
  const db = getDb();
  const submittedAt = Timestamp.now();

  // Cheap probe: does this user already have any draft? Decides role-grant.
  // We do not block resubmissions — multiple drafts per ownerUid are allowed.
  let hasOtherDrafts = false;
  try {
    const prior = await db
      .collection("listing_drafts")
      .where("ownerUid", "==", input.ownerUid)
      .limit(1)
      .get();
    hasOtherDrafts = !prior.empty;
  } catch (err) {
    throw wrapFirestoreError("createListingDraft:probePrior", err);
  }

  try {
    await db.collection("listing_drafts").doc(input.draftId).set({
      ownerUid: input.ownerUid,
      status: "pending_review",
      payload: serializePayload(input.payload),
      submittedAt,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    throw wrapFirestoreError("createListingDraft:set", err);
  }

  return { id: input.draftId, hasOtherDrafts };
}

/**
 * Probe used for slug uniqueness — returns whether ANY non-rejected draft
 * already claims this `preferredSlug`. Called by the barrel BEFORE writing
 * a new draft so the caller gets a clean error message instead of two
 * drafts racing for the same slug at admin-approval time.
 *
 * Uses Firestore's automatic single-field index on `payload.details.preferredSlug`.
 * Status is filtered in memory (rejected drafts are NOT a conflict — the
 * modelo can re-submit with the same slug after a rejection). Trading a
 * tiny read overhead (a handful of docs per slug) for one fewer composite
 * index to maintain.
 */
export async function findActiveDraftBySlug(slug: string): Promise<boolean> {
  const db = getDb();
  try {
    const snap = await db
      .collection("listing_drafts")
      .where("payload.details.preferredSlug", "==", slug)
      .limit(20)
      .get();
    for (const doc of snap.docs) {
      const status = (doc.data() as { status?: unknown }).status;
      if (status === "pending_review" || status === "approved") {
        return true;
      }
    }
    return false;
  } catch (err) {
    throw wrapFirestoreError("findActiveDraftBySlug", err);
  }
}

/**
 * Firestore tolerates plain JS values inside maps, but readonly arrays from
 * TS need to be made writable so the SDK does not complain. Otherwise the
 * payload is stored as-is — domain shape is the contract.
 */
function serializePayload(
  payload: CreateListingDraftRawInput["payload"],
): Record<string, unknown> {
  return {
    details: {
      ...payload.details,
      attention: [...payload.details.attention],
      contactChannels: [...payload.details.contactChannels],
    },
    description: {
      ...payload.description,
      services: [...payload.description.services],
      meetingContexts: [...payload.description.meetingContexts],
      gallery: payload.description.gallery.map((g) => ({ path: g.path })),
    },
    attributes: {
      ...payload.attributes,
      languages: [...payload.attributes.languages],
    },
    publish: {
      ...payload.publish,
      addOnIds: [...payload.publish.addOnIds],
    },
  };
}
