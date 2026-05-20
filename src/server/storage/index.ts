import "server-only";

import { isFirebaseConfigured } from "@/core/config/firebase";
import { auditLog } from "@/server/security/audit-log";
import { requireAuth } from "@/server/security/require-auth";
import { validateActionInput } from "@/server/security/validate-action-input";

import {
  confirmUploadSchema,
  uploadTicketSchema,
} from "./upload-ticket-schema";
import type {
  ConfirmUploadInput,
  CopyStagedToDraftInput,
  CopyStagedToDraftResult,
  StorageAsset,
  UploadTicket,
  UploadTicketInput,
} from "./types";

/**
 * Public barrel for the Storage port (ADR-012).
 *
 * Features import from here ONLY — never from `@/server/adapters/...` or
 * `@/server/mocks/...` directly (audit rule 5). The barrel routes the call:
 *
 *   - `FIREBASE_*` env vars set  → Firebase Admin Storage adapter
 *   - otherwise                  → in-memory mock (process-local, dev only)
 *
 * Every public helper wraps:
 *
 *   1. validateActionInput      — server is the source of truth
 *   2. requireAuth              — anonymous uploads refused
 *   3. adapter call             — owner-scoped, path-validated
 *   4. auditLog                 — every write step is traceable
 *
 * The wizard never imports the adapter raw — it goes through the Server
 * Actions in `src/features/enrollment/actions/`, which wrap these helpers.
 */

export type {
  ConfirmUploadInput,
  CopyStagedToDraftInput,
  CopyStagedToDraftResult,
  StorageAsset,
  StorageAssetKind,
  UploadTicket,
  UploadTicketInput,
} from "./types";
export { STORAGE_ASSET_KINDS, STORAGE_LIMITS } from "./types";

// Dynamic adapter dispatch. The mock and the real adapter expose the same
// owner-scoped function signatures.
const adapter = isFirebaseConfigured()
  ? await import("@/server/adapters/firebase/storage")
  : await import("@/server/mocks/storage");

/**
 * Issues a single-use server-signed PUT URL the wizard uses to upload one
 * photo. Authenticated callers only. The destination path is decided
 * server-side from the caller's uid plus the supplied `sessionId`.
 *
 * Returns `{ uploadUrl, path, expiresAt, requiredHeaders, contentType, maxBytes }`.
 * The wizard MUST echo `Content-Type` and the `requiredHeaders` on the PUT.
 */
export async function requestUploadTicket(
  rawInput: unknown,
): Promise<UploadTicket> {
  const input: UploadTicketInput = validateActionInput(
    uploadTicketSchema,
    rawInput,
  );
  const user = await requireAuth();

  const ticket = await adapter.signUploadUrlRawForOwner(user.uid, input);

  await auditLog({
    event: "biringa.upload.ticket_requested",
    actorId: user.uid,
    resource: `storage:${ticket.path}`,
    metadata: {
      kind: input.kind,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
      sessionId: input.sessionId,
    },
  });

  return ticket;
}

/**
 * Verifies the client actually uploaded the blob at `path`. HEADs the
 * object, checks ownership via path shape, returns the effective
 * metadata (size, contentType) for the wizard to display.
 *
 * Called by the wizard immediately after the PUT succeeds — if this
 * throws, the wizard prompts the modelo to retry that single file
 * instead of failing the whole step.
 */
export async function confirmUpload(rawInput: unknown): Promise<StorageAsset> {
  const input: ConfirmUploadInput = validateActionInput(
    confirmUploadSchema,
    rawInput,
  );
  const user = await requireAuth();

  const asset = await adapter.confirmUploadRawForOwner(user.uid, input.path);

  await auditLog({
    event: "biringa.upload.completed",
    actorId: user.uid,
    resource: `storage:${asset.path}`,
    metadata: {
      contentType: asset.contentType,
      sizeBytes: asset.sizeBytes,
    },
  });

  return asset;
}

/**
 * Internal helper called by `createListingDraft` once Firestore has the
 * draft id. Promotes every staged path of the submitting session into
 * the draft prefix and deletes the staging originals.
 *
 * NOT exposed as a Server Action — it has no purpose outside the submit
 * flow and exposing it would let an authenticated caller copy any staged
 * file into any draft id they invent.
 */
export async function copyStagedToDraftForOwner(
  ownerUid: string,
  input: CopyStagedToDraftInput,
): Promise<CopyStagedToDraftResult> {
  if (input.paths.length === 0) {
    return { draftPaths: [] };
  }
  const result = await adapter.copyStagedToDraftRawForOwner(ownerUid, input);

  await auditLog({
    event: "biringa.draft.assets_attached",
    actorId: ownerUid,
    resource: `draft:${input.draftId}`,
    metadata: {
      count: result.draftPaths.length,
      sessionId: input.sessionId,
    },
  });

  return result;
}
