import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

import { AuthError, Role, type AuthenticatedUser } from "@/server/auth/types";
import { getApp } from "../app";

export const SESSION_COOKIE_NAME = "__session";

/**
 * Verifies the current request's session cookie.
 *
 * Returns null when the cookie is missing — most call sites check `null`
 * rather than catching an error. Throws `AuthError` only for malformed,
 * revoked, or expired sessions (i.e. tampering / forced logout cases).
 *
 * Wrapped in React `cache()` so calling `getSession()` multiple times within
 * one request hits Firebase only once.
 */
export const getSession = cache(
  async (): Promise<AuthenticatedUser | null> => {
    const jar = await cookies();
    const cookie = jar.get(SESSION_COOKIE_NAME)?.value;
    if (!cookie) return null;

    let decoded: DecodedIdToken;
    try {
      decoded = await getAuth(getApp()).verifySessionCookie(cookie, true);
    } catch (err) {
      const code =
        typeof (err as { code?: string } | undefined)?.code === "string"
          ? (err as { code: string }).code
          : "";
      if (code === "auth/session-cookie-expired") {
        throw new AuthError("session-expired", "Session expired", err);
      }
      if (code === "auth/session-cookie-revoked") {
        throw new AuthError("session-revoked", "Session revoked", err);
      }
      throw new AuthError(
        "invalid-session",
        `Invalid session cookie: ${(err as Error).message}`,
        err,
      );
    }

    return mapClaimsToUser(decoded);
  },
);

function mapClaimsToUser(claims: DecodedIdToken): AuthenticatedUser {
  // Roles are surfaced via a custom claim `roles: string[]`. Set them with
  // `admin.auth().setCustomUserClaims(uid, { roles: ["admin"] })`.
  const rawRoles = (claims as { roles?: unknown }).roles;
  const knownRoles = new Set<string>(Object.values(Role));
  const roles = Array.isArray(rawRoles)
    ? rawRoles.filter((v): v is Role => typeof v === "string" && knownRoles.has(v))
    : [];
  return {
    uid: claims.uid,
    email: typeof claims.email === "string" ? claims.email : undefined,
    emailVerified: claims.email_verified === true,
    roles,
  };
}
