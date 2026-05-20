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

/**
 * Lightweight projection of a stored draft for surfaces that only need
 * the owner-facing summary (dashboard "Mi perfil" tab). Server-only —
 * features import the typed barrel function in `@/server/biringas`.
 */
export interface DraftSummary {
  id: string;
  preferredSlug: string;
  displayName: string;
  city: string;
  category: string;
  status: "pending_review";
  submittedAt: string;
}

/**
 * Returns all drafts owned by the given user, newest-first. Used by the
 * seller dashboard to render the "Mi perfil" tab and to compute which
 * listing slugs the inbox should filter incoming bookings by.
 */
export async function listDraftsByOwnerRaw(
  ownerUid: string,
): Promise<ReadonlyArray<DraftSummary>> {
  return DRAFTS.filter((d) => d.ownerUid === ownerUid)
    .map((d) => ({
      id: d.id,
      preferredSlug: d.payload.details.preferredSlug,
      displayName: d.payload.details.displayName,
      city: d.payload.details.city,
      category: d.payload.details.category,
      status: d.status,
      submittedAt: d.submittedAt.toISOString(),
    }))
    .sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() -
        new Date(a.submittedAt).getTime(),
    );
}
