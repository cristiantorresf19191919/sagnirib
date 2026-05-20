import "server-only";

import { getStorage, type Storage } from "firebase-admin/storage";

import { requireFirebaseConfig } from "@/core/config/firebase";
import { getApp } from "@/server/adapters/firebase/client";

/**
 * Firebase Admin Storage singleton, scoped to the configured bucket.
 *
 * Reuses the Admin app initialized by `@/server/adapters/firebase/client`,
 * so the credential and project id are guaranteed identical to the
 * Firestore side. Bucket name is read from `FIREBASE_STORAGE_BUCKET` via
 * `requireFirebaseConfig()` — that's the only place the env var is read.
 *
 * Runtime: Node only. Routes that consume this adapter must not opt into
 * the Edge runtime — Admin SDK + signed URL generation rely on Node APIs
 * and the service account private key.
 */

type StorageBucket = ReturnType<Storage["bucket"]>;

let bucketInstance: StorageBucket | null = null;

export function getBucket(): StorageBucket {
  if (bucketInstance) return bucketInstance;
  const { storageBucket } = requireFirebaseConfig();
  bucketInstance = getStorage(getApp()).bucket(storageBucket);
  return bucketInstance;
}
