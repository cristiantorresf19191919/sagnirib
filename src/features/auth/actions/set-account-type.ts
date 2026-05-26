"use server";

import { cookies } from "next/headers";

import { getSession, grantRole, Role } from "@/server/auth";
import { auditLog } from "@/server/security/audit-log";
import {
  ACCOUNT_TYPE_COMMENTATOR,
  ACCOUNT_TYPE_COOKIE,
  ACCOUNT_TYPE_PUBLISHER,
  isAccountType,
  type AccountType,
} from "@/features/auth/lib/rbac";
import { setAccountTypeOnce } from "@/server/users";

export interface SetAccountTypeResult {
  ok: boolean;
  accountType?: AccountType;
  grantedRole?: Role;
  error?: { kind: string; message: string; currentAccountType?: AccountType };
}

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

/**
 * Persists the visitor's chosen registration journey (publisher vs
 * commentator). Two call shapes converge here (ADR-019 § "Locking
 * semantics"):
 *
 *   1. **Pre-OAuth** — visitor picks on `/ingresar` or `/registrarse`
 *      BEFORE signing in. No session yet, so we only write the cookie.
 *      `loginWithIdToken` / `signUpWithIdToken` will read the cookie on
 *      the next session creation and call `setAccountTypeOnce` to write
 *      the authoritative `users/{uid}` doc.
 *
 *   2. **Post-OAuth fallback** — visitor signed in via Google without
 *      ever picking (no cookie + no doc). The dashboard surfaces the
 *      `AccountTypeFallbackModal`, which posts here with a live session.
 *      We:
 *        a. Call `setAccountTypeOnce` to write `users/{uid}` (or get
 *           the same back, idempotently). If a different lock exists,
 *           the request is REFUSED with `kind: 'account-type-locked'`
 *           and the cookie is NOT updated — the locked value wins.
 *        b. Mirror the resolved value into the cookie so the dashboard
 *           router has a fast read.
 *        c. Grant the matching role if not already held.
 *
 * ADR-019 § "Locking semantics" — the cookie is a UX hint; the
 * authority is `users/{uid}.accountType`. This function honors that
 * invariant: we never write a cookie value that disagrees with a
 * locked doc.
 *
 * There is intentionally NO `clearAccountType` paired with this one.
 * Removed deliberately to close the "any client can nuke the lock"
 * escape hatch the previous design carried.
 */
export async function setAccountType(
  input: unknown,
): Promise<SetAccountTypeResult> {
  if (!isAccountType(input)) {
    return {
      ok: false,
      error: { kind: "invalid-argument", message: "Unknown account type" },
    };
  }

  const store = await cookies();
  const user = await getSession().catch(() => null);

  // Pre-OAuth path: no session, just write the cookie. The doc lock
  // happens later, when signUp/loginWithIdToken fires.
  if (!user) {
    writeAccountTypeCookie(store, input);
    return { ok: true, accountType: input };
  }

  // Post-OAuth path: doc is the authority. Attempt the lock; if a
  // different value is already locked, refuse — the cookie is NOT
  // updated either, so the dashboard's read remains consistent with
  // the doc.
  const lockResult = await setAccountTypeOnce({
    accountType: input,
    via: "post-oauth-modal",
  });

  if (!lockResult.ok) {
    return {
      ok: false,
      error: {
        kind: "account-type-locked",
        message: messageForLockedRefusal(
          lockResult.error.currentAccountType,
        ),
        currentAccountType: lockResult.error.currentAccountType,
      },
    };
  }

  // Doc is locked to `input` (either just now, or already). Sync the
  // cookie so the dashboard's fast-path read matches.
  writeAccountTypeCookie(store, lockResult.accountType);

  // Grant the matching role if not already held. The role grant is
  // best-effort — a failing grant must not invalidate the lock.
  const grantedRole = await maybeGrantRoleForAccountType(
    user.uid,
    user.roles,
    lockResult.accountType,
  );

  return {
    ok: true,
    accountType: lockResult.accountType,
    ...(grantedRole ? { grantedRole } : {}),
  };
}

function writeAccountTypeCookie(
  store: Awaited<ReturnType<typeof cookies>>,
  value: AccountType,
): void {
  store.set(ACCOUNT_TYPE_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

function messageForLockedRefusal(current: AccountType): string {
  if (current === ACCOUNT_TYPE_COMMENTATOR) {
    return "Tu cuenta está registrada como cliente. Para publicar perfiles, creá una cuenta nueva con otro correo.";
  }
  return "Tu cuenta está registrada como Partner. Para comentar como cliente, creá una cuenta nueva con otro correo.";
}

/**
 * Adds the role that mirrors the freshly-locked account type, but
 * only if it isn't already on the user. Errors are logged and
 * swallowed — the lock is the authority, the role grant is a
 * downstream side effect that can be retried out-of-band if it
 * fails here (the audit trail captures both).
 */
async function maybeGrantRoleForAccountType(
  uid: string,
  roles: ReadonlyArray<Role>,
  accountType: AccountType,
): Promise<Role | null> {
  const target =
    accountType === ACCOUNT_TYPE_COMMENTATOR
      ? Role.Commentator
      : accountType === ACCOUNT_TYPE_PUBLISHER
        ? Role.Model
        : null;
  if (!target) return null;
  if (roles.includes(target)) return null;

  try {
    await grantRole(uid, target, uid);
    await auditLog({
      event: "auth.account_type_chosen",
      actorId: uid,
      metadata: { accountType, grantedRole: target },
    });
    return target;
  } catch (err) {
    console.error("[auth] account-type role grant failed", err);
    return null;
  }
}
