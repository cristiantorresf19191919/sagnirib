import "server-only";

/**
 * All valid roles in the system. Add new entries here when introducing a new
 * permission tier — the type propagates to grantRole, requireRole, and
 * AuthenticatedUser automatically.
 */
export const Role = {
  /** User who has submitted at least one listing draft. */
  Model: "model",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

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
  roles: ReadonlyArray<Role>;
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
