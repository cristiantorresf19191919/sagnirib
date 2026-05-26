import "server-only";

import type { ActionInputSchema } from "@/server/security/validate-action-input";

import {
  DOCUMENT_TYPES,
  VERIFICATION_LIMITS,
  VERIFICATION_PATH_PREFIX,
  VERIFICATION_UPLOAD_KINDS,
  type ConfirmKycUploadInput,
  type DocumentType,
  type KycUploadTicketInput,
  type SubmitVerificationInput,
} from "./types";

/**
 * Normalizes a raw document number to the canonical form used for
 * uniqueness comparisons: uppercase + alphanumeric only. CC/CE come
 * in with dots/spaces (`1.234.567`, `1 234 567`); passports are
 * already alphanumeric but may have stray separators. The normalized
 * form is what is stored AND what `findActiveKycByDocumentNumber`
 * queries against.
 *
 * Exposed for client-side mirroring so the wizard can show the
 * normalized value back to the user as they type.
 */
export function normalizeDocumentNumber(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

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
    const personId = expectPersonId(r.personId, "personId");
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

    return { personId, kind, contentType, sizeBytes };
  },
};

export const confirmKycUploadSchema: ActionInputSchema<ConfirmKycUploadInput> =
  {
    parse(input: unknown): ConfirmKycUploadInput {
      if (!input || typeof input !== "object") {
        throw new Error("confirmKycUpload: input must be an object");
      }
      const r = input as Record<string, unknown>;
      const personId = expectPersonId(r.personId, "personId");
      const path = expectString(r.path, "path", 10, 512);
      return { personId, path };
    },
  };

/**
 * Submission validator. Each path MUST match the verification staging shape
 * (`verifications/<personId>/<kind>.<ext>`). The barrel then ALSO checks
 * that the personId segment equals `input.personId` AND that the caller
 * owns that person — schema-time we know shape, not identity.
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

      const personId = expectPersonId(r.personId, "personId");

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

      // Cross-check: all three paths must reference the SAME personId
      // segment AND it MUST equal the explicit personId input. Otherwise
      // a malicious client could mix paths from different persons.
      const fromFront = parsePersonIdFromPath(documentFrontPath);
      const fromBack = parsePersonIdFromPath(documentBackPath);
      const fromSelfie = parsePersonIdFromPath(selfiePath);
      if (fromFront !== fromBack || fromBack !== fromSelfie) {
        throw new Error(
          "submitVerification: the three paths must reference the same person",
        );
      }
      if (fromFront !== personId) {
        throw new Error(
          "submitVerification: upload paths do not match the supplied personId",
        );
      }

      const documentType = expectEnum<DocumentType>(
        r.documentType,
        "documentType",
        DOCUMENT_TYPES,
      );
      const documentNumber = expectDocumentNumber(r.documentNumber);

      return {
        personId,
        documentFrontPath,
        documentBackPath,
        selfiePath,
        documentType,
        documentNumber,
      };
    },
  };

/**
 * Validates the raw document number from the wizard:
 *
 *   - Coerces to string.
 *   - Normalizes (uppercase + strip non-alphanumeric).
 *   - Enforces the `documentNumberMin..documentNumberMax` bounds AFTER
 *     normalization (so a CC like "1.234.567" with separators is
 *     measured against the canonical "1234567").
 *
 * Returns the canonical form. The barrel writes this canonical form
 * to Firestore so the uniqueness query is index-safe.
 */
function expectDocumentNumber(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("submitVerification: documentNumber must be a string");
  }
  const normalized = normalizeDocumentNumber(value);
  if (normalized.length < VERIFICATION_LIMITS.documentNumberMin) {
    throw new Error(
      `submitVerification: documentNumber must be at least ${VERIFICATION_LIMITS.documentNumberMin} alphanumeric characters after normalization`,
    );
  }
  if (normalized.length > VERIFICATION_LIMITS.documentNumberMax) {
    throw new Error(
      `submitVerification: documentNumber must be at most ${VERIFICATION_LIMITS.documentNumberMax} alphanumeric characters after normalization`,
    );
  }
  return normalized;
}

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

function parsePersonIdFromPath(path: string): string {
  return VERIFICATION_PATH_REGEX.exec(path)?.[1] ?? "";
}

/**
 * personId guard. Matches the persons port's regex
 * (`PERSON_LIMITS.personIdRegex`) inline so the schema does not pull
 * `server-only` into a Client Component bundle via the persons port.
 */
const PERSON_ID_REGEX = /^[A-Za-z0-9_-]{6,128}$/;
function expectPersonId(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`verification: ${field} must be a string`);
  }
  const trimmed = value.trim();
  if (!PERSON_ID_REGEX.test(trimmed)) {
    throw new Error(`verification: ${field} has invalid shape`);
  }
  return trimmed;
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
