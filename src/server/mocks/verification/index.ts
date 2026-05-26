import "server-only";

import { mockStore } from "@/server/mocks/storage/store";
import {
  VERIFICATION_LIMITS,
  VERIFICATION_PATH_PREFIX,
  type DocumentType,
  type KycAsset,
  type KycUploadTicket,
  type KycUploadTicketInput,
  type SubmitVerificationInput,
  type VerificationRecord,
  type VerificationStatus,
} from "@/server/verification/types";

/**
 * In-memory mock for the verification port. Mirrors the real adapter's
 * shape so the wizard works end-to-end without Firebase configured.
 *
 * Storage side reuses the existing `mockStore` so the route handler at
 * `/api/_storage-mock/[token]` accepts KYC PUTs too — same machinery.
 *
 * Firestore side is a process-local `Map<personId, record>`. Restart
 * wipes it. ADR-018 Phase A: the key is the **personId**, not the
 * account uid.
 */

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const RECORDS = new Map<string, VerificationRecord>();

export async function signKycUploadUrlRawForPerson(
  personId: string,
  ownerUid: string,
  input: KycUploadTicketInput,
): Promise<KycUploadTicket> {
  const ext = EXT_BY_MIME[input.contentType] ?? "bin";
  const path = `${VERIFICATION_PATH_PREFIX}/${personId}/${input.kind}.${ext}`;

  const expiresMs = Date.now() + VERIFICATION_LIMITS.ticketTtlSeconds * 1000;
  // We re-use the mock storage store's ticket machinery — same shape as
  // the photo ticket, just with a different path prefix. `ownerUid` is
  // the account that owns this person; the mock storage uses it as the
  // blob owner so `confirmKycUploadRawForPerson` can match.
  const token = mockStore.reserveTicket({
    path,
    ownerUid,
    contentType: input.contentType,
    sessionId: "verification",
    expiresAt: expiresMs,
    // KYC files have their own cap; videos do not flow through this
    // path. Pass the cap explicitly so the ticket carries its own
    // limit (ADR-015 made the ticket-level cap per-kind).
    maxBytes: VERIFICATION_LIMITS.fileMaxBytes,
  });

  return {
    uploadUrl: `/api/_storage-mock/${token}`,
    path,
    expiresAt: new Date(expiresMs).toISOString(),
    requiredHeaders: {
      "x-goog-content-length-range": `1,${VERIFICATION_LIMITS.fileMaxBytes}`,
      "cache-control": "private, max-age=0, no-store",
    },
    contentType: input.contentType,
    maxBytes: VERIFICATION_LIMITS.fileMaxBytes,
  };
}

/**
 * Mock parity for the Firebase adapter's `signKycReadUrlRawForPerson`.
 * Returns a relative path to the in-memory blob endpoint at
 * `/api/_storage-mock-read/<path>`. Validates that the path's second
 * segment matches the supplied personId, mirroring the real adapter's
 * defense-in-depth check.
 */
export async function signKycReadUrlRawForPerson(
  expectedPersonId: string,
  path: string,
): Promise<string> {
  const segment = path.split("/")[1];
  if (segment !== expectedPersonId) {
    const err = new Error(
      "verification(mock)/signKycReadUrl: path does not match the supplied personId",
    );
    (err as { kind?: string }).kind = "permission-denied";
    throw err;
  }
  return `/api/_storage-mock-read/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export async function confirmKycUploadRawForPerson(
  expectedPersonId: string,
  path: string,
): Promise<KycAsset> {
  const blob = mockStore.getBlob(path);
  if (!blob) {
    const err = new Error(
      "verification(mock)/confirmKycUpload: no blob at path",
    );
    (err as { kind?: string }).kind = "not-found";
    throw err;
  }
  // The mock storage tracks `ownerUid` (the account) rather than the
  // person id; we cross-check the personId via the path shape instead.
  // The barrel ALSO verifies caller ownership of the person before we
  // reach this point — this is defense in depth.
  const segment = path.split("/")[1];
  if (segment !== expectedPersonId) {
    const err = new Error(
      "verification(mock)/confirmKycUpload: path does not match the supplied personId",
    );
    (err as { kind?: string }).kind = "permission-denied";
    throw err;
  }
  return {
    path,
    contentType: blob.contentType,
    sizeBytes: blob.sizeBytes,
  };
}

export async function getVerificationRaw(
  personId: string,
): Promise<VerificationRecord | null> {
  return RECORDS.get(personId) ?? null;
}

/** ADR-020 mock parity for `deleteVerificationRaw`. */
export async function deleteVerificationRaw(personId: string): Promise<void> {
  RECORDS.delete(personId);
}

export async function submitVerificationRaw(
  personId: string,
  ownerUid: string,
  input: SubmitVerificationInput,
): Promise<void> {
  const prev = RECORDS.get(personId);
  if (prev && prev.status === "pending_review") {
    throw new Error(
      "submitVerification(mock): verification already pending review",
    );
  }
  const now = new Date().toISOString();
  RECORDS.set(personId, {
    personId,
    ownerUid,
    status: "pending_review" as VerificationStatus,
    documentFrontPath: input.documentFrontPath,
    documentBackPath: input.documentBackPath,
    selfiePath: input.selfiePath,
    documentType: input.documentType,
    documentNumber: input.documentNumber,
    submittedAt: now,
    createdAt: prev?.createdAt ?? now,
  });
}

/**
 * Mock parity for the Firebase adapter's
 * `findActiveKycByDocumentNumberRaw`. Scans the in-memory Map for any
 * non-rejected record whose `(documentType, documentNumber)` matches.
 */
export async function findActiveKycByDocumentNumberRaw(args: {
  documentType: DocumentType;
  documentNumber: string;
  excludePersonId?: string;
}): Promise<{ personId: string; ownerUid?: string } | null> {
  for (const record of RECORDS.values()) {
    if (record.status === "rejected") continue;
    if (record.documentType !== args.documentType) continue;
    if (record.documentNumber !== args.documentNumber) continue;
    if (args.excludePersonId && record.personId === args.excludePersonId)
      continue;
    return { personId: record.personId, ownerUid: record.ownerUid };
  }
  return null;
}
