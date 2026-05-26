"use server";

import { cookies } from "next/headers";

import {
  ACCOUNT_TYPE_COOKIE,
  ACCOUNT_TYPE_COMMENTATOR,
  ACCOUNT_TYPE_PUBLISHER,
} from "@/features/auth/lib/rbac";
import { auditLog } from "@/server/security/audit-log";
import {
  AuthError,
  createSession as createSessionImpl,
  destroySession as destroySessionImpl,
  getSession,
  grantRole,
  Role,
} from "@/server/auth";
import {
  getMyAccountType,
  setAccountTypeOnce,
  type AccountType,
} from "@/server/users";

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

  // First-time Google sign-in lands here (not signUpWithIdToken), so we
  // mirror the lock + role grant here too. ADR-019 § "Locking semantics":
  // the lock is the authority — the role grant is derived from the doc,
  // not from the cookie.
  if (user) await maybeLockAndGrantRole(user.uid, user.roles);

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

  // Lock the account type from the cookie (or honor a pre-existing lock)
  // and grant the matching role. ADR-019 § "Locking semantics" — the doc
  // `users/{uid}` is the authority; the cookie is only an input that may
  // be ignored if the doc already has a different lock.
  if (user) await maybeLockAndGrantRole(user.uid, user.roles);

  return { ok: true };
}

/**
 * One-shot called from both `signUpWithIdToken` and `loginWithIdToken`.
 *
 * Walks the lock funnel of ADR-019 (Path 1: pre-OAuth cookie hint;
 * Path 3 lazy migration lands separately):
 *
 *   1. If the account-type cookie is present, attempt
 *      `setAccountTypeOnce({ accountType: cookie, via: 'pre-oauth' })`.
 *      Three outcomes:
 *        - `locked: true` (created) — the doc is now written with the
 *          cookie value; we'll grant the matching role.
 *        - `locked: false` (noop) — doc already had the same value; same
 *          downstream branch.
 *        - `account-type-locked` — doc had the OPPOSITE value. We
 *          IGNORE the cookie and grant the role matching the persisted
 *          value. This is the safety boundary — a stale or hostile
 *          cookie cannot flip an account.
 *   2. If no cookie, read the existing doc. If still missing, return
 *      silently — the dashboard's post-OAuth modal handles the
 *      undecided case.
 *   3. Grant the role corresponding to the resolved account type, but
 *      only if it isn't already on the user. Errors swallowed (logged) —
 *      a failing role grant must not block the session creation that
 *      already succeeded.
 */
async function maybeLockAndGrantRole(
  uid: string,
  roles: ReadonlyArray<Role>,
): Promise<void> {
  try {
    const resolved = await resolveAccountTypeForSession();
    if (!resolved) return;

    const role =
      resolved === ACCOUNT_TYPE_PUBLISHER ? Role.Model : Role.Commentator;
    if (roles.includes(role)) return;

    await grantRole(uid, role, uid);
  } catch (err) {
    console.error("[auth] account-type lock + role grant failed", err);
  }
}

async function resolveAccountTypeForSession(): Promise<AccountType | null> {
  // PRIORITY 1: data-plane signals (drafts + claims). `getMyAccountType`
  // returns the locked value if the doc exists, runs the ADR-019 lazy
  // migration probe if not. This MUST run before the cookie path to
  // prevent a stale or hostile cookie from flipping a legacy account
  // (e.g. a commentator whose cookie was rewritten before this PR
  // landed must still resolve as commentator on first login here).
  const fromDoc = await getMyAccountType();
  if (fromDoc) return fromDoc;

  // PRIORITY 2: cookie hint. Reached only when the doc is missing AND
  // the lazy-migration probe found no legacy signals — a fresh signup
  // with the chooser pick. Write the doc with `via: 'pre-oauth'` so
  // the audit trail accurately reflects the source.
  const store = await cookies();
  const cookieValue = store.get(ACCOUNT_TYPE_COOKIE)?.value;
  if (
    cookieValue !== ACCOUNT_TYPE_PUBLISHER &&
    cookieValue !== ACCOUNT_TYPE_COMMENTATOR
  ) {
    return null;
  }

  const result = await setAccountTypeOnce({
    accountType: cookieValue,
    via: "pre-oauth",
  });
  if (result.ok) return result.accountType;
  // Race: another request locked the doc between getMyAccountType and
  // setAccountTypeOnce. Honor the persisted value.
  return result.error.currentAccountType;
}

export async function signOut(): Promise<ActionResult> {
  const user = await getSession().catch(() => null);
  await destroySessionImpl();
  // Only audit when there was a session to destroy. The hook calls this
  // defensively on every `onIdTokenChanged(null)` event to clear stale
  // cookies; auditing the no-op case would flood the log with anonymous
  // logout events on every fresh tab.
  if (user) {
    await auditLog({
      event: "auth.logout",
      actorId: user.uid,
    });
  }
  return { ok: true };
}
