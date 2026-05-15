import "server-only";

/**
 * Firebase environment configuration.
 *
 * Source of truth for Firebase Admin credentials. Validates the three env
 * vars at first read. If any required var is missing the config evaluates
 * to `null` and `isFirebaseConfigured()` returns `false` — the barrel in
 * `@/server/biringas` then falls back to the in-memory mock so local dev
 * keeps working without credentials.
 *
 * Required env vars (Service Account JSON, expanded for Vercel-style hosts):
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY  (newlines may be escaped as `\n`)
 *
 * NEVER expose these via NEXT_PUBLIC_*. They are server-only.
 */

export interface FirebaseConfig {
  readonly projectId: string;
  readonly clientEmail: string;
  readonly privateKey: string;
}

function readConfig(): FirebaseConfig | null {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();

  if (!projectId || !clientEmail || !rawPrivateKey) {
    return null;
  }

  // Hosts like Vercel store the PEM with literal `\n` — un-escape them so the
  // Admin SDK gets a real PEM. Quote-wrapped values are also tolerated.
  const privateKey = rawPrivateKey
    .replaceAll(/^"|"$/g, "")
    .replaceAll(String.raw`\n`, "\n");

  return { projectId, clientEmail, privateKey };
}

let cached: FirebaseConfig | null | undefined;

export function getFirebaseConfig(): FirebaseConfig | null {
  if (cached === undefined) {
    cached = readConfig();
    if (cached === null && process.env.NODE_ENV !== "test") {
      // One-shot warning so the fallback to mock data is observable.
      console.warn(
        "[firebase] FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY not set — falling back to mock catalog. See .env.example.",
      );
    }
  }
  return cached;
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseConfig() !== null;
}

export function requireFirebaseConfig(): FirebaseConfig {
  const config = getFirebaseConfig();
  if (!config) {
    throw new Error(
      "[firebase] requireFirebaseConfig called without env vars set. Use isFirebaseConfigured() to gate.",
    );
  }
  return config;
}
