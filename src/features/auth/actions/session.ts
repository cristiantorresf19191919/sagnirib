"use server";

import { auditLog } from "@/server/security/audit-log";
import {
  AuthError,
  createSession as createSessionImpl,
  destroySession as destroySessionImpl,
  getSession,
} from "@/server/auth";

/**
 * Server Actions for the auth lifecycle.
 *
 * These are reachable by direct POST (Next 16 docs: Server Functions). All
 * inputs must be validated and the cookie write must happen here, not in
 * client code.
 */

export interface ActionResult<T = void> {
  ok: boolean;
  error?: { kind: string; message: string };
  data?: T;
}

/**
 * Exchanges a freshly-issued Firebase ID token for a server-side session
 * cookie. The client gets the ID token from the JS SDK after a successful
 * `signInWith*` call and POSTs it here.
 */
export async function loginWithIdToken(
  idToken: unknown,
): Promise<ActionResult> {
  if (typeof idToken !== "string" || idToken.length < 32) {
    return {
      ok: false,
      error: { kind: "invalid-argument", message: "Invalid ID token" },
    };
  }

  try {
    await createSessionImpl(idToken);
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: { kind: err.kind, message: err.message } };
    }
    return {
      ok: false,
      error: { kind: "internal", message: (err as Error).message },
    };
  }

  // Best-effort actor id for the audit entry. The cookie was just set, so
  // `getSession` should resolve.
  const user = await getSession().catch(() => null);
  await auditLog({
    event: "auth.login",
    actorId: user?.uid,
  });

  return { ok: true };
}

/**
 * Mirror of `loginWithIdToken` for the signup flow. Same session-cookie
 * exchange, distinct audit event so the trail can tell first-touch from
 * recurring logins. The browser-side `onIdTokenChanged` listener will fire
 * `loginWithIdToken` immediately after, producing a `signup` → `login` pair
 * on the same `actorId` — that is the intended shape.
 */
export async function signUpWithIdToken(
  idToken: unknown,
): Promise<ActionResult> {
  if (typeof idToken !== "string" || idToken.length < 32) {
    return {
      ok: false,
      error: { kind: "invalid-argument", message: "Invalid ID token" },
    };
  }

  try {
    await createSessionImpl(idToken);
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: { kind: err.kind, message: err.message } };
    }
    return {
      ok: false,
      error: { kind: "internal", message: (err as Error).message },
    };
  }

  const user = await getSession().catch(() => null);
  await auditLog({
    event: "auth.signup",
    actorId: user?.uid,
  });

  return { ok: true };
}

export async function signOut(): Promise<ActionResult> {
  const user = await getSession().catch(() => null);
  await destroySessionImpl();
  await auditLog({
    event: "auth.logout",
    actorId: user?.uid,
  });
  return { ok: true };
}
