import "server-only";

import type { PersonRecord } from "@/server/persons/types";

/**
 * In-memory mock for the persons port (ADR-018).
 *
 * Process-local Map<personId, record>. Restart wipes it. Mirrors the
 * Firestore adapter's signatures so the barrel can route between them
 * without features knowing.
 *
 * Note: this mock only owns the persons *metadata*. KYC summary is
 * composed by the barrel from the existing `@/server/mocks/verification`
 * store (ADR-018: KYC keeps living in `verifications/{personId}` — we
 * just reinterpret the doc id as a personId, since the doc-id space is
 * opaque).
 */

const RECORDS = new Map<string, MockPerson>();

export interface MockPerson {
  id: string;
  ownerUid: string;
  displayName: string;
  activeDraftId: string | null;
  activeListingSlug: string | null;
  createdAt: string;
  /** ADR-020 soft-delete marker. */
  deletedAt: string | null;
}

export async function listPersonsByOwnerRaw(
  ownerUid: string,
): Promise<ReadonlyArray<MockPerson>> {
  const out: MockPerson[] = [];
  for (const p of RECORDS.values()) {
    if (p.ownerUid !== ownerUid) continue;
    if (p.deletedAt !== null) continue;
    out.push(p);
  }
  // Newest first — matches the prod adapter's orderBy.
  return out.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

export async function getPersonRaw(
  personId: string,
): Promise<MockPerson | null> {
  return RECORDS.get(personId) ?? null;
}

export async function createPersonRaw(input: {
  ownerUid: string;
  displayName: string;
  /** Optional — used by the lazy-migration path where personId == uid. */
  personId?: string;
}): Promise<MockPerson> {
  const id = input.personId ?? globalThis.crypto.randomUUID();
  const record: MockPerson = {
    id,
    ownerUid: input.ownerUid,
    displayName: input.displayName,
    activeDraftId: null,
    activeListingSlug: null,
    createdAt: new Date().toISOString(),
    deletedAt: null,
  };
  RECORDS.set(id, record);
  return record;
}

export async function setPersonActiveDraftRaw(
  personId: string,
  draftId: string | null,
): Promise<void> {
  const existing = RECORDS.get(personId);
  if (!existing) return;
  RECORDS.set(personId, { ...existing, activeDraftId: draftId });
}

export async function setPersonActiveListingRaw(
  personId: string,
  listingSlug: string | null,
): Promise<void> {
  const existing = RECORDS.get(personId);
  if (!existing) return;
  RECORDS.set(personId, { ...existing, activeListingSlug: listingSlug });
}

/** ADR-020 soft-delete (mock parity for `markPersonDeletedRaw`). */
export async function markPersonDeletedRaw(
  personId: string,
  deletedAtIso: string,
): Promise<void> {
  const existing = RECORDS.get(personId);
  if (!existing) return;
  RECORDS.set(personId, { ...existing, deletedAt: deletedAtIso });
}

/**
 * Maps the mock's internal shape to the public `PersonRecord` minus the
 * KYC summary (barrel attaches that). Exported so the barrel can use
 * the same projection for both mock and prod adapters.
 */
export function projectPersonForBarrel(
  m: MockPerson,
): Omit<PersonRecord, "kyc"> {
  return {
    id: m.id,
    ownerUid: m.ownerUid,
    displayName: m.displayName,
    activeDraftId: m.activeDraftId,
    activeListingSlug: m.activeListingSlug,
    createdAt: m.createdAt,
    deletedAt: m.deletedAt,
  };
}
