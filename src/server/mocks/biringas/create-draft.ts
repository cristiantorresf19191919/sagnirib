import "server-only";

import type {
  CreateListingDraftRawInput,
  ListingDraftRecord,
  ListingDraftStatus,
} from "@/server/biringas/draft-types";

/**
 * In-memory mock of `createListingDraftRaw` for `dev` without Firebase.
 *
 * Process-local — restart wipes the queue. Enough for demoing the loop
 * end-to-end (submit → success screen → audit log line in console).
 */

interface StoredDraft {
  id: string;
  ownerUid: string;
  personId: string;
  status: ListingDraftStatus;
  payload: CreateListingDraftRawInput["payload"];
  submittedAt: Date;
  rejectionReason?: string;
}

const DRAFTS: StoredDraft[] = [];

export async function createListingDraftRaw(
  input: CreateListingDraftRawInput,
): Promise<{ id: string; hasOtherDrafts: boolean }> {
  const hasOtherDrafts = DRAFTS.some((d) => d.ownerUid === input.ownerUid);
  DRAFTS.push({
    id: input.draftId,
    ownerUid: input.ownerUid,
    personId: input.personId,
    status: "pending_review",
    payload: input.payload,
    submittedAt: new Date(),
  });
  return { id: input.draftId, hasOtherDrafts };
}

/**
 * Mock parity for `findActiveDraftBySlug`. A slug is active when a
 * draft is in `pending_review` or `approved`. `rejected` and
 * `cancelled` (ADR-020) release the slug.
 */
export async function findActiveDraftBySlug(slug: string): Promise<boolean> {
  return DRAFTS.some(
    (d) =>
      d.payload.details.preferredSlug === slug &&
      (d.status === "pending_review" || d.status === "approved"),
  );
}

/**
 * ADR-020 cascade. Mock parity for `cancelDraftRaw`. No-op when the
 * draft doesn't exist or belongs to a different owner — matches the
 * "treat as 404" stance of `getDraftByIdForOwnerRaw`.
 */
export async function cancelDraftRaw(
  draftId: string,
  ownerUid: string,
): Promise<void> {
  const idx = DRAFTS.findIndex(
    (d) => d.id === draftId && d.ownerUid === ownerUid,
  );
  if (idx === -1) return;
  const found = DRAFTS[idx];
  if (!found || found.status === "cancelled") return;
  DRAFTS[idx] = { ...found, status: "cancelled" };
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
  status: ListingDraftStatus;
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

/**
 * Returns the full draft record for `(ownerUid, draftId)` or `null` when
 * it does not exist or belongs to someone else. The ownership filter
 * here is the safety boundary — barrel code passes the
 * `requireAuth().uid`, so anonymous / cross-user reads never resolve.
 *
 * Used by the seller-side "Ver detalles" view at
 * `/mi-cuenta/borradores/[id]` to render every field the modelo
 * submitted while the draft is in human review.
 */
export async function getDraftByIdForOwnerRaw(
  ownerUid: string,
  draftId: string,
): Promise<ListingDraftRecord | null> {
  const found = DRAFTS.find(
    (d) => d.ownerUid === ownerUid && d.id === draftId,
  );
  if (!found) return null;
  return {
    id: found.id,
    ownerUid: found.ownerUid,
    ...(found.personId ? { personId: found.personId } : {}),
    status: found.status,
    payload: found.payload,
    submittedAt: found.submittedAt.toISOString(),
    ...(found.rejectionReason ? { rejectionReason: found.rejectionReason } : {}),
  };
}
