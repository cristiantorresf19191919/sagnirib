import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getDb } from "@/server/adapters/firebase/client";
import { wrapFirestoreError } from "@/server/adapters/firebase/errors";
import type { PersonRecord } from "@/server/persons/types";

/**
 * Firestore writes / reads for `persons/{personId}` (ADR-018).
 *
 * Metadata-only port. KYC documents continue to live in
 * `verifications/{personId}` (the doc-id space is opaque, so the
 * existing collection is reinterpreted to be person-keyed). The barrel
 * composes the KYC summary from the verification adapter.
 */

const COLLECTION = "persons";

export interface FirestorePersonDoc {
  id: string;
  ownerUid: string;
  displayName: string;
  activeDraftId: string | null;
  activeListingSlug: string | null;
  createdAt: string;
  /** ADR-020 soft-delete marker. ISO timestamp set by `markPersonDeletedRaw`. */
  deletedAt: string | null;
}

export async function listPersonsByOwnerRaw(
  ownerUid: string,
): Promise<ReadonlyArray<FirestorePersonDoc>> {
  const db = getDb();
  try {
    const snap = await db
      .collection(COLLECTION)
      .where("ownerUid", "==", ownerUid)
      .orderBy("createdAt", "desc")
      .get();
    // Soft-deleted rows (ADR-020) filtered in-memory: per-owner N is
    // small (≤ PERSON_LIMITS.maxPersonsPerAccount) so the saved
    // composite index isn't worth the migration cost. Switch to a
    // `where("deletedAt", "==", null)` clause + composite index if
    // partner accounts grow past ~50 historical persons.
    return snap.docs
      .map((d) => mapPersonDoc(d.id, d.data() as Record<string, unknown>))
      .filter((p) => p.deletedAt === null);
  } catch (err) {
    throw wrapFirestoreError("listPersonsByOwner", err);
  }
}

export async function getPersonRaw(
  personId: string,
): Promise<FirestorePersonDoc | null> {
  const db = getDb();
  try {
    const snap = await db.collection(COLLECTION).doc(personId).get();
    if (!snap.exists) return null;
    return mapPersonDoc(personId, snap.data() as Record<string, unknown>);
  } catch (err) {
    throw wrapFirestoreError("getPerson", err);
  }
}

export async function createPersonRaw(input: {
  ownerUid: string;
  displayName: string;
  /** When provided (lazy-migration path), the doc id equals this value
   *  instead of being Firestore-generated. */
  personId?: string;
}): Promise<FirestorePersonDoc> {
  const db = getDb();
  const id = input.personId ?? db.collection(COLLECTION).doc().id;
  const ref = db.collection(COLLECTION).doc(id);

  try {
    await ref.set(
      {
        id,
        ownerUid: input.ownerUid,
        displayName: input.displayName,
        activeDraftId: null,
        activeListingSlug: null,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  } catch (err) {
    throw wrapFirestoreError("createPerson", err);
  }

  // Re-read so we return the resolved serverTimestamp. The cost is
  // one extra get; person creation is low-frequency.
  const snap = await ref.get();
  return mapPersonDoc(id, snap.data() as Record<string, unknown>);
}

export async function setPersonActiveDraftRaw(
  personId: string,
  draftId: string | null,
): Promise<void> {
  const db = getDb();
  try {
    await db
      .collection(COLLECTION)
      .doc(personId)
      .set({ activeDraftId: draftId }, { merge: true });
  } catch (err) {
    throw wrapFirestoreError("setPersonActiveDraft", err);
  }
}

export async function setPersonActiveListingRaw(
  personId: string,
  listingSlug: string | null,
): Promise<void> {
  const db = getDb();
  try {
    await db
      .collection(COLLECTION)
      .doc(personId)
      .set({ activeListingSlug: listingSlug }, { merge: true });
  } catch (err) {
    throw wrapFirestoreError("setPersonActiveListing", err);
  }
}

/**
 * ADR-020 soft-delete. Writes `deletedAt` (ISO) on the person doc. The
 * barrel is the only legitimate caller; ownership is checked there
 * BEFORE this write so the adapter trusts its input.
 */
export async function markPersonDeletedRaw(
  personId: string,
  deletedAtIso: string,
): Promise<void> {
  const db = getDb();
  try {
    await db
      .collection(COLLECTION)
      .doc(personId)
      .set({ deletedAt: deletedAtIso }, { merge: true });
  } catch (err) {
    throw wrapFirestoreError("markPersonDeleted", err);
  }
}

export function projectPersonForBarrel(
  d: FirestorePersonDoc,
): Omit<PersonRecord, "kyc"> {
  return {
    id: d.id,
    ownerUid: d.ownerUid,
    displayName: d.displayName,
    activeDraftId: d.activeDraftId,
    activeListingSlug: d.activeListingSlug,
    createdAt: d.createdAt,
    deletedAt: d.deletedAt,
  };
}

function tsToIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  // serverTimestamp not yet resolved (rare — only happens on the same
  // request as the write before re-read). Fall back to "now".
  return new Date().toISOString();
}

function mapPersonDoc(
  id: string,
  data: Record<string, unknown>,
): FirestorePersonDoc {
  return {
    id,
    ownerUid: typeof data.ownerUid === "string" ? data.ownerUid : "",
    displayName:
      typeof data.displayName === "string" ? data.displayName : "Modelo",
    activeDraftId:
      typeof data.activeDraftId === "string" ? data.activeDraftId : null,
    activeListingSlug:
      typeof data.activeListingSlug === "string"
        ? data.activeListingSlug
        : null,
    createdAt: tsToIso(data.createdAt),
    deletedAt: tsToIsoOrNull(data.deletedAt),
  };
}

function tsToIsoOrNull(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value.length > 0) return value;
  return null;
}
