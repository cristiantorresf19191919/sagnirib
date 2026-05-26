import "server-only";

import {
  VERIFICATION_DOCUMENT_LIMITS,
  type DocumentType,
} from "@/shared/verification/limits";

export { DOCUMENT_TYPES } from "@/shared/verification/limits";
export type { DocumentType } from "@/shared/verification/limits";

/**
 * Domain types for KYC verification (ADR-014, ADR-018).
 *
 * One Firestore doc per **person** under `verifications/{personId}` —
 * the doc id is the personId from the persons port. (ADR-018 Phase A:
 * the collection name stays `verifications/`; only the doc-id space
 * changes from uid to personId. The doc-id space is opaque, so lazy-
 * migrated accounts whose `personId === uid` keep working untouched.)
 *
 * State machine:
 *   not_submitted → pending_review → approved
 *                                 ↘ rejected → modelo resubmite
 *
 * Resubmission overwrites the same doc; audit log preserves the history
 * of attempts so a sweep can reconstruct the trail later.
 */

export type VerificationStatus =
  | "not_submitted"
  | "pending_review"
  | "approved"
  | "rejected";

export const VERIFICATION_UPLOAD_KINDS = [
  "document_front",
  "document_back",
  "selfie",
] as const;
export type VerificationUploadKind =
  (typeof VERIFICATION_UPLOAD_KINDS)[number];

/**
 * Structured identity captured alongside the document images
 * (ADR-018 § "Document number uniqueness"). The pair
 * `(documentType, documentNumber)` is globally unique across all
 * non-rejected KYC submissions — this is what prevents the same
 * physical person from registering twice under different accounts.
 *
 * `DOCUMENT_TYPES` and `DocumentType` are re-exported above from
 * `@/shared/verification/limits` so client components can use them
 * without importing `server-only`.
 */

export const VERIFICATION_LIMITS = {
  /** Per-file cap AFTER client compression. Server rejects above. Same as
   *  the photo cap — these images go through the same compression policy. */
  fileMaxBytes: 4 * 1024 * 1024,
  fileMinBytes: 4 * 1024,
  /** MIME allowlist matches the photo upload (jpg + webp). */
  fileMimes: ["image/jpeg", "image/webp"] as const,
  /** Signed URL TTL. */
  ticketTtlSeconds: 5 * 60,
  /** Rejection reason length bounds. */
  rejectionReasonMin: 3,
  rejectionReasonMax: 500,
  /** Document number length bounds (post-normalization). Mirrored
   *  from `@/shared/verification/limits` so existing server-side
   *  `VERIFICATION_LIMITS.documentNumberMin/Max` reads keep working. */
  documentNumberMin: VERIFICATION_DOCUMENT_LIMITS.documentNumberMin,
  documentNumberMax: VERIFICATION_DOCUMENT_LIMITS.documentNumberMax,
} as const;

/**
 * Server-issued ticket for a single KYC file. Same shape as the photo
 * ticket (ADR-012) — the wizard PUTs the compressed JPEG to `uploadUrl`,
 * sending Content-Type and `requiredHeaders` verbatim.
 */
export interface KycUploadTicket {
  uploadUrl: string;
  path: string;
  expiresAt: string;
  requiredHeaders: Record<string, string>;
  contentType: string;
  maxBytes: number;
}

export interface KycUploadTicketInput {
  /** The person this KYC asset belongs to. The signed URL is bound to
   *  `verifications/{personId}/<kind>.<ext>`; ownership of the person
   *  is verified BEFORE the URL is minted. */
  personId: string;
  kind: VerificationUploadKind;
  contentType: string;
  sizeBytes: number;
}

export interface ConfirmKycUploadInput {
  /** The person this KYC asset belongs to. Cross-checked against the
   *  personId segment embedded in `path` (defense in depth). */
  personId: string;
  path: string;
}

export interface KycAsset {
  path: string;
  contentType: string;
  sizeBytes: number;
}

/**
 * Submission shape. After all 3 uploads + confirms, the wizard POSTs
 * this to materialize the `verifications/{personId}` doc with
 * `status='pending_review'`.
 *
 * `documentType` + `documentNumber` (ADR-018 amendment): structured
 * identity that lets the platform enforce per-person uniqueness
 * across accounts. The wizard normalizes the number before sending;
 * the schema re-normalizes server-side as defense in depth.
 */
export interface SubmitVerificationInput {
  /** The person this submission is for. Verified ownership against
   *  `persons/{personId}.ownerUid === caller.uid` at submit time. */
  personId: string;
  documentFrontPath: string;
  documentBackPath: string;
  selfiePath: string;
  documentType: DocumentType;
  documentNumber: string;
}

/**
 * Read shape — what the admin and the modelo's own surface see when
 * loading `verifications/{personId}`. Timestamps converted to ISO at
 * the adapter layer.
 *
 * `personId` mirrors the doc id. `ownerUid` is the account that
 * administers this person (denormalized for audit / admin-side
 * queries that need to surface the owner without joining `persons/`).
 */
export interface VerificationRecord {
  personId: string;
  ownerUid?: string;
  status: VerificationStatus;
  documentFrontPath?: string;
  documentBackPath?: string;
  selfiePath?: string;
  /** Identity document kind. Absent on lazy-migrated legacy docs that
   *  predate the ADR-018 amendment; mandatory on every new submit. */
  documentType?: DocumentType;
  /** Normalized identity number (uppercase + alphanumeric only).
   *  Absent on lazy-migrated legacy docs; mandatory on every new submit. */
  documentNumber?: string;
  submittedAt?: string;
  createdAt?: string;
  approvedAt?: string;
  approvedByUid?: string;
  rejectedAt?: string;
  rejectedByUid?: string;
  rejectionReason?: string;
}

/**
 * Short-lived signed read URLs for the 3 KYC assets, used by the
 * dashboard to render an already-submitted verification as a read-only
 * view. Minted server-side from `verifications/{personId}/*` paths via
 * the storage adapter; never exposed when status is `not_submitted`
 * (nothing to show) or `rejected` (the modelo is re-uploading).
 */
export interface KycReadUrls {
  documentFront: string;
  documentBack: string;
  selfie: string;
}

/**
 * Composed view that pairs the verification record with optional read
 * URLs. `readUrls` is non-null only when the record is in a terminal-
 * read state (`pending_review` or `approved`) AND all three paths are
 * present.
 */
export interface VerificationView {
  record: VerificationRecord;
  readUrls: KycReadUrls | null;
}

/** Path prefix — sole source of truth for the verification bucket layout. */
export const VERIFICATION_PATH_PREFIX = "verifications" as const;
