import "server-only";

import { FirebaseAdapterError } from "@/server/adapters/firebase/errors";
import { getBucket } from "@/server/adapters/firebase/storage/client";
import {
  VERIFICATION_LIMITS,
  type KycAsset,
  type KycUploadTicket,
  type KycUploadTicketInput,
} from "@/server/verification/types";

import { parseVerificationPath, verificationAssetPath } from "./path";

/**
 * Storage adapter for the verification port. Reuses the bucket singleton
 * that the photo adapter already uses (same Firebase app, same bucket).
 *
 * Two operations:
 *   - signKycUploadUrlRawForPerson — V4 PUT URL bound to path + MIME +
 *     byte-range. Same security model as the photo upload (ADR-012).
 *   - confirmKycUploadRawForPerson — HEAD-checks the blob, validates
 *     ownership via path shape.
 *
 * The path is server-minted, so even if the client tampers with the
 * `kind` field, the URL is still bound to a path the server picked.
 * ADR-018 Phase A: the second path segment is the **personId** (not
 * the account uid). Person-ownership is verified by the barrel BEFORE
 * the adapter is invoked.
 */

const VERIFICATION_CACHE_CONTROL = "private, max-age=0, no-store";

export async function signKycUploadUrlRawForPerson(
  personId: string,
  // `ownerUid` is accepted for signature parity with the mock adapter
  // (which uses it to tag the in-memory blob owner). The Firebase
  // signed URL is bound to the path + MIME + byte-range and does not
  // need the uid embedded; the caller already verified ownership
  // before reaching this adapter.
  _ownerUid: string,
  input: KycUploadTicketInput,
): Promise<KycUploadTicket> {
  const bucket = getBucket();

  const path = verificationAssetPath({
    personId,
    kind: input.kind,
    mime: input.contentType,
  });

  const expiresMs = Date.now() + VERIFICATION_LIMITS.ticketTtlSeconds * 1000;
  const contentLengthRange = `1,${VERIFICATION_LIMITS.fileMaxBytes}`;

  let uploadUrl: string;
  try {
    const [signed] = await bucket.file(path).getSignedUrl({
      version: "v4",
      action: "write",
      expires: expiresMs,
      contentType: input.contentType,
      extensionHeaders: {
        "x-goog-content-length-range": contentLengthRange,
        "cache-control": VERIFICATION_CACHE_CONTROL,
      },
    });
    uploadUrl = signed;
  } catch (err) {
    throw wrapKycStorageError("signKycUploadUrl", err);
  }

  return {
    uploadUrl,
    path,
    expiresAt: new Date(expiresMs).toISOString(),
    requiredHeaders: {
      "x-goog-content-length-range": contentLengthRange,
      "cache-control": VERIFICATION_CACHE_CONTROL,
    },
    contentType: input.contentType,
    maxBytes: VERIFICATION_LIMITS.fileMaxBytes,
  };
}

/**
 * Mints a short-lived V4 signed GET URL for an already-uploaded KYC
 * asset, so the dashboard can render `pending_review` / `approved`
 * documents as a read-only view.
 *
 * Defense in depth — the path is parsed for shape AND its embedded
 * `personId` segment is required to match `expectedPersonId`, so even
 * if the barrel mis-passes a path from a different person, the adapter
 * refuses to sign. TTL is short (default 10 min) and intentionally
 * shorter than the cookie/session lifetime; URLs leaked through the
 * referer chain stop working quickly.
 */
export async function signKycReadUrlRawForPerson(
  expectedPersonId: string,
  path: string,
  ttlSeconds: number = 600,
): Promise<string> {
  const parts = parseVerificationPath(path);
  if (!parts) {
    throw new FirebaseAdapterError(
      "invalid-argument",
      `verification/signKycReadUrl: path does not match verification shape: ${path}`,
    );
  }
  if (parts.personId !== expectedPersonId) {
    throw new FirebaseAdapterError(
      "permission-denied",
      "verification/signKycReadUrl: path does not match the supplied personId",
    );
  }

  const expiresMs = Date.now() + ttlSeconds * 1000;
  try {
    const [signed] = await getBucket().file(path).getSignedUrl({
      version: "v4",
      action: "read",
      expires: expiresMs,
    });
    return signed;
  } catch (err) {
    throw wrapKycStorageError("signKycReadUrl", err);
  }
}

export async function confirmKycUploadRawForPerson(
  expectedPersonId: string,
  path: string,
): Promise<KycAsset> {
  const parts = parseVerificationPath(path);
  if (!parts) {
    throw new FirebaseAdapterError(
      "invalid-argument",
      `verification/confirmKycUpload: path does not match verification shape: ${path}`,
    );
  }
  if (parts.personId !== expectedPersonId) {
    throw new FirebaseAdapterError(
      "permission-denied",
      "verification/confirmKycUpload: path does not match the supplied personId",
    );
  }

  const file = getBucket().file(path);

  let exists: boolean;
  try {
    [exists] = await file.exists();
  } catch (err) {
    throw wrapKycStorageError("confirmKycUpload:exists", err);
  }
  if (!exists) {
    throw new FirebaseAdapterError(
      "not-found",
      "verification/confirmKycUpload: no blob at path — client did not finish the PUT",
    );
  }

  try {
    const [meta] = await file.getMetadata();
    const sizeRaw = meta.size;
    const size =
      typeof sizeRaw === "string"
        ? Number.parseInt(sizeRaw, 10)
        : Number(sizeRaw ?? 0);
    const contentType =
      (meta.contentType as string | undefined) ?? "application/octet-stream";

    if (!Number.isFinite(size) || size <= 0) {
      throw new FirebaseAdapterError(
        "invalid-argument",
        "verification/confirmKycUpload: stored object is empty",
      );
    }
    if (size > VERIFICATION_LIMITS.fileMaxBytes) {
      throw new FirebaseAdapterError(
        "invalid-argument",
        `verification/confirmKycUpload: stored object exceeds cap (${size} > ${VERIFICATION_LIMITS.fileMaxBytes})`,
      );
    }
    if (
      !(VERIFICATION_LIMITS.fileMimes as ReadonlyArray<string>).includes(
        contentType,
      )
    ) {
      throw new FirebaseAdapterError(
        "invalid-argument",
        `verification/confirmKycUpload: contentType ${contentType} is not allowed`,
      );
    }

    return { path, contentType, sizeBytes: size };
  } catch (err) {
    if (err instanceof FirebaseAdapterError) throw err;
    throw wrapKycStorageError("confirmKycUpload:getMetadata", err);
  }
}

interface StorageLikeError {
  code?: string | number;
  message?: string;
}

function wrapKycStorageError(
  context: string,
  err: unknown,
): FirebaseAdapterError {
  const e = err as StorageLikeError | undefined;
  const codeRaw = e?.code;
  const code =
    typeof codeRaw === "number" ? String(codeRaw) : (codeRaw ?? "");
  const msg = `[firebase:${context}] ${e?.message ?? "unknown error"}`;
  switch (code) {
    case "403":
      return new FirebaseAdapterError("permission-denied", msg, err);
    case "404":
      return new FirebaseAdapterError("not-found", msg, err);
    case "412":
      return new FirebaseAdapterError("invalid-argument", msg, err);
    case "503":
    case "500":
      return new FirebaseAdapterError("unavailable", msg, err);
    default:
      return new FirebaseAdapterError("internal", msg, err);
  }
}
