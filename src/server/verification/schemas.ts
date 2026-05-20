import "server-only";

import type { ActionInputSchema } from "@/server/security/validate-action-input";

import {
  VERIFICATION_LIMITS,
  VERIFICATION_PATH_PREFIX,
  VERIFICATION_UPLOAD_KINDS,
  type ConfirmKycUploadInput,
  type KycUploadTicketInput,
  type SubmitVerificationInput,
} from "./types";

/**
 * Validators for the KYC verification Server Actions. Mirror the photo
 * upload validation style — manual parsers with explicit error messages.
 */

export const kycUploadTicketSchema: ActionInputSchema<KycUploadTicketInput> = {
  parse(input: unknown): KycUploadTicketInput {
    if (!input || typeof input !== "object") {
      throw new Error("requestKycUploadTicket: input must be an object");
    }
    const r = input as Record<string, unknown>;
    const kind = expectEnum(r.kind, "kind", VERIFICATION_UPLOAD_KINDS);

    const contentType = expectString(r.contentType, "contentType", 5, 64);
    if (
      !(VERIFICATION_LIMITS.fileMimes as ReadonlyArray<string>).includes(
        contentType,
      )
    ) {
      throw new Error(
        `requestKycUploadTicket: contentType must be one of ${VERIFICATION_LIMITS.fileMimes.join(", ")}`,
      );
    }

    const sizeBytes = expectInt(
      r.sizeBytes,
      "sizeBytes",
      VERIFICATION_LIMITS.fileMinBytes,
      VERIFICATION_LIMITS.fileMaxBytes,
    );

    return { kind, contentType, sizeBytes };
  },
};

export const confirmKycUploadSchema: ActionInputSchema<ConfirmKycUploadInput> =
  {
    parse(input: unknown): ConfirmKycUploadInput {
      if (!input || typeof input !== "object") {
        throw new Error("confirmKycUpload: input must be an object");
      }
      const r = input as Record<string, unknown>;
      const path = expectString(r.path, "path", 10, 512);
      return { path };
    },
  };

/**
 * Submission validator. Each path MUST match the verification staging shape
 * (`verifications/<uid>/<kind>.<ext>`). The barrel then ALSO checks that
 * the uid segment equals `requireAuth().uid` — schema-time we know shape,
 * not identity.
 */
const VERIFICATION_PATH_REGEX = new RegExp(
  `^${VERIFICATION_PATH_PREFIX}/([A-Za-z0-9_-]{6,128})/(document_front|document_back|selfie)\\.(jpg|webp)$`,
);

export const submitVerificationSchema: ActionInputSchema<SubmitVerificationInput> =
  {
    parse(input: unknown): SubmitVerificationInput {
      if (!input || typeof input !== "object") {
        throw new Error("submitVerification: input must be an object");
      }
      const r = input as Record<string, unknown>;

      const documentFrontPath = expectVerificationPath(
        r.documentFrontPath,
        "document_front",
        "documentFrontPath",
      );
      const documentBackPath = expectVerificationPath(
        r.documentBackPath,
        "document_back",
        "documentBackPath",
      );
      const selfiePath = expectVerificationPath(
        r.selfiePath,
        "selfie",
        "selfiePath",
      );

      // Cross-check: all three paths must reference the SAME uid segment.
      // Otherwise a malicious client could mix paths from different users.
      const fromFront = parseUidFromPath(documentFrontPath);
      const fromBack = parseUidFromPath(documentBackPath);
      const fromSelfie = parseUidFromPath(selfiePath);
      if (fromFront !== fromBack || fromBack !== fromSelfie) {
        throw new Error(
          "submitVerification: the three paths must reference the same user",
        );
      }

      return { documentFrontPath, documentBackPath, selfiePath };
    },
  };

function expectVerificationPath(
  value: unknown,
  expectedKind: string,
  field: string,
): string {
  if (typeof value !== "string") {
    throw new Error(`submitVerification: ${field} must be a string`);
  }
  const trimmed = value.trim();
  const m = VERIFICATION_PATH_REGEX.exec(trimmed);
  if (!m) {
    throw new Error(
      `submitVerification: ${field} is not a valid verification path`,
    );
  }
  if (m[2] !== expectedKind) {
    throw new Error(
      `submitVerification: ${field} expected kind "${expectedKind}", got "${m[2]}"`,
    );
  }
  return trimmed;
}

function parseUidFromPath(path: string): string {
  return VERIFICATION_PATH_REGEX.exec(path)?.[1] ?? "";
}

// ---------- primitive expecters --------------------------------------------

function expectString(
  value: unknown,
  field: string,
  min: number,
  max: number,
): string {
  if (typeof value !== "string") {
    throw new Error(`verification: ${field} must be a string`);
  }
  const trimmed = value.trim();
  if (trimmed.length < min) {
    throw new Error(
      `verification: ${field} must be at least ${min} character(s)`,
    );
  }
  if (trimmed.length > max) {
    throw new Error(
      `verification: ${field} must be at most ${max} character(s)`,
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
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isInteger(value)
  ) {
    throw new Error(`verification: ${field} must be an integer`);
  }
  if (value < min || value > max) {
    throw new Error(
      `verification: ${field} must be between ${min} and ${max}`,
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
      `verification: ${field} must be one of ${allowed.join(", ")}`,
    );
  }
  return value as T;
}
