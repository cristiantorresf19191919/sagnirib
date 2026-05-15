"use client";

import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";

import {
  getFirebaseClientConfig,
  isFirebaseClientConfigured,
} from "@/core/config/firebase-client";

/**
 * Firebase Web SDK singleton. Lives ONLY here — no other client code may
 * import from `firebase/app` or `firebase/auth` directly. That keeps the
 * provider swappable behind a single boundary, mirroring ADR-009 on the
 * client side.
 *
 * If the public env vars are missing, the helpers below return null instead
 * of throwing, so `useAuthSession` can render a clean "auth disabled" state.
 */

const APP_NAME = "biringas-web";

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;

export function getClientApp(): FirebaseApp | null {
  if (appInstance) return appInstance;
  if (!isFirebaseClientConfigured()) return null;

  const existing = getApps().find((a) => a.name === APP_NAME);
  if (existing) {
    appInstance = existing;
    return existing;
  }

  const config = getFirebaseClientConfig()!;
  appInstance = initializeApp(
    {
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      appId: config.appId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
    },
    APP_NAME,
  );
  return appInstance;
}

export function getClientAuth(): Auth | null {
  if (authInstance) return authInstance;
  const app = getClientApp();
  if (!app) return null;
  authInstance = getAuth(app);
  return authInstance;
}
