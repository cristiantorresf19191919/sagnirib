import "server-only";

import { FirebaseAdapterError } from "@/server/adapters/firebase/errors";
import {
  STORAGE_LIMITS,
  type CopyStagedToDraftInput,
  type CopyStagedToDraftResult,
  type StorageAsset,
  type UploadTicketInput,
  type UploadTicket,
} from "@/server/storage/types";

import { getBucket } from "./client";
import {
  draftPhotoPath,
  draftVideoPath,
  newPhotoId,
  newVideoId,
  parseAnyStagingPath,
  stagingPhotoPath,
  stagingVideoPath,
} from "./path";

/**
 * Adapter façade — signs upload URLs, HEAD-checks uploaded blobs, and
 * promotes staged blobs into the draft prefix.
 *
 * NEVER expose any of these directly to features. The barrel
 * `@/server/storage` is the only public surface; it adds auth + audit on
 * every call.
 *
 * All filesystem-y operations route through `getBucket()` which is bound
 * to `FIREBASE_STORAGE_BUCKET` via `requireFirebaseConfig()`. The bucket
 * has `storage.rules` set to deny-all for the client SDK; this Admin SDK
 * access goes via IAM (the service account holds `Storage Object Admin`).
 */

const STAGING_CACHE_CONTROL = "private, max-age=0, no-store";
const DRAFT_CACHE_CONTROL = "private, max-age=0, no-store";

export async function signUploadUrlRawForOwner(
  ownerUid: string,
  input: UploadTicketInput,
): Promise<UploadTicket> {
  const bucket = getBucket();

  // Per-kind dispatch — photos and videos differ in path sub-prefix,
  // size cap, and TTL. The schema validator already constrained MIME
  // and size to the correct family before we got here.
  const isVideo = input.kind === "video";
  const maxBytes = isVideo
    ? STORAGE_LIMITS.videoMaxBytes
    : STORAGE_LIMITS.photoMaxBytes;
  const ttlSeconds = isVideo
    ? STORAGE_LIMITS.videoTicketTtlSeconds
    : STORAGE_LIMITS.ticketTtlSeconds;

  const path = isVideo
    ? stagingVideoPath({
        ownerUid,
        sessionId: input.sessionId,
        videoId: newVideoId(),
        mime: input.contentType,
      })
    : stagingPhotoPath({
        ownerUid,
        sessionId: input.sessionId,
        photoId: newPhotoId(),
        mime: input.contentType,
      });

  const expiresMs = Date.now() + ttlSeconds * 1000;

  // V4 signing locks:
  //   - HTTP method (PUT, via action: 'write')
  //   - path (we choose the destination file)
  //   - contentType (the client MUST send the same Content-Type header)
  //   - byte range via X-Goog-Content-Length-Range (rejects out-of-range PUTs at GCS edge)
  // A request that deviates from any of these returns 403 BEFORE GCS stores a byte.
  const contentLengthRange = `1,${maxBytes}`;

  let uploadUrl: string;
  try {
    const [signed] = await bucket.file(path).getSignedUrl({
      version: "v4",
      action: "write",
      expires: expiresMs,
      contentType: input.contentType,
      extensionHeaders: {
        "x-goog-content-length-range": contentLengthRange,
        "cache-control": STAGING_CACHE_CONTROL,
      },
    });
    uploadUrl = signed;
  } catch (err) {
    throw wrapStorageError("signUploadUrl", err);
  }

  return {
    uploadUrl,
    path,
    expiresAt: new Date(expiresMs).toISOString(),
    requiredHeaders: {
      "x-goog-content-length-range": contentLengthRange,
      "cache-control": STAGING_CACHE_CONTROL,
    },
    contentType: input.contentType,
    maxBytes,
  };
}

/**
 * Verifies an uploaded blob actually exists at `path` and is owned by
 * `expectedOwnerUid`. Ownership is derived from the path shape (which the
 * server minted at sign time) — the parser also doubles as a guard against
 * a malicious client sending us a fabricated path.
 *
 * Dispatches between photo and video staging shapes; the per-family
 * MIME + size caps are checked accordingly. Returns the asset metadata
 * (size, contentType) for the wizard to display.
 */
export async function confirmUploadRawForOwner(
  expectedOwnerUid: string,
  path: string,
): Promise<StorageAsset> {
  const parsed = parseAnyStagingPath(path);
  if (!parsed) {
    throw new FirebaseAdapterError(
      "invalid-argument",
      `storage/confirmUpload: path does not match staging shape: ${path}`,
    );
  }
  if (parsed.parts.ownerUid !== expectedOwnerUid) {
    throw new FirebaseAdapterError(
      "permission-denied",
      "storage/confirmUpload: caller is not the owner of this path",
    );
  }

  const file = getBucket().file(path);

  let exists: boolean;
  try {
    [exists] = await file.exists();
  } catch (err) {
    throw wrapStorageError("confirmUpload:exists", err);
  }
  if (!exists) {
    throw new FirebaseAdapterError(
      "not-found",
      "storage/confirmUpload: no blob at path — client did not finish the PUT",
    );
  }

  try {
    const [meta] = await file.getMetadata();
    const sizeRaw = meta.size;
    const size = typeof sizeRaw === "string" ? Number.parseInt(sizeRaw, 10) : Number(sizeRaw ?? 0);
    const contentType = (meta.contentType as string | undefined) ?? "application/octet-stream";

    if (!Number.isFinite(size) || size <= 0) {
      throw new FirebaseAdapterError(
        "invalid-argument",
        "storage/confirmUpload: stored object is empty",
      );
    }

    const isVideo = parsed.kind === "video";
    const allowedMimes = isVideo
      ? (STORAGE_LIMITS.videoMimes as ReadonlyArray<string>)
      : (STORAGE_LIMITS.photoMimes as ReadonlyArray<string>);
    const maxBytes = isVideo
      ? STORAGE_LIMITS.videoMaxBytes
      : STORAGE_LIMITS.photoMaxBytes;

    if (size > maxBytes) {
      // Should be impossible because the signed URL enforces the range, but
      // we defend in depth.
      throw new FirebaseAdapterError(
        "invalid-argument",
        `storage/confirmUpload: stored object exceeds cap (${size} > ${maxBytes})`,
      );
    }
    if (!allowedMimes.includes(contentType)) {
      throw new FirebaseAdapterError(
        "invalid-argument",
        `storage/confirmUpload: contentType ${contentType} is not allowed`,
      );
    }

    return { path, contentType, sizeBytes: size };
  } catch (err) {
    if (err instanceof FirebaseAdapterError) throw err;
    throw wrapStorageError("confirmUpload:getMetadata", err);
  }
}

/**
 * Promotes every staging path into the draft prefix. Best-effort fan-out:
 *
 *   1. Validates each path is in the caller's staging area.
 *   2. Copies the blob to `listing_drafts/{draftId}/photos/{photoId}.{ext}`.
 *   3. Deletes the staging original.
 *
 * If a single copy fails the whole call aborts — leaving the caller's
 * staging files intact so they can retry. Already-copied draft entries are
 * NOT rolled back; they will be naturally orphaned in the rare partial
 * failure case (admin queue can spot empty-payload drafts; future
 * compensating job can sweep them). This trade-off keeps the happy path
 * simple and avoids a write-side coordinator on every submit.
 */
export async function copyStagedToDraftRawForOwner(
  ownerUid: string,
  input: CopyStagedToDraftInput,
): Promise<CopyStagedToDraftResult> {
  const bucket = getBucket();
  const draftPaths: string[] = [];

  for (const source of input.paths) {
    const parsed = parseAnyStagingPath(source);
    if (!parsed) {
      throw new FirebaseAdapterError(
        "invalid-argument",
        `storage/copyStagedToDraft: ${source} is not a staging photo or video path`,
      );
    }
    const { parts } = parsed;
    if (parts.ownerUid !== ownerUid) {
      throw new FirebaseAdapterError(
        "permission-denied",
        `storage/copyStagedToDraft: ${source} does not belong to caller`,
      );
    }
    if (parts.sessionId !== input.sessionId) {
      throw new FirebaseAdapterError(
        "permission-denied",
        `storage/copyStagedToDraft: ${source} is not in the submitted session`,
      );
    }

    const dest =
      parsed.kind === "video"
        ? draftVideoPath({
            draftId: input.draftId,
            videoId: parsed.parts.videoId,
            extension: parsed.parts.extension,
          })
        : draftPhotoPath({
            draftId: input.draftId,
            photoId: parsed.parts.photoId,
            extension: parsed.parts.extension,
          });

    try {
      const srcFile = bucket.file(source);
      const destFile = bucket.file(dest);
      await srcFile.copy(destFile, {
        // Inherit content-type; deny CDN caching while in draft state.
        metadata: { cacheControl: DRAFT_CACHE_CONTROL },
      });
      await srcFile.delete({ ignoreNotFound: true });
      draftPaths.push(dest);
    } catch (err) {
      throw wrapStorageError("copyStagedToDraft:copy", err);
    }
  }

  return { draftPaths };
}

interface StorageLikeError {
  code?: string | number;
  message?: string;
}

function wrapStorageError(context: string, err: unknown): FirebaseAdapterError {
  const e = err as StorageLikeError | undefined;
  const codeRaw = e?.code;
  const code = typeof codeRaw === "number" ? String(codeRaw) : (codeRaw ?? "");
  const msg = `[firebase:${context}] ${e?.message ?? "unknown error"}`;

  // Cloud Storage uses HTTP-style numeric codes for most failures.
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
