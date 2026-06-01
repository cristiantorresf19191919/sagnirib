import "server-only";

import { cookies } from "next/headers";
import { getAuth } from "firebase-admin/auth";

import { AuthError } from "@/server/auth/types";
import { AUTH_HINT_COOKIE } from "@/shared/layout/auth-hint";
import { getApp } from "../app";
import { SESSION_COOKIE_NAME } from "./verify-session";

/**
 * Session cookie lifetime — 5 days. The Web SDK refreshes the underlying
 * ID token continuously while the user is active; this cookie covers the
 * server-side window during which we trust the session without a refresh.
 *
 * Firebase Auth allows up to 14 days. Five is a balance: short enough that
 * a stolen cookie has limited useful life, long enough that a casual visitor
 * does not have to log in again every visit.
 */
const SESSION_TTL_MS = 5 * 24 * 60 * 60 * 1000;

/**
 * Exchanges a freshly-issued ID token for a server-side session cookie and
 * sets it on the response. Called from a Server Action that the client
 * invokes immediately after `signInWith*` succeeds.
 *
 * Why not store the ID token directly? Because ID tokens expire in 1 hour,
 * cannot be revoked server-side, and aren't meant for cookies. Session
 * cookies are the documented way to bridge JS-SDK auth into SSR.
 */
export async function createSession(idToken: string): Promise<void> {
  if (!idToken || typeof idToken !== "string") {
    throw new AuthError("invalid-session", "Missing ID token");
  }

  let cookieValue: string;
  try {
    cookieValue = await getAuth(getApp()).createSessionCookie(idToken, {
      expiresIn: SESSION_TTL_MS,
    });
  } catch (err) {
    throw new AuthError(
      "invalid-session",
      `Could not create session cookie: ${(err as Error).message}`,
      err,
    );
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, cookieValue, {
    maxAge: SESSION_TTL_MS / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  // Non-sensitive, client-readable hint so instant UI (route loading
  // fallbacks) can branch logged-in vs anonymous without the httpOnly cookie.
  jar.set(AUTH_HINT_COOKIE, "1", {
    maxAge: SESSION_TTL_MS / 1000,
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Clears the session cookie and revokes the user's refresh tokens so any
 * other device that holds an ID token from the same login is forced to
 * re-authenticate.
 */
export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const cookie = jar.get(SESSION_COOKIE_NAME)?.value;
  jar.delete(SESSION_COOKIE_NAME);
  jar.delete(AUTH_HINT_COOKIE);

  if (!cookie) return;

  // Best-effort revoke: do not block sign-out if the verify fails.
  try {
    const auth = getAuth(getApp());
    const decoded = await auth.verifySessionCookie(cookie);
    await auth.revokeRefreshTokens(decoded.uid);
  } catch {
    // The cookie was already invalid — nothing to revoke.
  }
}
