import "server-only";

import { STORAGE_PATH_PREFIX } from "@/server/storage/types";

/**
 * Path generators — the **single source of truth** for bucket prefixes.
 *
 * `firebase-data-ownership` rule 9 forbids hardcoded bucket prefixes anywhere
 * else: any string literal that looks like `users/...`, `listing_drafts/...`,
 * or `listings/...` outside this file (and adapter siblings) is an audit fail.
 *
 * `photoId` is a short server-side random — its purpose is uniqueness, not
 * authorization, so a 16-hex token is plenty.
 */

const PHOTO_EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export function extensionForMime(mime: string): string {
  const ext = PHOTO_EXTENSION_BY_MIME[mime];
  if (!ext) {
    throw new Error(`storage/path: unsupported MIME ${mime}`);
  }
  return ext;
}

export function newPhotoId(): string {
  // 16-char hex. `crypto.randomUUID()` is available on Node 18+; we keep it
  // simple because the value's purpose is uniqueness, not unguessability.
  const buf = new Uint8Array(8);
  globalThis.crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function stagingPhotoPath(args: {
  ownerUid: string;
  sessionId: string;
  photoId: string;
  mime: string;
}): string {
  return [
    STORAGE_PATH_PREFIX.userStaging,
    args.ownerUid,
    "staging",
    args.sessionId,
    "photos",
    `${args.photoId}.${extensionForMime(args.mime)}`,
  ].join("/");
}

export function draftPhotoPath(args: {
  draftId: string;
  photoId: string;
  extension: string;
}): string {
  return [
    STORAGE_PATH_PREFIX.draft,
    args.draftId,
    "photos",
    `${args.photoId}.${args.extension}`,
  ].join("/");
}

/**
 * Strict regex enforcing the staging shape. Used to reject `copyStagedToDraft`
 * inputs that try to harvest paths the caller doesn't own.
 */
const STAGING_PHOTO_REGEX =
  /^users\/([A-Za-z0-9_-]{6,128})\/staging\/([A-Za-z0-9_-]{8,64})\/photos\/([0-9a-f]{8,64})\.(jpg|webp)$/;

export interface StagingPathParts {
  ownerUid: string;
  sessionId: string;
  photoId: string;
  extension: string;
}

export function parseStagingPath(path: string): StagingPathParts | null {
  const m = STAGING_PHOTO_REGEX.exec(path);
  if (!m) return null;
  return {
    ownerUid: m[1],
    sessionId: m[2],
    photoId: m[3],
    extension: m[4],
  };
}
