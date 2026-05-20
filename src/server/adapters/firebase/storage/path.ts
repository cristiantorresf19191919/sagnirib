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

const VIDEO_EXTENSION_BY_MIME: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export function extensionForMime(mime: string): string {
  const ext = PHOTO_EXTENSION_BY_MIME[mime] ?? VIDEO_EXTENSION_BY_MIME[mime];
  if (!ext) {
    throw new Error(`storage/path: unsupported MIME ${mime}`);
  }
  return ext;
}

/** Whether the MIME belongs to the video family (ADR-015). */
export function isVideoMime(mime: string): boolean {
  return mime in VIDEO_EXTENSION_BY_MIME;
}

export function newPhotoId(): string {
  // 16-char hex. `crypto.randomUUID()` is available on Node 18+; we keep it
  // simple because the value's purpose is uniqueness, not unguessability.
  const buf = new Uint8Array(8);
  globalThis.crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Reused for videos — same uniqueness guarantee, no separate generator. */
export const newVideoId = newPhotoId;

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

export function stagingVideoPath(args: {
  ownerUid: string;
  sessionId: string;
  videoId: string;
  mime: string;
}): string {
  return [
    STORAGE_PATH_PREFIX.userStaging,
    args.ownerUid,
    "staging",
    args.sessionId,
    "videos",
    `${args.videoId}.${extensionForMime(args.mime)}`,
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

export function draftVideoPath(args: {
  draftId: string;
  videoId: string;
  extension: string;
}): string {
  return [
    STORAGE_PATH_PREFIX.draft,
    args.draftId,
    "videos",
    `${args.videoId}.${args.extension}`,
  ].join("/");
}

/**
 * Strict regex enforcing the staging shape. Used to reject `copyStagedToDraft`
 * inputs that try to harvest paths the caller doesn't own.
 */
const STAGING_PHOTO_REGEX =
  /^users\/([A-Za-z0-9_-]{6,128})\/staging\/([A-Za-z0-9_-]{8,64})\/photos\/([0-9a-f]{8,64})\.(jpg|webp)$/;

const STAGING_VIDEO_REGEX =
  /^users\/([A-Za-z0-9_-]{6,128})\/staging\/([A-Za-z0-9_-]{8,64})\/videos\/([0-9a-f]{8,64})\.(mp4|webm)$/;

export interface StagingPathParts {
  ownerUid: string;
  sessionId: string;
  photoId: string;
  extension: string;
}

export interface StagingVideoPathParts {
  ownerUid: string;
  sessionId: string;
  videoId: string;
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

export function parseStagingVideoPath(
  path: string,
): StagingVideoPathParts | null {
  const m = STAGING_VIDEO_REGEX.exec(path);
  if (!m) return null;
  return {
    ownerUid: m[1],
    sessionId: m[2],
    videoId: m[3],
    extension: m[4],
  };
}

/** Either a photo or video staging path is acceptable for confirmUpload. */
export function parseAnyStagingPath(
  path: string,
):
  | { kind: "photo"; parts: StagingPathParts }
  | { kind: "video"; parts: StagingVideoPathParts }
  | null {
  const photo = parseStagingPath(path);
  if (photo) return { kind: "photo", parts: photo };
  const video = parseStagingVideoPath(path);
  if (video) return { kind: "video", parts: video };
  return null;
}
