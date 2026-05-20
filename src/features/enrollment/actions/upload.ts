"use server";

import {
  confirmUpload as confirmUploadImpl,
  requestUploadTicket as requestUploadTicketImpl,
  type StorageAsset,
  type UploadTicket,
} from "@/server/storage";

import type { ActionResult } from "./create-draft";

/**
 * Server Actions: photo upload round-trip (ADR-012).
 *
 *   - `requestUploadTicket` issues a single-use signed PUT URL the wizard
 *     uses to upload one compressed photo directly to Cloud Storage.
 *   - `confirmUpload` HEADs the uploaded blob and returns its metadata.
 *
 * Both are reachable by direct POST. The full security stack
 * (validate / requireAuth / audit) lives in `@/server/storage`. This file
 * exists ONLY to mark the functions as Server Actions and to wrap
 * errors in the stable `ActionResult` shape the wizard's client renders.
 */

export async function requestUploadTicket(
  input: unknown,
): Promise<ActionResult<UploadTicket>> {
  try {
    const data = await requestUploadTicketImpl(input);
    return { ok: true, data };
  } catch (err) {
    return mapActionError(err);
  }
}

export async function confirmUpload(
  input: unknown,
): Promise<ActionResult<StorageAsset>> {
  try {
    const data = await confirmUploadImpl(input);
    return { ok: true, data };
  } catch (err) {
    return mapActionError(err);
  }
}

function mapActionError<T>(err: unknown): ActionResult<T> {
  const kind = (err as { kind?: unknown })?.kind;
  const message = (err as Error)?.message ?? "Unknown error";
  if (typeof kind === "string") {
    return { ok: false, error: { kind, message } };
  }
  return { ok: false, error: { kind: "validation", message } };
}
