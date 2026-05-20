/**
 * Resolves an asset path (photo or video) into a browser-loadable URL.
 *
 * Three input shapes are recognised:
 *
 *   1. An absolute URL (`http*`) — returned as-is. Mocks seed external
 *      Unsplash / mileroticos URLs for `mainImage`, and admin tooling
 *      may eventually surface signed Firebase Storage download URLs
 *      with the `?alt=media&token=…` shape — both fit here.
 *   2. A canonical bucket path (`users/…`, `listing_drafts/…`,
 *      `listings/…`). In dev (no Firebase configured), the mock GET
 *      endpoint at `/api/_storage-mock-read/<path>` serves the bytes
 *      from the in-memory store. In production (Firebase configured),
 *      the bucket public-download URL is composed — assumes the
 *      `listings/` prefix has read-allow rules deployed (see
 *      `firestore.rules` / `storage.rules` for the listing surface).
 *   3. Anything else returns `null` so the caller can render an
 *      empty state instead of a broken `<img>` / `<video>`.
 *
 * The function is intentionally NOT marked `server-only`; both Server
 * and Client Components consume it. It reads
 * `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` (via the client-config helper)
 * when it needs to construct a public Firebase URL.
 */

import { getFirebaseClientConfig } from "@/core/config/firebase-client";

const BUCKET_PREFIXES: ReadonlyArray<string> = [
  "users/",
  "listing_drafts/",
  "listings/",
];

export function resolveAssetUrl(path: string | undefined | null): string | null {
  if (!path || typeof path !== "string") return null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//.test(trimmed)) return trimmed;
  if (!BUCKET_PREFIXES.some((p) => trimmed.startsWith(p))) return null;

  // Firebase configured → public-download URL. Storage rules must allow
  // read on the relevant prefix; for `listings/` that gate ships with
  // the promotion flow (out of scope for ADR-015). For unpromoted
  // drafts, the URL exists but the response is 403 — the player will
  // surface a broken state, which is the right default for premature
  // playback.
  const firebase = getFirebaseClientConfig();
  if (firebase?.storageBucket) {
    const encoded = encodeURIComponent(trimmed);
    return `https://firebasestorage.googleapis.com/v0/b/${firebase.storageBucket}/o/${encoded}?alt=media`;
  }

  // Mock mode — dev preview endpoint resolves the path to the
  // in-memory blob.
  return `/api/_storage-mock-read/${trimmed
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/")}`;
}
