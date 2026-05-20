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
 *   - signKycUploadUrlRawForOwner — V4 PUT URL bound to path + MIME +
 *     byte-range. Same security model as the photo upload (ADR-012).
 *   - confirmKycUploadRawForOwner — HEAD-checks the blob, validates
 *     ownership via path shape.
 *
 * The path is server-minted, so even if the client tampers with the
 * `kind` field, the URL is still bound to a path the server picked.
 */

const VERIFICATION_CACHE_CONTROL = "private, max-age=0, no-store";

export async function signKycUploadUrlRawForOwner(
  ownerUid: string,
  input: KycUploadTicketInput,
): Promise<KycUploadTicket> {
  const bucket = getBucket();

  const path = verificationAssetPath({
    ownerUid,
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

export async function confirmKycUploadRawForOwner(
  expectedOwnerUid: string,
  path: string,
): Promise<KycAsset> {
  const parts = parseVerificationPath(path);
  if (!parts) {
    throw new FirebaseAdapterError(
      "invalid-argument",
      `verification/confirmKycUpload: path does not match verification shape: ${path}`,
    );
  }
  if (parts.ownerUid !== expectedOwnerUid) {
    throw new FirebaseAdapterError(
      "permission-denied",
      "verification/confirmKycUpload: caller is not the owner of this path",
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
