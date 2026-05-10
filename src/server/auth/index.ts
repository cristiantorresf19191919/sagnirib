import "server-only";

import { isFirebaseConfigured } from "@/core/config/firebase";

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
