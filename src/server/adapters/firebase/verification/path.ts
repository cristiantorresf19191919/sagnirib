import "server-only";

import {
  VERIFICATION_PATH_PREFIX,
  type VerificationUploadKind,
} from "@/server/verification/types";

/**
 * Path generators for the verification bucket prefix (ADR-014, ADR-018).
 *
 * ADR-018 Phase A: the bucket prefix stays as `verifications/`; the
 * second segment used to be the account uid and is now the **personId**
 * (the doc-id space is opaque, so legacy lazy-migrated accounts whose
 * personId equals uid keep working untouched).
 *
 * `firebase-data-ownership` rule 9 forbids hardcoded prefixes anywhere
 * outside the storage adapter family. This file is the source of truth.
 */

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export function extensionForMime(mime: string): string {
  const ext = EXT_BY_MIME[mime];
  if (!ext) {
    throw new Error(`verification/path: unsupported MIME ${mime}`);
  }
  return ext;
}

export function verificationAssetPath(args: {
  personId: string;
  kind: VerificationUploadKind;
  mime: string;
}): string {
  return [
    VERIFICATION_PATH_PREFIX,
    args.personId,
    `${args.kind}.${extensionForMime(args.mime)}`,
  ].join("/");
}

const VERIFICATION_PATH_REGEX = new RegExp(
  `^${VERIFICATION_PATH_PREFIX}/([A-Za-z0-9_-]{6,128})/(document_front|document_back|selfie)\\.(jpg|webp)$`,
);

export interface VerificationPathParts {
  personId: string;
  kind: VerificationUploadKind;
  extension: string;
}

export function parseVerificationPath(
  path: string,
): VerificationPathParts | null {
  const m = VERIFICATION_PATH_REGEX.exec(path);
  if (!m) return null;
  return {
    personId: m[1],
    kind: m[2] as VerificationUploadKind,
    extension: m[3],
  };
}
