import "server-only";

/**
 * Domain types for KYC verification (ADR-014).
 *
 * One Firestore doc per user under `verifications/{uid}`. State machine:
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
  kind: VerificationUploadKind;
  contentType: string;
  sizeBytes: number;
}

export interface ConfirmKycUploadInput {
  path: string;
}

export interface KycAsset {
  path: string;
  contentType: string;
  sizeBytes: number;
}

/**
 * Submission shape. After all 3 uploads + confirms, the wizard POSTs
 * this to materialize the `verifications/{uid}` doc with
 * `status='pending_review'`.
 */
export interface SubmitVerificationInput {
  documentFrontPath: string;
  documentBackPath: string;
  selfiePath: string;
}

/**
 * Read shape — what the admin and the modelo's own surface see when
 * loading `verifications/{uid}`. Timestamps converted to ISO at the
 * adapter layer.
 */
export interface VerificationRecord {
  uid: string;
  status: VerificationStatus;
  documentFrontPath?: string;
  documentBackPath?: string;
  selfiePath?: string;
  submittedAt?: string;
  createdAt?: string;
  approvedAt?: string;
  approvedByUid?: string;
  rejectedAt?: string;
  rejectedByUid?: string;
  rejectionReason?: string;
}

/** Path prefix — sole source of truth for the verification bucket layout. */
export const VERIFICATION_PATH_PREFIX = "verifications" as const;
