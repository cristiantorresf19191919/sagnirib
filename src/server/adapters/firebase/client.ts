import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

import { requireFirebaseConfig } from "@/core/config/firebase";

/**
 * Firebase Admin singleton. The Admin SDK throws on duplicate initializeApp,
 * so we guard via `getApps()`. Reused across the server runtime.
 *
 * Runtime: Node only. Routes that consume this adapter must NOT opt into the
 * Edge runtime (`runtime: "edge"`); the Admin SDK relies on Node APIs.
 */

const APP_NAME = "biringas-admin";

let appInstance: App | null = null;
let firestoreInstance: Firestore | null = null;

export function getApp(): App {
  if (appInstance) return appInstance;

  const existing = getApps().find((a) => a.name === APP_NAME);
  if (existing) {
    appInstance = existing;
    return existing;
  }

  const config = requireFirebaseConfig();
  appInstance = initializeApp(
    {
      credential: cert({
        projectId: config.projectId,
        clientEmail: config.clientEmail,
        privateKey: config.privateKey,
      }),
      projectId: config.projectId,
    },
    APP_NAME,
  );
  return appInstance;
}

export function getDb(): Firestore {
  if (firestoreInstance) return firestoreInstance;
  firestoreInstance = getFirestore(getApp());
  // ignoreUndefinedProperties keeps the mapper-from-internal flow safe;
  // we never write `undefined` into Firestore for optional fields.
  //
  // Wrapped in try/catch because `settings()` can only be called once per
  // Firestore instance. In dev, HMR resets `firestoreInstance` to null but
  // the underlying firebase-admin singleton survives — so the second call
  // throws "Firestore has already been initialized". The settings are
  // already applied from the first load; the throw is safe to swallow.
  try {
    firestoreInstance.settings({ ignoreUndefinedProperties: true });
  } catch (err) {
    if (
      !(err instanceof Error) ||
      !err.message.includes("already been initialized")
    ) {
      throw err;
    }
  }
  return firestoreInstance;
}
