import "server-only";

import { getAuth } from "firebase-admin/auth";

import { AuthError, Role } from "@/server/auth/types";
import { getApp } from "../app";

/**
 * Grants a role to a user via Firebase Auth custom claims.
 *
 * Two layers of safety:
 *
 *   1. **Idempotency** — if the user already holds the requested role,
 *      this is a no-op. The audit event in the barrel still fires; that
 *      is intentional (caller wanted to assert the role; the assertion
 *      held).
 *
 *   2. **Mutual exclusion (ADR-019)** — `Role.Model` and
 *      `Role.Commentator` cannot coexist on the same account. Granting
 *      one while the other is present throws
 *      `AuthError('conflicting-role')`. `Role.Admin` is orthogonal —
 *      it may coexist with either.
 *
 * The Admin SDK's `setCustomUserClaims` is destructive (it replaces
 * the entire claims object), so we read-modify-write with the
 * additive merge inline.
 *
 * NEVER expose this directly — features call `grantRole` from
 * `@/server/auth`, which wraps it with `auditLog`.
 *
 * Caveat: the user's next ID-token refresh is what surfaces the new
 * claim to client code. The user may need to wait up to an hour or
 * force a `getIdToken(true)` from the client to see the role
 * propagation. For the post-signup flow, that latency is invisible
 * because the session cookie was just minted.
 */
export async function grantRoleRaw(uid: string, role: Role): Promise<void> {
  const auth = getAuth(getApp());
  const user = await auth.getUser(uid);
  const existing = (user.customClaims ?? {}) as Record<string, unknown>;

  const prevRoles = Array.isArray(existing.roles)
    ? (existing.roles as unknown[]).filter(
        (x): x is string => typeof x === "string",
      )
    : [];

  if (prevRoles.includes(role)) return;

  // ADR-019 — Model and Commentator are mutually exclusive. Refuse
  // the grant; do NOT silently revoke the opposite. Revocation of
  // legacy dual-role accounts is the lazy-migration's responsibility
  // (step 13 in the ADR-019 plan), and is the only path that should
  // ever flip a role off.
  const opposite = oppositeAccountRole(role);
  if (opposite && prevRoles.includes(opposite)) {
    throw new AuthError(
      "conflicting-role",
      `Cannot grant role '${role}': user ${uid} already holds the mutually-exclusive role '${opposite}'. To switch journeys, the user must create a new account with a different email (ADR-019).`,
    );
  }

  const nextRoles = [...prevRoles, role];
  await auth.setCustomUserClaims(uid, { ...existing, roles: nextRoles });
}

/**
 * Returns the role that is mutually exclusive with `role`, or `null`
 * if `role` is orthogonal to the account-type axis (e.g. `Role.Admin`).
 */
function oppositeAccountRole(role: Role): Role | null {
  if (role === Role.Model) return Role.Commentator;
  if (role === Role.Commentator) return Role.Model;
  return null;
}

/**
 * Removes a role from a user's custom claims (additive merge —
 * everything except this role survives). No-op if the user does not
 * hold the role.
 *
 * Used only by the ADR-019 lazy-migration path to clean up legacy
 * dual-role accounts. Application code grants roles forward, never
 * backward — there is intentionally no `revokeRole` Server Action.
 *
 * As with `grantRoleRaw`, the user's next ID-token refresh is what
 * surfaces the absence of the claim to client code.
 */
export async function revokeRoleRaw(uid: string, role: Role): Promise<void> {
  const auth = getAuth(getApp());
  const user = await auth.getUser(uid);
  const existing = (user.customClaims ?? {}) as Record<string, unknown>;

  const prevRoles = Array.isArray(existing.roles)
    ? (existing.roles as unknown[]).filter(
        (x): x is string => typeof x === "string",
      )
    : [];

  if (!prevRoles.includes(role)) return;

  const nextRoles = prevRoles.filter((r) => r !== role);
  await auth.setCustomUserClaims(uid, { ...existing, roles: nextRoles });
}
