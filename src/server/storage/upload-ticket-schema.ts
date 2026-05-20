import "server-only";

import type { ActionInputSchema } from "@/server/security/validate-action-input";

import {
  STORAGE_ASSET_KINDS,
  STORAGE_LIMITS,
  type UploadTicketInput,
  type ConfirmUploadInput,
} from "./types";

/**
 * Manual validator for `requestUploadTicket`. The server is the source of
 * truth — the wizard validates locally for UX, but this layer is what
 * actually fences the inputs since the Server Action is reachable by
 * direct POST.
 *
 * The validator rejects more than the wizard ever sends (e.g. video MIMEs)
 * so the schema stays correct even if the UI temporarily reopens video
 * uploads behind a feature flag.
 */
export const uploadTicketSchema: ActionInputSchema<UploadTicketInput> = {
  parse(input: unknown): UploadTicketInput {
    if (!input || typeof input !== "object") {
      throw new Error("requestUploadTicket: input must be an object");
    }
    const r = input as Record<string, unknown>;

    const kind = expectEnum(r.kind, "kind", STORAGE_ASSET_KINDS);

    const sessionId = expectString(r.sessionId, "sessionId", 8, 64);
    if (!/^[a-zA-Z0-9_-]+$/.test(sessionId)) {
      throw new Error(
        "requestUploadTicket: sessionId must be alphanumeric / dash / underscore",
      );
    }

    const contentType = expectString(r.contentType, "contentType", 5, 64);
    if (kind === "photo") {
      if (!(STORAGE_LIMITS.photoMimes as ReadonlyArray<string>).includes(contentType)) {
        throw new Error(
          `requestUploadTicket: contentType must be one of ${STORAGE_LIMITS.photoMimes.join(", ")}`,
        );
      }
    }

    const sizeBytes = expectInt(r.sizeBytes, "sizeBytes", 1, Number.MAX_SAFE_INTEGER);
    if (kind === "photo") {
      if (sizeBytes < STORAGE_LIMITS.photoMinBytes) {
        throw new Error(
          `requestUploadTicket: sizeBytes must be at least ${STORAGE_LIMITS.photoMinBytes}`,
        );
      }
      if (sizeBytes > STORAGE_LIMITS.photoMaxBytes) {
        throw new Error(
          `requestUploadTicket: sizeBytes must be at most ${STORAGE_LIMITS.photoMaxBytes}`,
        );
      }
    }

    return { kind, sessionId, contentType, sizeBytes };
  },
};

/**
 * Validator for `confirmUpload`. Trivial today — the heavy lifting lives in
 * the adapter, which HEADs the blob and verifies ownership via path shape.
 * Kept as its own schema so future tightening (e.g. signed token from the
 * ticket round-trip) has a place to land.
 */
export const confirmUploadSchema: ActionInputSchema<ConfirmUploadInput> = {
  parse(input: unknown): ConfirmUploadInput {
    if (!input || typeof input !== "object") {
      throw new Error("confirmUpload: input must be an object");
    }
    const r = input as Record<string, unknown>;
    const path = expectString(r.path, "path", 10, 512);
    return { path };
  },
};

// ---------- primitive expecters --------------------------------------------

function expectString(
  value: unknown,
  field: string,
  min: number,
  max: number,
): string {
  if (typeof value !== "string") {
    throw new Error(`requestUploadTicket: ${field} must be a string`);
  }
  const trimmed = value.trim();
  if (trimmed.length < min) {
    throw new Error(
      `requestUploadTicket: ${field} must be at least ${min} character(s)`,
    );
  }
  if (trimmed.length > max) {
    throw new Error(
      `requestUploadTicket: ${field} must be at most ${max} character(s)`,
    );
  }
  return trimmed;
}

function expectInt(
  value: unknown,
  field: string,
  min: number,
  max: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error(`requestUploadTicket: ${field} must be an integer`);
  }
  if (value < min || value > max) {
    throw new Error(
      `requestUploadTicket: ${field} must be between ${min} and ${max}`,
    );
  }
  return value;
}

function expectEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: ReadonlyArray<T>,
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(
      `requestUploadTicket: ${field} must be one of ${allowed.join(", ")}`,
    );
  }
  return value as T;
}
