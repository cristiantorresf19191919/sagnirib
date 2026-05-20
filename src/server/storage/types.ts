import "server-only";

/**
 * Domain types for the storage port (ADR-012).
 *
 * The port mints **server-signed PUT URLs** the client uses to upload
 * compressed photos directly to Cloud Storage. The server decides the path,
 * the MIME, and the byte-range; the client only ever sees the resulting
 * `UploadTicket`. Storage credentials never reach the browser.
 *
 * Three asset states are encoded by the bucket layout, not by metadata:
 *   - `users/{ownerUid}/staging/{sessionId}/...`     ← uploaded by wizard
 *   - `listing_drafts/{draftId}/...`                 ← copied on submit
 *   - `listings/{listingSlug}/...`                   ← copied on admin approve
 *
 * A `sessionId` is generated server-side per upload-ticket request and lives
 * only inside the wizard's React state. It is NOT a security boundary by
 * itself — every signed URL is bound to `ownerUid`, MIME, and byte range, so
 * even if the sessionId leaks, the URL only PUTs the one expected file.
 */

export const STORAGE_ASSET_KINDS = ["photo", "video"] as const;
export type StorageAssetKind = (typeof STORAGE_ASSET_KINDS)[number];

export const STORAGE_LIMITS = {
  /** Per-photo cap AFTER client-side compression. Server rejects above. */
  photoMaxBytes: 4 * 1024 * 1024,
  /** Per-photo minimum — anything smaller is almost certainly broken. */
  photoMinBytes: 4 * 1024,
  /** Allowed MIME types for photo uploads. */
  photoMimes: ["image/jpeg", "image/webp"] as const,
  /**
   * Per-video cap (ADR-015). ~30s of phone-grade MP4 at 8–10Mbps fits
   * comfortably. The signed URL byte range rejects anything larger
   * before a byte is stored.
   */
  videoMaxBytes: 35 * 1024 * 1024,
  /** Anything smaller than this is a broken capture, not a 30s clip. */
  videoMinBytes: 50 * 1024,
  /** Allowed MIME types for video uploads. QuickTime intentionally
   *  omitted — Safari exports have edge-case audio compatibility. */
  videoMimes: ["video/mp4", "video/webm"] as const,
  /** Hard duration cap enforced client-side (server cannot inspect
   *  media content from a signed PUT URL). */
  videoMaxDurationSeconds: 30,
  /** Anything shorter is an accidental 0.5s tap that no one wants. */
  videoMinDurationSeconds: 3,
  /** Founder cap (ADR-015): at most 2 videos per listing. */
  videoMaxPerListing: 2,
  /** Signed URL TTL for photos. */
  ticketTtlSeconds: 5 * 60,
  /** Longer TTL for videos — slower uploads over LTE need the headroom. */
  videoTicketTtlSeconds: 10 * 60,
  /** Max staged files per session — protects against pathological clients
   *  that hammer requestUploadTicket. The wizard never goes near this; the
   *  hardest tier (Premium) is at 24. */
  maxStagedPerSession: 30,
} as const;

export type StorageMime =
  | (typeof STORAGE_LIMITS.photoMimes)[number]
  | (typeof STORAGE_LIMITS.videoMimes)[number];

/**
 * Inbound shape to `requestUploadTicket`. The client supplies what it knows
 * about the file (kind, size after compression, MIME) and a stable
 * `sessionId` — generated once when the wizard mounts. The server fills in
 * everything else.
 */
export interface UploadTicketInput {
  kind: StorageAssetKind;
  sessionId: string;
  contentType: string;
  sizeBytes: number;
}

/**
 * Server-issued ticket the client uses to upload exactly one file.
 *
 * `uploadUrl` is single-use against the chosen `path`, `contentType`, and
 * byte-range. The client MUST send `Content-Type` matching the signed value
 * AND `x-goog-content-length-range: 1,<photoMaxBytes>`. Any deviation
 * returns 403 from GCS without the bytes ever being stored.
 */
export interface UploadTicket {
  /** The signed PUT URL. Single-use; expires at `expiresAt`. */
  uploadUrl: string;
  /** The canonical bucket path the upload lands at, e.g.
   *  `users/<uid>/staging/<sessionId>/photos/<photoId>.jpg`. */
  path: string;
  /** ISO-8601 UTC expiry. Client uses this for the visible timer / retry. */
  expiresAt: string;
  /** Headers the client MUST include verbatim on the PUT, beyond Content-Type. */
  requiredHeaders: Record<string, string>;
  /** The MIME the URL is signed for. Echoed for client convenience. */
  contentType: string;
  /** Maximum bytes the signed URL accepts. Echoed for client convenience. */
  maxBytes: number;
}

/**
 * Inbound shape to `confirmUpload`. After the client PUTs to `uploadUrl`, it
 * calls confirmUpload with the same `path`. The server HEADs the blob to
 * verify it actually landed (matching `ownerUid`, expected `contentType`,
 * non-zero size) before the wizard records it as ready.
 */
export interface ConfirmUploadInput {
  path: string;
}

/** Lightweight metadata returned by `confirmUpload`. */
export interface StorageAsset {
  /** Canonical bucket path (same value the wizard already holds). */
  path: string;
  /** Effective stored MIME (read back from object metadata). */
  contentType: string;
  /** Effective stored byte size (read back from object metadata). */
  sizeBytes: number;
}

/**
 * Inbound shape for the internal `copyStagedToDraft` helper. Called by
 * `createListingDraft` once it has a `draftId`. Moves every staged path
 * into the draft's canonical prefix and deletes the staging originals.
 */
export interface CopyStagedToDraftInput {
  /** The session whose staged files we're harvesting. */
  sessionId: string;
  /** The new draft id to scope the copies under. */
  draftId: string;
  /** Staging paths the wizard reported as ready. Every entry MUST start with
   *  `users/<ownerUid>/staging/<sessionId>/` — the adapter rejects otherwise. */
  paths: ReadonlyArray<string>;
}

export interface CopyStagedToDraftResult {
  /** New canonical paths under `listing_drafts/<draftId>/...`, in the same
   *  order as the input. */
  draftPaths: ReadonlyArray<string>;
}

/** Path prefix constants — sole source of truth for callers that compose
 *  paths. Hardcoded prefixes elsewhere are an audit violation (rule 9). */
export const STORAGE_PATH_PREFIX = {
  userStaging: "users",
  draft: "listing_drafts",
  listing: "listings",
} as const;
