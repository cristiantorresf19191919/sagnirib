import "server-only";

/**
 * Typed adapter errors. Features must not catch raw Firestore exceptions —
 * the adapter wraps them in this shape so callers handle a stable contract
 * (ADR-009 §4).
 */
export type FirebaseAdapterErrorKind =
  | "not-configured"
  | "permission-denied"
  | "not-found"
  | "unavailable"
  | "invalid-argument"
  | "internal";

export class FirebaseAdapterError extends Error {
  readonly kind: FirebaseAdapterErrorKind;
  readonly cause?: unknown;

  constructor(kind: FirebaseAdapterErrorKind, message: string, cause?: unknown) {
    super(message);
    this.name = "FirebaseAdapterError";
    this.kind = kind;
    this.cause = cause;
  }
}

interface FirestoreLikeError {
  code?: string | number;
  message?: string;
}

// gRPC status codes used by `firebase-admin`'s underlying Firestore client.
// The Admin SDK surfaces errors with a numeric `code` (gRPC), not the string
// codes the client SDK uses, so we normalize here.
// https://grpc.github.io/grpc/core/md_doc_statuscodes.html
const GRPC_TO_STRING: Record<number, string> = {
  3: "invalid-argument",
  4: "deadline-exceeded",
  5: "not-found",
  7: "permission-denied",
  9: "failed-precondition",
  14: "unavailable",
};

function normalizeCode(rawCode: unknown): string {
  if (typeof rawCode === "string") return rawCode;
  if (typeof rawCode === "number") return GRPC_TO_STRING[rawCode] ?? "";
  return "";
}

/**
 * Maps a thrown Firestore error to the internal kind. The Admin SDK throws
 * with a numeric gRPC `code` (e.g. 9 for FAILED_PRECONDITION); the client
 * SDK uses string codes like "permission-denied". Both shapes are handled.
 */
export function wrapFirestoreError(
  context: string,
  err: unknown,
): FirebaseAdapterError {
  const e = err as FirestoreLikeError | undefined;
  const code = normalizeCode(e?.code);
  const msg = `[firebase:${context}] ${e?.message ?? "unknown error"}`;

  switch (code) {
    case "permission-denied":
      return new FirebaseAdapterError("permission-denied", msg, err);
    case "not-found":
      return new FirebaseAdapterError("not-found", msg, err);
    case "unavailable":
    case "deadline-exceeded":
      return new FirebaseAdapterError("unavailable", msg, err);
    case "invalid-argument":
    case "failed-precondition":
      return new FirebaseAdapterError("invalid-argument", msg, err);
    default:
      return new FirebaseAdapterError("internal", msg, err);
  }
}
