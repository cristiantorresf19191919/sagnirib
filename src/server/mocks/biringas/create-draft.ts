import "server-only";

import type { CreateListingDraftRawInput } from "@/server/biringas/draft-types";

/**
 * In-memory mock of `createListingDraftRaw` for `dev` without Firebase.
 *
 * Process-local — restart wipes the queue. Enough for demoing the loop
 * end-to-end (submit → success screen → audit log line in console).
 */

interface StoredDraft {
  id: string;
  ownerUid: string;
  status: "pending_review";
  payload: CreateListingDraftRawInput["payload"];
  submittedAt: Date;
}

const DRAFTS: StoredDraft[] = [];

export async function createListingDraftRaw(
  input: CreateListingDraftRawInput,
): Promise<{ id: string; hasOtherDrafts: boolean }> {
  const hasOtherDrafts = DRAFTS.some((d) => d.ownerUid === input.ownerUid);
  DRAFTS.push({
    id: input.draftId,
    ownerUid: input.ownerUid,
    status: "pending_review",
    payload: input.payload,
    submittedAt: new Date(),
  });
  return { id: input.draftId, hasOtherDrafts };
}

/**
 * Mock parity for `findActiveDraftBySlug`. Active = not rejected. Mock
 * doesn't model rejection yet, so every stored draft counts as active.
 */
export async function findActiveDraftBySlug(slug: string): Promise<boolean> {
  return DRAFTS.some((d) => d.payload.details.preferredSlug === slug);
}
