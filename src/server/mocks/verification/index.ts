import "server-only";

import { mockStore } from "@/server/mocks/storage/store";
import {
  VERIFICATION_LIMITS,
  VERIFICATION_PATH_PREFIX,
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
 * Firestore side is a process-local Map<uid, record>. Restart wipes it.
 */

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const RECORDS = new Map<string, VerificationRecord>();

export async function signKycUploadUrlRawForOwner(
  ownerUid: string,
  input: KycUploadTicketInput,
): Promise<KycUploadTicket> {
  const ext = EXT_BY_MIME[input.contentType] ?? "bin";
  const path = `${VERIFICATION_PATH_PREFIX}/${ownerUid}/${input.kind}.${ext}`;

  const expiresMs = Date.now() + VERIFICATION_LIMITS.ticketTtlSeconds * 1000;
  // We re-use the mock storage store's ticket machinery — same shape as
  // the photo ticket, just with a different path prefix.
  const token = mockStore.reserveTicket({
    path,
    ownerUid,
    contentType: input.contentType,
    sessionId: "verification",
    expiresAt: expiresMs,
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

export async function confirmKycUploadRawForOwner(
  expectedOwnerUid: string,
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
  if (blob.ownerUid !== expectedOwnerUid) {
    const err = new Error(
      "verification(mock)/confirmKycUpload: caller is not the owner",
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
  uid: string,
): Promise<VerificationRecord | null> {
  return RECORDS.get(uid) ?? null;
}

export async function submitVerificationRaw(
  uid: string,
  input: SubmitVerificationInput,
): Promise<void> {
  const prev = RECORDS.get(uid);
  if (prev && prev.status === "pending_review") {
    throw new Error(
      "submitVerification(mock): verification already pending review",
    );
  }
  const now = new Date().toISOString();
  RECORDS.set(uid, {
    uid,
    status: "pending_review" as VerificationStatus,
    documentFrontPath: input.documentFrontPath,
    documentBackPath: input.documentBackPath,
    selfiePath: input.selfiePath,
    submittedAt: now,
    createdAt: prev?.createdAt ?? now,
  });
}
