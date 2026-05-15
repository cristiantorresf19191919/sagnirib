import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import type { CreateListingDraftRawInput } from "@/server/biringas/draft-types";
import { getDb } from "@/server/adapters/firebase/client";
import { wrapFirestoreError } from "@/server/adapters/firebase/errors";

/**
 * Writes a new draft under `listing_drafts/{auto-id}` (ADR-011).
 *
 * `status` is always `pending_review` at write time — promotion to
 * `approved` / `rejected` is admin-side and out of scope for this adapter.
 *
 * NEVER expose this directly — features call `createListingDraft` from the
 * barrel, which adds validate + requireAuth + audit + role-grant +
 * revalidate.
 *
 * Returns `{ id, hasOtherDrafts }`. `hasOtherDrafts` is consulted by the
 * barrel to decide whether to grant the `'model'` role (only on the very
 * first draft per user). Reading that flag here keeps the round-trip count
 * down — we already had to query Firestore.
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

  let id: string;
  try {
    const ref = await db.collection("listing_drafts").add({
      ownerUid: input.ownerUid,
      status: "pending_review",
      payload: serializePayload(input.payload),
      submittedAt,
      createdAt: FieldValue.serverTimestamp(),
    });
    id = ref.id;
  } catch (err) {
    throw wrapFirestoreError("createListingDraft:add", err);
  }

  return { id, hasOtherDrafts };
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
      gallery: [...payload.description.gallery],
    },
    publish: {
      ...payload.publish,
      addOnIds: [...payload.publish.addOnIds],
    },
  };
}
