"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onIdTokenChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword as signInWithEmailAndPasswordFb,
  signInWithPopup,
  signOut as signOutFb,
  type User as FirebaseUser,
} from "firebase/auth";

import { isFirebaseClientConfigured } from "@/core/config/firebase-client";

import {
  loginWithIdToken,
  signOut as signOutAction,
  signUpWithIdToken,
} from "../actions/session";
import { getClientAuth } from "./firebase-client";

/**
 * React hook that exposes the current auth session to Client Components.
 *
 *   - Subscribes to `onIdTokenChanged` so the server-side cookie stays in
 *     sync with the JS SDK across the natural ID-token refresh cycle.
 *   - Calls `loginWithIdToken` Server Action on every fresh ID token, which
 *     is idempotent on the server side (it just re-mints the cookie).
 *   - On sign-out, runs the Server Action FIRST (clears cookie) then the
 *     JS SDK so even if the client step fails the server is consistent.
 *
 * If the public env vars are missing, status becomes `disabled` and the
 * action helpers throw a clear error.
 */

export type AuthStatus = "loading" | "anonymous" | "authenticated" | "disabled";

export interface SessionUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

/**
 * Health of the server-side session cookie (`__session`).
 *
 *   - `unknown`  → no push attempted yet, or no signed-in user to push.
 *   - `ok`       → the most recent `loginWithIdToken` call succeeded.
 *   - `failed`   → the Server Action rejected the ID token (most often
 *                  because Firebase Admin env vars are not configured on
 *                  the deploy). `error` / `errorKind` describe the cause.
 *
 * Surfaces the fact that the client is signed in via the JS SDK but the
 * server has no valid cookie — the symptom that produced the `/publicar`
 * ↔ `/ingresar` redirect loop.
 */
export interface ServerSessionState {
  status: "unknown" | "ok" | "failed";
  error: string | null;
  errorKind: string | null;
}

export interface UseAuthSession {
  status: AuthStatus;
  user: SessionUser | null;
  serverSession: ServerSessionState;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  /**
   * Forces an ID-token refresh and re-mints the server-side session cookie.
   * Returns the resolved state — call sites that gate navigation on cookie
   * presence should `await` this and refuse to navigate on `failed`.
   */
  refreshServerSession: () => Promise<ServerSessionState>;
}

function toSessionUser(u: FirebaseUser): SessionUser {
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL,
    emailVerified: u.emailVerified,
  };
}

function toFailedState(
  prefix: string,
  result: { error?: { kind?: string; message?: string } },
): ServerSessionState {
  return {
    status: "failed",
    error: result.error?.message ?? `${prefix}: unknown error`,
    errorKind: result.error?.kind ?? "unknown",
  };
}

async function pushIdTokenToServer(
  u: FirebaseUser,
  forceRefresh = false,
): Promise<ServerSessionState> {
  const idToken = await u.getIdToken(forceRefresh);
  const result = await loginWithIdToken(idToken);
  if (!result.ok) {
    return toFailedState("[auth] server rejected session", result);
  }
  return { status: "ok", error: null, errorKind: null };
}

async function pushSignUpIdTokenToServer(u: FirebaseUser): Promise<void> {
  const idToken = await u.getIdToken(/* forceRefresh */ false);
  const result = await signUpWithIdToken(idToken);
  if (!result.ok) {
    throw new Error(
      `[auth] server rejected signup: ${result.error?.message ?? "unknown"}`,
    );
  }
}

const UNKNOWN_SERVER_SESSION: ServerSessionState = {
  status: "unknown",
  error: null,
  errorKind: null,
};

export function useAuthSession(): UseAuthSession {
  // Initial status is derived from env at render time so the effect does not
  // need to set "disabled" synchronously (React 19 set-state-in-effect rule).
  const [status, setStatus] = useState<AuthStatus>(() =>
    isFirebaseClientConfigured() ? "loading" : "disabled",
  );
  const [user, setUser] = useState<SessionUser | null>(null);
  const [serverSession, setServerSession] = useState<ServerSessionState>(
    UNKNOWN_SERVER_SESSION,
  );

  useEffect(() => {
    const auth = getClientAuth();
    if (!auth) return;

    const unsub = onIdTokenChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setStatus("anonymous");
        setServerSession(UNKNOWN_SERVER_SESSION);
        // Clear any stale `__session` cookie the SDK has since lost
        // (signed out in another tab, refresh token revoked, browser
        // storage cleared while the cookie survived). Without this,
        // server components keep seeing a valid session and gates like
        // `/publicar` let an anonymous user through.
        try {
          await signOutAction();
        } catch (err) {
          console.warn("[auth] stale session cleanup failed", err);
        }
        return;
      }
      // Paint the signed-in avatar/name IMMEDIATELY from the client token —
      // displayName/email are already on `u`, so there's no reason to block
      // the UI on the server-cookie round-trip just to render the header. The
      // server session then syncs in the background; SSR + gated actions read
      // `serverSession` (which resolves a moment later), not `status`.
      setUser(toSessionUser(u));
      setStatus("authenticated");

      let next: ServerSessionState;
      try {
        next = await pushIdTokenToServer(u);
      } catch (err) {
        next = {
          status: "failed",
          error: (err as Error)?.message ?? "Unexpected error",
          errorKind: "client-error",
        };
      }
      if (next.status === "failed") {
        console.error("[auth] server session cookie unavailable:", next.error);
      }
      setServerSession(next);
    });

    return () => {
      unsub();
    };
  }, []);

  const refreshServerSession = useCallback(async (): Promise<ServerSessionState> => {
    const auth = getClientAuth();
    if (!auth?.currentUser) {
      const next: ServerSessionState = {
        status: "failed",
        error: "No client-side user to refresh",
        errorKind: "no-user",
      };
      setServerSession(next);
      return next;
    }
    let next: ServerSessionState;
    try {
      next = await pushIdTokenToServer(auth.currentUser, /* forceRefresh */ true);
    } catch (err) {
      next = {
        status: "failed",
        error: (err as Error)?.message ?? "Unexpected error",
        errorKind: "client-error",
      };
    }
    setServerSession(next);
    return next;
  }, []);

  return {
    status,
    user,
    serverSession,
    refreshServerSession,
    signInWithEmail: async (email, password) => {
      const auth = getClientAuth();
      if (!auth) throw new Error("[auth] firebase client not configured");
      const cred = await signInWithEmailAndPasswordFb(auth, email, password);
      const next = await pushIdTokenToServer(cred.user);
      setServerSession(next);
      if (next.status === "failed") {
        throw new Error(`[auth] server rejected session: ${next.error}`);
      }
    },
    signInWithGoogle: async () => {
      const auth = getClientAuth();
      if (!auth) throw new Error("[auth] firebase client not configured");
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const next = await pushIdTokenToServer(cred.user);
      setServerSession(next);
      if (next.status === "failed") {
        throw new Error(`[auth] server rejected session: ${next.error}`);
      }
    },
    signUpWithEmail: async (email, password) => {
      const auth = getClientAuth();
      if (!auth) throw new Error("[auth] firebase client not configured");
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // Audit-distinct path. The onIdTokenChanged listener will follow up
      // with a regular `auth.login` event on the same actorId.
      await pushSignUpIdTokenToServer(cred.user);
      // Best-effort: fire the verification email but never block signup.
      sendEmailVerification(cred.user).catch((err) => {
        console.warn("[auth] sendEmailVerification failed", err);
      });
    },
    sendPasswordReset: async (email) => {
      const auth = getClientAuth();
      if (!auth) throw new Error("[auth] firebase client not configured");
      await sendPasswordResetEmail(auth, email);
    },
    signOut: async () => {
      // Clear the cookie first so the server is consistent even if the
      // client-side step fails or the page is closed mid-flight.
      await signOutAction();
      const auth = getClientAuth();
      if (auth) await signOutFb(auth);
      setServerSession(UNKNOWN_SERVER_SESSION);
    },
  };
}
