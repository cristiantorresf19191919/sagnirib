import "server-only";

import { isFirebaseConfigured } from "@/core/config/firebase";
import { auditLog } from "@/server/security/audit-log";
import { requireAuth } from "@/server/security/require-auth";
import { validateActionInput } from "@/server/security/validate-action-input";

import {
  confirmKycUploadSchema,
  kycUploadTicketSchema,
  submitVerificationSchema,
} from "./schemas";
import type {
  ConfirmKycUploadInput,
  KycAsset,
  KycReadUrls,
  KycUploadTicket,
  KycUploadTicketInput,
  SubmitVerificationInput,
  VerificationView,
} from "./types";

export type {
  ConfirmKycUploadInput,
  DocumentType,
  KycAsset,
  KycReadUrls,
  KycUploadTicket,
  KycUploadTicketInput,
  SubmitVerificationInput,
  VerificationRecord,
  VerificationStatus,
  VerificationUploadKind,
  VerificationView,
} from "./types";
export {
  DOCUMENT_TYPES,
  VERIFICATION_LIMITS,
  VERIFICATION_UPLOAD_KINDS,
} from "./types";

/**
 * Public barrel for the verification port (ADR-014 + ADR-018 Phase A).
 *
 * Wraps the adapter with:
 *   1. validateActionInput  — server is the source of truth
 *   2. requireAuth          — anonymous KYC uploads refused
 *   3. requirePersonOwnership — caller must own the target person
 *   4. adapter call         — personId-scoped path-validated
 *   5. auditLog             — every step traceable
 *
 * Routed to Firebase if configured, otherwise to the in-memory mock.
 *
 * ADR-018 Phase A note: every public mutation/read in this barrel is
 * keyed by **personId**. The adapter writes to `verifications/{personId}`
 * (the collection name stays; only the doc-id space moves from uid to
 * personId, which is opaque so lazy-migrated accounts whose personId
 * equals uid keep working untouched).
 */

const adapter = isFirebaseConfigured()
  ? await import("@/server/adapters/firebase/verification")
  : await import("@/server/mocks/verification");

// Persons adapter — used only to verify person ownership before issuing
// signed URLs / accepting submissions. Features keep going through
// `@/server/persons`; this inline import mirrors the symmetric pattern
// in `@/server/persons/index.ts` (which inline-imports THIS adapter to
// compose the KYC summary).
const personsAdapter = isFirebaseConfigured()
  ? await import("@/server/adapters/firebase/persons")
  : await import("@/server/mocks/persons");

/**
 * Verifies the authenticated caller owns the target person. Returns
 * the caller's uid on success; throws `permission-denied` otherwise.
 * Treats wrong-owner and not-found uniformly so probing leaks nothing.
 */
async function requirePersonOwnership(personId: string): Promise<string> {
  const user = await requireAuth();
  const meta = await personsAdapter.getPersonRaw(personId);
  if (!meta || meta.ownerUid !== user.uid || meta.deletedAt !== null) {
    const err = new Error(
      "verification: caller does not own the target person",
    );
    (err as { kind?: string }).kind = "permission-denied";
    throw err;
  }
  return user.uid;
}

/** Single-use signed PUT URL for one KYC asset. */
export async function requestKycUploadTicket(
  rawInput: unknown,
): Promise<KycUploadTicket> {
  const input: KycUploadTicketInput = validateActionInput(
    kycUploadTicketSchema,
    rawInput,
  );
  const ownerUid = await requirePersonOwnership(input.personId);

  const ticket = await adapter.signKycUploadUrlRawForPerson(
    input.personId,
    ownerUid,
    input,
  );

  await auditLog({
    event: "biringa.verification.upload_ticket_requested",
    actorId: ownerUid,
    resource: `person:${input.personId}:${input.kind}`,
    metadata: {
      personId: input.personId,
      kind: input.kind,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
    },
  });

  return ticket;
}

/** HEAD-checks an uploaded KYC asset. */
export async function confirmKycUpload(rawInput: unknown): Promise<KycAsset> {
  const input: ConfirmKycUploadInput = validateActionInput(
    confirmKycUploadSchema,
    rawInput,
  );
  const ownerUid = await requirePersonOwnership(input.personId);

  const asset = await adapter.confirmKycUploadRawForPerson(
    input.personId,
    input.path,
  );

  await auditLog({
    event: "biringa.verification.upload_completed",
    actorId: ownerUid,
    resource: `person:${input.personId}`,
    metadata: {
      personId: input.personId,
      path: asset.path,
      contentType: asset.contentType,
      sizeBytes: asset.sizeBytes,
    },
  });

  return asset;
}

/**
 * Final submission. Writes / overwrites `verifications/{personId}` with
 * `status='pending_review'` and references the 3 uploaded paths.
 *
 * Cross-checks:
 *
 *   1. **Ownership** — the caller must own the target person. The
 *      schema cross-checks the 3 paths share the same personId AND
 *      that it equals `input.personId`; here we additionally verify
 *      that the caller owns that person. A malicious client cannot
 *      submit paths from a person they do not own.
 *   2. **Document number uniqueness** (ADR-018 amendment) — refuses
 *      the write if any OTHER non-rejected `verifications/{*}` doc
 *      has the same `(documentType, documentNumber)`. Rejected docs
 *      release the number (release-on-reject), so the modelo whose
 *      KYC was rejected can re-submit; only another person claiming
 *      the same identity is blocked.
 */
export async function submitVerification(rawInput: unknown): Promise<void> {
  const input: SubmitVerificationInput = validateActionInput(
    submitVerificationSchema,
    rawInput,
  );
  const ownerUid = await requirePersonOwnership(input.personId);

  // ADR-018 amendment — collision check. `excludePersonId` lets the
  // caller re-submit against their OWN existing doc (re-keying after
  // rejection, retrying after a transient error) without false-
  // positive blocking.
  const collision = await adapter.findActiveKycByDocumentNumberRaw({
    documentType: input.documentType,
    documentNumber: input.documentNumber,
    excludePersonId: input.personId,
  });
  if (collision) {
    await auditLog({
      event: "biringa.verification.duplicate_document_blocked",
      actorId: ownerUid,
      resource: `person:${input.personId}`,
      metadata: {
        personId: input.personId,
        documentType: input.documentType,
        collidingPersonId: collision.personId,
        collidingOwnerUid: collision.ownerUid,
      },
    });
    const err = new Error(
      "submitVerification: ese documento ya está registrado en otra cuenta. Si crees que es un error, contactá soporte.",
    );
    (err as { kind?: string }).kind = "duplicate-document-number";
    throw err;
  }

  await adapter.submitVerificationRaw(input.personId, ownerUid, input);

  await auditLog({
    event: "biringa.verification.submitted",
    actorId: ownerUid,
    resource: `person:${input.personId}`,
    metadata: { personId: input.personId, documentType: input.documentType },
  });
}

/**
 * Reads the verification record for a person owned by the authenticated
 * caller AND composes the short-lived signed read URLs for the 3 KYC
 * assets when the record is in a terminal-read state.
 *
 * Returns:
 *   - `null` when the person has no KYC doc yet (status `not_submitted`).
 *   - `{ record, readUrls: null }` when the doc exists but is in
 *     `rejected` (modelo is re-uploading; old paths are intentionally
 *     not surfaced) or any state without all three paths.
 *   - `{ record, readUrls: { documentFront, documentBack, selfie } }`
 *     when status is `pending_review` or `approved` AND all 3 paths
 *     are present. Each URL is a V4 signed GET valid for ~10 min.
 *
 * Throws `permission-denied` if the caller does not own the target
 * person (including the not-found case — probing leaks nothing).
 */
export async function getMyVerificationView(
  personId: string,
): Promise<VerificationView | null> {
  const ownerUid = await requirePersonOwnership(personId);
  const record = await adapter.getVerificationRaw(personId);
  if (!record) return null;

  const shouldSign =
    (record.status === "pending_review" || record.status === "approved") &&
    !!record.documentFrontPath &&
    !!record.documentBackPath &&
    !!record.selfiePath;

  if (!shouldSign) return { record, readUrls: null };

  const [documentFront, documentBack, selfie] = await Promise.all([
    adapter.signKycReadUrlRawForPerson(personId, record.documentFrontPath!),
    adapter.signKycReadUrlRawForPerson(personId, record.documentBackPath!),
    adapter.signKycReadUrlRawForPerson(personId, record.selfiePath!),
  ]);

  const readUrls: KycReadUrls = { documentFront, documentBack, selfie };

  await auditLog({
    event: "biringa.verification.read_urls_signed",
    actorId: ownerUid,
    resource: `person:${personId}`,
    metadata: { personId, status: record.status },
  });

  return { record, readUrls };
}
