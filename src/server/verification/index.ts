import "server-only";

import { isFirebaseConfigured } from "@/core/config/firebase";
import { auditLog } from "@/server/security/audit-log";
import { requireAuth } from "@/server/security/require-auth";
import { validateActionInput } from "@/server/security/validate-action-input";

import {
  confirmKycUploadSchema,
  kycUploadTicketSchema,
  submitVerificationSchema,
} from "./schemas";
import type {
  ConfirmKycUploadInput,
  KycAsset,
  KycUploadTicket,
  KycUploadTicketInput,
  SubmitVerificationInput,
  VerificationRecord,
} from "./types";

export type {
  ConfirmKycUploadInput,
  KycAsset,
  KycUploadTicket,
  KycUploadTicketInput,
  SubmitVerificationInput,
  VerificationRecord,
  VerificationStatus,
  VerificationUploadKind,
} from "./types";
export {
  VERIFICATION_LIMITS,
  VERIFICATION_UPLOAD_KINDS,
} from "./types";

/**
 * Public barrel for the verification port (ADR-014).
 *
 * Wraps the adapter with:
 *   1. validateActionInput  — server is the source of truth
 *   2. requireAuth          — anonymous KYC uploads refused
 *   3. adapter call         — owner-scoped, path-validated
 *   4. auditLog             — every step traceable
 *
 * Routed to Firebase if configured, otherwise to the in-memory mock.
 */

const adapter = isFirebaseConfigured()
  ? await import("@/server/adapters/firebase/verification")
  : await import("@/server/mocks/verification");

/** Single-use signed PUT URL for one KYC asset. */
export async function requestKycUploadTicket(
  rawInput: unknown,
): Promise<KycUploadTicket> {
  const input: KycUploadTicketInput = validateActionInput(
    kycUploadTicketSchema,
    rawInput,
  );
  const user = await requireAuth();

  const ticket = await adapter.signKycUploadUrlRawForOwner(user.uid, input);

  await auditLog({
    event: "biringa.verification.upload_ticket_requested",
    actorId: user.uid,
    resource: `verification:${user.uid}:${input.kind}`,
    metadata: {
      kind: input.kind,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
    },
  });

  return ticket;
}

/** HEAD-checks an uploaded KYC asset. */
export async function confirmKycUpload(rawInput: unknown): Promise<KycAsset> {
  const input: ConfirmKycUploadInput = validateActionInput(
    confirmKycUploadSchema,
    rawInput,
  );
  const user = await requireAuth();

  const asset = await adapter.confirmKycUploadRawForOwner(user.uid, input.path);

  await auditLog({
    event: "biringa.verification.upload_completed",
    actorId: user.uid,
    resource: `verification:${user.uid}`,
    metadata: {
      path: asset.path,
      contentType: asset.contentType,
      sizeBytes: asset.sizeBytes,
    },
  });

  return asset;
}

/**
 * Final submission. Writes / overwrites `verifications/{uid}` with
 * `status='pending_review'` and references the 3 uploaded paths.
 *
 * Cross-checks ownership at this layer (the schema enforces path shape;
 * we bind it to the authenticated identity here).
 */
export async function submitVerification(rawInput: unknown): Promise<void> {
  const input: SubmitVerificationInput = validateActionInput(
    submitVerificationSchema,
    rawInput,
  );
  const user = await requireAuth();

  // Every path's uid segment MUST equal the authenticated caller.
  // The schema cross-checks that the 3 paths share the same uid; we
  // additionally verify that uid IS the caller's.
  const prefix = `verifications/${user.uid}/`;
  if (
    !input.documentFrontPath.startsWith(prefix) ||
    !input.documentBackPath.startsWith(prefix) ||
    !input.selfiePath.startsWith(prefix)
  ) {
    const err = new Error(
      "submitVerification: paths do not belong to the caller",
    );
    (err as { kind?: string }).kind = "permission-denied";
    throw err;
  }

  await adapter.submitVerificationRaw(user.uid, input);

  await auditLog({
    event: "biringa.verification.submitted",
    actorId: user.uid,
    resource: `verification:${user.uid}`,
  });
}

/**
 * Reads the verification status for the authenticated caller. Used by the
 * wizard's UI to render the current state ("pending_review" → "te
 * avisaremos cuando estés verificada", etc.).
 *
 * Returns null when the user has never submitted a verification.
 */
export async function getMyVerification(): Promise<VerificationRecord | null> {
  const user = await requireAuth();
  return adapter.getVerificationRaw(user.uid);
}
