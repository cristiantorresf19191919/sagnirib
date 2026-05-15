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
  firestoreInstance.settings({ ignoreUndefinedProperties: true });
  return firestoreInstance;
}
