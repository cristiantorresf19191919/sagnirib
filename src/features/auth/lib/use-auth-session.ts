"use client";

import { useEffect, useState } from "react";
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

export interface UseAuthSession {
  status: AuthStatus;
  user: SessionUser | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
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

async function pushIdTokenToServer(u: FirebaseUser): Promise<void> {
  const idToken = await u.getIdToken(/* forceRefresh */ false);
  const result = await loginWithIdToken(idToken);
  if (!result.ok) {
    throw new Error(
      `[auth] server rejected session: ${result.error?.message ?? "unknown"}`,
    );
  }
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

export function useAuthSession(): UseAuthSession {
  // Initial status is derived from env at render time so the effect does not
  // need to set "disabled" synchronously (React 19 set-state-in-effect rule).
  const [status, setStatus] = useState<AuthStatus>(() =>
    isFirebaseClientConfigured() ? "loading" : "disabled",
  );
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const auth = getClientAuth();
    if (!auth) return;

    const unsub = onIdTokenChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setStatus("anonymous");
        return;
      }
      try {
        await pushIdTokenToServer(u);
      } catch (err) {
        console.error(err);
      }
      setUser(toSessionUser(u));
      setStatus("authenticated");
    });

    return () => {
      unsub();
    };
  }, []);

  return {
    status,
    user,
    signInWithEmail: async (email, password) => {
      const auth = getClientAuth();
      if (!auth) throw new Error("[auth] firebase client not configured");
      const cred = await signInWithEmailAndPasswordFb(auth, email, password);
      await pushIdTokenToServer(cred.user);
    },
    signInWithGoogle: async () => {
      const auth = getClientAuth();
      if (!auth) throw new Error("[auth] firebase client not configured");
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      await pushIdTokenToServer(cred.user);
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
    },
  };
}
