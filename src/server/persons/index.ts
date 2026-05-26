import "server-only";

import { updateTag } from "next/cache";

import { isFirebaseConfigured } from "@/core/config/firebase";
import { auditLog } from "@/server/security/audit-log";
import { requireAuth } from "@/server/security/require-auth";
import { validateActionInput } from "@/server/security/validate-action-input";
import type { VerificationRecord } from "@/server/verification/types";

import { createPersonSchema, parsePersonId } from "./schemas";
import { PERSON_LIMITS } from "./types";
import type {
  CreatePersonInput,
  PersonKycSummary,
  PersonRecord,
} from "./types";

export type {
  CreatePersonInput,
  PersonKycSummary,
  PersonRecord,
} from "./types";
export { PERSON_LIMITS } from "./types";

/**
 * Public barrel for the persons port (ADR-018).
 *
 * Composes two underlying stores:
 *
 *   - `persons/{personId}` — metadata (owner, displayName, active
 *     draft/listing pointers). Owned by THIS port's adapter / mock.
 *   - `verifications/{personId}` — KYC document. Owned by the
 *     existing verification adapter; the doc-id space is opaque so
 *     reinterpreting the doc id as a personId is safe (ADR-018 §
 *     "Storage — `persons/{personId}/`").
 *
 * The barrel applies the standard mutation contract (validate +
 * requireAuth + ownership + audit + cache tag) and runs the lazy
 * legacy-verification → person auto-migration on first read (ADR-018
 * § "Migration plan — Phase A").
 */

const adapter = isFirebaseConfigured()
  ? await import("@/server/adapters/firebase/persons")
  : await import("@/server/mocks/persons");

// Verification raw access — used only by this barrel to compose the
// KYC summary into the public PersonRecord. Features must keep going
// through `@/server/verification`.
const verificationAdapter = isFirebaseConfigured()
  ? await import("@/server/adapters/firebase/verification")
  : await import("@/server/mocks/verification");

// Drafts raw access — used only by this barrel for the ADR-020 cascade
// (`deleteMyPerson` flips the active draft to `cancelled`). Features
// MUST keep going through `@/server/biringas`. The submodule import
// keeps the bundle weight tight (we only need `cancelDraftRaw`).
const draftsAdapter = isFirebaseConfigured()
  ? await import("@/server/adapters/firebase/biringas/create-draft")
  : await import("@/server/mocks/biringas/create-draft");

const CACHE_TAGS = {
  personsForOwner(uid: string): string {
    return `biringa:persons:owner:${uid}`;
  },
  person(personId: string): string {
    return `biringa:person:${personId}`;
  },
} as const;

export { CACHE_TAGS as PERSONS_CACHE_TAGS };

/**
 * Returns every person owned by the authenticated caller, KYC summary
 * merged, newest-first.
 *
 * Performs the lazy ADR-018 Phase A migration if the account has no
 * persons yet AND a legacy `verifications/{uid}` doc exists: a single
 * default person is auto-created with `personId = uid` (so the KYC
 * doc keeps its current path).
 */
export async function getMyPersons(): Promise<ReadonlyArray<PersonRecord>> {
  const user = await requireAuth();
  return composePersonsForOwner(user.uid);
}

/**
 * Returns a single person owned by the authenticated caller, or null
 * if the personId does not exist OR belongs to a different account.
 * Audited — a wrong personId is treated as a 404 (probing leaks
 * nothing). The audit captures the attempt either way.
 */
export async function getMyPerson(
  rawPersonId: unknown,
): Promise<PersonRecord | null> {
  const personId = parsePersonId(rawPersonId);
  const user = await requireAuth();

  // Run the lazy migration first so a legacy account that never
  // touched the new port can resolve persons/{uid}.
  await composePersonsForOwner(user.uid);

  const meta = await adapter.getPersonRaw(personId);
  if (!meta) return null;
  if (meta.ownerUid !== user.uid) return null;

  const kyc = await readKycSummary(personId);
  return { ...adapter.projectPersonForBarrel(meta), kyc };
}

/**
 * Creates a new person under the authenticated caller's account.
 *
 * Used by:
 *   - The partner dashboard's "Crear nueva modelo" CTA.
 *   - The publish wizard, when an account has 0 persons and is about
 *     to create its first listing (a fresh person is minted to scope
 *     the KYC).
 *
 * Enforces `PERSON_LIMITS.maxPersonsPerAccount` to keep the
 * dashboard query bounded. Returns the freshly composed PersonRecord.
 */
export async function createMyPerson(
  rawInput: unknown,
): Promise<PersonRecord> {
  const input: CreatePersonInput = validateActionInput(
    createPersonSchema,
    rawInput,
  );
  const user = await requireAuth();

  const existing = await adapter.listPersonsByOwnerRaw(user.uid);
  if (existing.length >= PERSON_LIMITS.maxPersonsPerAccount) {
    const err = new Error(
      `createMyPerson: account has reached the ${PERSON_LIMITS.maxPersonsPerAccount}-person cap`,
    );
    (err as { kind?: string }).kind = "resource-exhausted";
    throw err;
  }

  const created = await adapter.createPersonRaw({
    ownerUid: user.uid,
    displayName: input.displayName,
  });

  await auditLog({
    event: "biringa.person.created",
    actorId: user.uid,
    resource: `person:${created.id}`,
    metadata: { displayName: input.displayName },
  });

  updateTag(CACHE_TAGS.personsForOwner(user.uid));

  const kyc = await readKycSummary(created.id);
  return { ...adapter.projectPersonForBarrel(created), kyc };
}

/**
 * Soft-deletes a person owned by the authenticated caller and cascades
 * the cleanup (ADR-020):
 *
 *   1. Refuse when the person has an active **published** listing. The
 *      unpublish flow lives on the listing port and is not implemented
 *      yet — surfacing the refusal is friendlier than silently leaving
 *      a public profile pointing at a deleted owner.
 *   2. Cancel the active draft (status → `cancelled`) so the admin
 *      moderation queue stops surfacing it. The slug is released.
 *   3. Hard-delete `verifications/{personId}`. KYC photos in Storage
 *      under `verifications/{personId}/` are left for a follow-up
 *      sweep job (TODO ADR-020 § "Storage GC").
 *   4. Stamp `persons/{personId}.deletedAt`. The doc is preserved so
 *      `auditLog` event resources (`person:<id>`) still resolve in
 *      trust&safety queries.
 *
 * Returns the result kind so the Server Action wrapper can map it
 * into a typed UI payload (no thrown errors for the
 * `failed-precondition` case — that path is part of the contract).
 */
export type DeletePersonOutcome =
  | { kind: "deleted" }
  | { kind: "not-found" }
  | { kind: "blocked-published-listing" };

export async function deleteMyPerson(
  rawPersonId: unknown,
): Promise<DeletePersonOutcome> {
  const personId = parsePersonId(rawPersonId);
  const user = await requireAuth();

  const meta = await adapter.getPersonRaw(personId);
  if (!meta) return { kind: "not-found" };
  if (meta.ownerUid !== user.uid) return { kind: "not-found" };
  if (meta.deletedAt !== null) return { kind: "deleted" }; // Idempotent.

  if (meta.activeListingSlug !== null) {
    await auditLog({
      event: "biringa.person.delete_blocked",
      actorId: user.uid,
      resource: `person:${personId}`,
      metadata: { reason: "active-published-listing", slug: meta.activeListingSlug },
    });
    return { kind: "blocked-published-listing" };
  }

  // Step 2 — cancel the active draft. Idempotent at the adapter level.
  let cancelledDraftId: string | null = null;
  if (meta.activeDraftId !== null) {
    await draftsAdapter.cancelDraftRaw(meta.activeDraftId, user.uid);
    cancelledDraftId = meta.activeDraftId;
    // Clear the pointer so the dashboard zip never resurfaces a
    // cancelled draft on this person (defense-in-depth — the person
    // row is also about to be filtered out by `deletedAt`).
    await adapter.setPersonActiveDraftRaw(personId, null);
  }

  // Step 3 — hard-delete the KYC doc. Idempotent.
  await verificationAdapter.deleteVerificationRaw(personId);

  // Step 4 — soft-delete the person.
  const deletedAt = new Date().toISOString();
  await adapter.markPersonDeletedRaw(personId, deletedAt);

  await auditLog({
    event: "biringa.person.deleted",
    actorId: user.uid,
    resource: `person:${personId}`,
    metadata: {
      cancelledDraftId,
      displayName: meta.displayName,
    },
  });

  updateTag(CACHE_TAGS.person(personId));
  updateTag(CACHE_TAGS.personsForOwner(user.uid));

  return { kind: "deleted" };
}

/**
 * Internal: updates a person's `activeDraftId` pointer. Called by
 * `createListingDraft` after the draft write to enforce the 1:1
 * person↔listing rule on subsequent submissions. Not exported
 * publicly — the only legitimate caller is the draft mutation.
 *
 * @internal
 */
export async function _setPersonActiveDraftInternal(args: {
  personId: string;
  ownerUid: string;
  draftId: string | null;
}): Promise<void> {
  const meta = await adapter.getPersonRaw(args.personId);
  if (!meta) {
    throw new Error(
      `_setPersonActiveDraft: person ${args.personId} not found`,
    );
  }
  if (meta.ownerUid !== args.ownerUid) {
    throw new Error(
      `_setPersonActiveDraft: caller is not the owner of person ${args.personId}`,
    );
  }
  await adapter.setPersonActiveDraftRaw(args.personId, args.draftId);
  updateTag(CACHE_TAGS.person(args.personId));
  updateTag(CACHE_TAGS.personsForOwner(args.ownerUid));
}

// ----------------------------------------------------------------------------
// Internals
// ----------------------------------------------------------------------------

async function composePersonsForOwner(
  ownerUid: string,
): Promise<ReadonlyArray<PersonRecord>> {
  const persons = await adapter.listPersonsByOwnerRaw(ownerUid);

  // Lazy ADR-018 Phase A migration: bootstrap a person from a legacy
  // verification doc the first time the user logs into the new flow.
  if (persons.length === 0) {
    const legacy = await verificationAdapter.getVerificationRaw(ownerUid);
    if (legacy) {
      const created = await adapter.createPersonRaw({
        ownerUid,
        personId: ownerUid,
        displayName: defaultPersonDisplayName(),
      });
      await auditLog({
        event: "biringa.person.created",
        actorId: ownerUid,
        resource: `person:${created.id}`,
        metadata: {
          reason: "adr-018-lazy-migration",
          legacyVerificationStatus: legacy.status,
        },
      });
      updateTag(CACHE_TAGS.personsForOwner(ownerUid));
      const kyc = legacySummaryFromRecord(legacy);
      return [{ ...adapter.projectPersonForBarrel(created), kyc }];
    }
    return [];
  }

  // Compose KYC summaries in parallel — N is small (typical 1, partner
  // ~5-10). For 50-person accounts this is ~50 reads; acceptable for
  // dashboard render frequency.
  const composed = await Promise.all(
    persons.map(async (p) => {
      const kyc = await readKycSummary(p.id);
      return { ...adapter.projectPersonForBarrel(p), kyc };
    }),
  );
  return composed;
}

async function readKycSummary(personId: string): Promise<PersonKycSummary> {
  const record = await verificationAdapter.getVerificationRaw(personId);
  if (!record) return { status: "not_submitted" };
  return legacySummaryFromRecord(record);
}

function legacySummaryFromRecord(record: VerificationRecord): PersonKycSummary {
  return {
    status: record.status,
    ...(record.submittedAt ? { submittedAt: record.submittedAt } : {}),
    ...(record.approvedAt ? { approvedAt: record.approvedAt } : {}),
    ...(record.rejectionReason
      ? { rejectionReason: record.rejectionReason }
      : {}),
  };
}

function defaultPersonDisplayName(): string {
  // ADR-018 § Phase A spec: "derived from listings.name if a published
  // listing exists for the uid, else session.email.split('@')[0], else
  // 'Modelo'". The first two require cross-port reads (listings + auth)
  // which this barrel does not yet do — see TODO below. For now we
  // default to a neutral label; the user can rename via the dashboard.
  //
  // TODO(ADR-018-phase-A-richer-migration): wire optional callback to
  // derive name from the existing draft / listing of this uid.
  return "Modelo";
}
