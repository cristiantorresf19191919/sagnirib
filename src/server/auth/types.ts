import "server-only";

/**
 * Authenticated user contract — what server code sees after the auth provider
 * has verified a session. Provider-specific shape (Firebase ID token claims,
 * decoded JWTs, etc.) MUST NOT leak past the adapter (ADR-009).
 */
export interface AuthenticatedUser {
  /** Stable provider-issued user id (Firebase `uid`). */
  uid: string;
  email?: string;
  emailVerified: boolean;
  /**
   * Roles derived from custom claims. Empty for plain authenticated users.
   * Set via Admin SDK (`auth.setCustomUserClaims`) when granting permissions.
   */
  roles: ReadonlyArray<string>;
}

export type AuthErrorKind =
  | "no-session"
  | "invalid-session"
  | "session-revoked"
  | "session-expired"
  | "not-configured"
  | "internal";

export class AuthError extends Error {
  readonly kind: AuthErrorKind;
  readonly cause?: unknown;
  constructor(kind: AuthErrorKind, message: string, cause?: unknown) {
    super(message);
    this.name = "AuthError";
    this.kind = kind;
    this.cause = cause;
  }
}
