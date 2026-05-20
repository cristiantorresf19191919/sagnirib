import { isFirebaseConfigured } from "@/core/config/firebase";
import { mockStore } from "@/server/mocks/storage/store";

/**
 * Dev-only blob-read endpoint backing the mock storage adapter.
 *
 * The PUT side lives at `/api/_storage-mock/<token>` (token-based,
 * single-use). This GET side resolves a canonical bucket path to the
 * stored bytes so the listing surface and the wizard can preview
 * already-confirmed assets in dev without Firebase.
 *
 * Gated on `!isFirebaseConfigured()` — once the operator wires the
 * FIREBASE_* env vars the adapter swaps to signed READ URLs from
 * `firebasestorage.googleapis.com` and this endpoint returns 404 for
 * every request.
 *
 * URL shape:
 *   /api/_storage-mock-read/users/<uid>/staging/<sessionId>/videos/<id>.mp4
 *   /api/_storage-mock-read/listing_drafts/<draftId>/videos/<id>.mp4
 *
 * Path segments are URL-encoded by Next's catch-all router; we join
 * them back into the canonical path the mock store keys on.
 */

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ path: ReadonlyArray<string> }>;
}

export async function GET(
  _req: Request,
  ctx: RouteContext,
): Promise<Response> {
  if (isFirebaseConfigured()) {
    return new Response("not found", { status: 404 });
  }

  const { path: segments } = await ctx.params;
  if (!segments || segments.length === 0) {
    return new Response("missing path", { status: 400 });
  }
  const path = segments.map((s) => decodeURIComponent(s)).join("/");

  const blob = mockStore.getBlob(path);
  if (!blob) {
    return new Response("not found", { status: 404 });
  }

  // Wrap in a Blob — Response's BodyInit overloads do not accept
  // Uint8Array views directly, and the underlying `ArrayBufferLike`
  // is wider than `ArrayBuffer` (could be SharedArrayBuffer). Cast
  // through Uint8Array<ArrayBuffer> after re-allocation to satisfy
  // the BlobPart union.
  const owned = new Uint8Array(blob.bytes.byteLength);
  owned.set(blob.bytes);
  const body = new Blob([owned], { type: blob.contentType });
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": blob.contentType,
      "Content-Length": String(blob.sizeBytes),
      // Cache for the lifetime of the dev server — paths embed unique
      // ids so the URL itself flips when content changes.
      "Cache-Control": "private, max-age=3600",
    },
  });
}
