import "server-only";

import { getAuth } from "firebase-admin/auth";

import { getApp } from "../app";

/**
 * Grants a role to a user via Firebase Auth custom claims, additively.
 *
 * The Admin SDK's `setCustomUserClaims` is destructive — it replaces the
 * entire claims object. To support multiple grant points (e.g. a user who
 * publishes a draft AND is later promoted to 'admin'), we read existing
 * claims, merge the new role, and write back.
 *
 * No-op if the role is already present.
 *
 * NEVER expose this directly — features call `grantRole` from the
 * `@/server/auth` barrel, which wraps it with `requireAuth` + audit.
 *
 * Caveat: the user's next ID-token refresh is what surfaces the new claim
 * to client code. The user may need to wait up to an hour, or force a
 * `getIdToken(true)` from the client, to see the role. For the wizard flow
 * that is fine — the role does not gate the wizard's own success screen.
 */
export async function grantRoleRaw(uid: string, role: string): Promise<void> {
  const auth = getAuth(getApp());
  const user = await auth.getUser(uid);
  const existing = (user.customClaims ?? {}) as Record<string, unknown>;

  const prevRoles = Array.isArray(existing.roles)
    ? (existing.roles as unknown[]).filter(
        (x): x is string => typeof x === "string",
      )
    : [];

  if (prevRoles.includes(role)) return;

  const nextRoles = [...prevRoles, role];
  await auth.setCustomUserClaims(uid, { ...existing, roles: nextRoles });
}
