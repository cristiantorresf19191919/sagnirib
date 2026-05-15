/**
 * Public Firebase Web SDK configuration.
 *
 * These values are READ ONLY by Firebase Auth on the client. They are NOT
 * secrets — the Web SDK requires them in the browser. Security comes from
 * Auth rules + App Check, not from hiding the apiKey.
 *
 * NEVER put server credentials here. Service Account material lives in
 * `src/core/config/firebase.ts` (server-only).
 *
 * If any required var is missing, `getFirebaseClientConfig()` returns null
 * and `useAuthSession()` reports the disabled state instead of crashing.
 */

export interface FirebaseClientConfig {
  readonly apiKey: string;
  readonly authDomain: string;
  readonly projectId: string;
  readonly appId?: string;
  readonly storageBucket?: string;
  readonly messagingSenderId?: string;
}

let cached: FirebaseClientConfig | null | undefined;

export function getFirebaseClientConfig(): FirebaseClientConfig | null {
  if (cached !== undefined) return cached;

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();

  if (!apiKey || !authDomain || !projectId) {
    cached = null;
    return cached;
  }

  cached = {
    apiKey,
    authDomain,
    projectId,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() || undefined,
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || undefined,
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() || undefined,
  };
  return cached;
}

export function isFirebaseClientConfigured(): boolean {
  return getFirebaseClientConfig() !== null;
}
