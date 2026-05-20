"use server";

import {
  confirmKycUpload as confirmKycUploadImpl,
  requestKycUploadTicket as requestKycUploadTicketImpl,
  submitVerification as submitVerificationImpl,
  type KycAsset,
  type KycUploadTicket,
} from "@/server/verification";

/**
 * Server Action wrappers for the verification port. The barrel does
 * validate + requireAuth + audit; this file marks the calls as Server
 * Actions and translates errors into a stable `ActionResult` envelope.
 */

export interface ActionResult<T = void> {
  ok: boolean;
  error?: { kind: string; message: string };
  data?: T;
}

export async function requestKycUploadTicket(
  input: unknown,
): Promise<ActionResult<KycUploadTicket>> {
  try {
    const data = await requestKycUploadTicketImpl(input);
    return { ok: true, data };
  } catch (err) {
    return mapErr(err);
  }
}

export async function confirmKycUpload(
  input: unknown,
): Promise<ActionResult<KycAsset>> {
  try {
    const data = await confirmKycUploadImpl(input);
    return { ok: true, data };
  } catch (err) {
    return mapErr(err);
  }
}

export async function submitVerification(
  input: unknown,
): Promise<ActionResult> {
  try {
    await submitVerificationImpl(input);
    return { ok: true };
  } catch (err) {
    return mapErr(err);
  }
}

function mapErr<T>(err: unknown): ActionResult<T> {
  const kind = (err as { kind?: unknown })?.kind;
  const message = (err as Error)?.message ?? "Unknown error";
  if (typeof kind === "string") {
    return { ok: false, error: { kind, message } };
  }
  return { ok: false, error: { kind: "validation", message } };
}
