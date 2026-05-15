import "server-only";

import { isFirebaseConfigured } from "@/core/config/firebase";
import { auditLog } from "@/server/security/audit-log";

/**
 * Public barrel for the auth port.
 *
 * Routes the auth provider at module load — Firebase if configured,
 * the no-op mock otherwise. Features and security helpers import from here
 * ONLY (never from `@/server/adapters/...` directly).
 *
 * The contract is intentionally narrow:
 *   - `getSession()` reads the current request's session cookie. Returns
 *     null if anonymous; throws `AuthError` only for tampered cookies.
 *   - `createSession(idToken)` exchanges a freshly-issued ID token for a
 *     server-side session cookie.
 *   - `destroySession()` clears the cookie + revokes refresh tokens.
 *   - `grantRole(uid, role)` adds a role to a user via Firebase custom
 *     claims (additive merge). Audited.
 */

export type { AuthenticatedUser, AuthErrorKind } from "./types";
export { AuthError } from "./types";

const provider = isFirebaseConfigured()
  ? await import("@/server/adapters/firebase/auth")
  : await import("@/server/mocks/auth");

export const SESSION_COOKIE_NAME = provider.SESSION_COOKIE_NAME;
export const getSession = provider.getSession;
export const createSession = provider.createSession;
export const destroySession = provider.destroySession;

/**
 * Grants a role to a user (additive). Auditable wrapper around the
 * provider's raw helper. Call sites pass `actorUid` explicitly so the audit
 * trail records who initiated the grant — typically the same user (a
 * self-grant after publishing a draft), but occasionally an admin.
 */
export async function grantRole(
  uid: string,
  role: string,
  actorUid?: string,
): Promise<void> {
  await provider.grantRoleRaw(uid, role);
  await auditLog({
    event: "auth.role_granted",
    actorId: actorUid ?? uid,
    resource: `user:${uid}`,
    metadata: { role },
  });
}
