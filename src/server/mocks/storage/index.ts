import "server-only";

import {
  STORAGE_LIMITS,
  type CopyStagedToDraftInput,
  type CopyStagedToDraftResult,
  type StorageAsset,
  type UploadTicketInput,
  type UploadTicket,
} from "@/server/storage/types";

import { mockStore } from "./store";

/**
 * In-memory storage mock — keeps `/publicar` end-to-end demonstrable in dev
 * even without Firebase Storage configured.
 *
 * Wire shape is **identical** to the real adapter: the wizard issues a
 * ticket, PUTs to `uploadUrl`, then calls confirmUpload. The mock returns
 * a `uploadUrl` that points at `/api/_storage-mock/<encoded-path>` —
 * a tiny Route Handler under `src/app/api/_storage-mock/[...key]/route.ts`
 * accepts the PUT and stashes the blob in `mockStore`.
 *
 * Process-local — restart wipes the store. NEVER mounted in production:
 * the barrel routes to the Firebase adapter when `isFirebaseConfigured()`
 * returns true, and the Route Handler itself returns 404 when that env is set.
 */

function newAssetId(): string {
  const buf = new Uint8Array(8);
  globalThis.crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export async function signUploadUrlRawForOwner(
  ownerUid: string,
  input: UploadTicketInput,
): Promise<UploadTicket> {
  const ext = EXT_BY_MIME[input.contentType] ?? "bin";
  const assetId = newAssetId();
  // Per-kind path layout + cap dispatch — same shape as the Firebase
  // adapter so the wizard stays kind-agnostic.
  const isVideo = input.kind === "video";
  const subPrefix = isVideo ? "videos" : "photos";
  const path = `users/${ownerUid}/staging/${input.sessionId}/${subPrefix}/${assetId}.${ext}`;
  const maxBytes = isVideo
    ? STORAGE_LIMITS.videoMaxBytes
    : STORAGE_LIMITS.photoMaxBytes;
  const ttlSeconds = isVideo
    ? STORAGE_LIMITS.videoTicketTtlSeconds
    : STORAGE_LIMITS.ticketTtlSeconds;

  const expiresMs = Date.now() + ttlSeconds * 1000;
  const token = mockStore.reserveTicket({
    path,
    ownerUid,
    contentType: input.contentType,
    sessionId: input.sessionId,
    expiresAt: expiresMs,
    maxBytes,
  });

  // Relative URL — the wizard PUTs to the same origin it loaded from. The
  // Route Handler resolves `token` back to the reservation.
  const uploadUrl = `/api/_storage-mock/${token}`;
  const contentLengthRange = `1,${maxBytes}`;

  return {
    uploadUrl,
    path,
    expiresAt: new Date(expiresMs).toISOString(),
    requiredHeaders: {
      "x-goog-content-length-range": contentLengthRange,
      "cache-control": "private, max-age=0, no-store",
    },
    contentType: input.contentType,
    maxBytes,
  };
}

export async function confirmUploadRawForOwner(
  expectedOwnerUid: string,
  path: string,
): Promise<StorageAsset> {
  const blob = mockStore.getBlob(path);
  if (!blob) {
    const err = new Error(
      "storage(mock)/confirmUpload: no blob at path — client did not PUT",
    );
    (err as { kind?: string }).kind = "not-found";
    throw err;
  }
  if (blob.ownerUid !== expectedOwnerUid) {
    const err = new Error(
      "storage(mock)/confirmUpload: caller is not the owner of this path",
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

export async function copyStagedToDraftRawForOwner(
  ownerUid: string,
  input: CopyStagedToDraftInput,
): Promise<CopyStagedToDraftResult> {
  const draftPaths: string[] = [];
  for (const source of input.paths) {
    const dest = mockStore.copyToDraft({
      source,
      draftId: input.draftId,
      ownerUid,
      sessionId: input.sessionId,
    });
    draftPaths.push(dest);
  }
  return { draftPaths };
}
