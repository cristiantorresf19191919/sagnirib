import "server-only";

import { AuthError, Role, type AuthenticatedUser } from "@/server/auth/types";

/**
 * No-op auth provider used when Firebase env is not configured.
 *
 *   - `getSession()` returns null (anonymous), so public surfaces work.
 *   - `createSession`/`destroySession` throw — calling them without a real
 *     auth backend is a configuration error, not a normal flow.
 */

export const SESSION_COOKIE_NAME = "__session";

export async function getSession(): Promise<AuthenticatedUser | null> {
  return null;
}

export async function createSession(_idToken: string): Promise<void> {
  throw new AuthError(
    "not-configured",
    "Auth provider is not configured. Set NEXT_PUBLIC_FIREBASE_* + FIREBASE_* env vars.",
  );
}

export async function destroySession(): Promise<void> {
  // No-op: nothing to destroy without a session.
}

/**
 * Mock parity for the role grant. The mock has no real user store, so the
 * call succeeds silently — the audit event from the barrel still fires.
 */
export async function grantRoleRaw(_uid: string, _role: Role): Promise<void> {
  // No-op in mock mode.
}
