import { isFirebaseConfigured } from "@/core/config/firebase";
import { mockStore } from "@/server/mocks/storage/store";

/**
 * Dev-only ingestion endpoint backing `src/server/mocks/storage/`.
 *
 * The wizard PUTs the compressed JPEG here when the project is running
 * without Firebase env vars set. The mock adapter mints `/api/_storage-mock/<token>`
 * URLs that `requestUploadTicket` returns; this handler validates the token
 * and stores the bytes in the in-memory `mockStore`.
 *
 * Gated on `!isFirebaseConfigured()` — once the operator wires the four
 * FIREBASE_* env vars, the barrel switches to the real adapter (signed
 * URLs go to `storage.googleapis.com`) and this endpoint returns 404
 * for any request, preventing accidental writes via a leaked URL.
 *
 * Runtime: Node (default). We read the request body as a Buffer to compute
 * size and pass to the in-memory store.
 */

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function PUT(req: Request, ctx: RouteContext): Promise<Response> {
  if (isFirebaseConfigured()) {
    return new Response("not found", { status: 404 });
  }

  const { token } = await ctx.params;
  if (!token || typeof token !== "string") {
    return new Response("missing token", { status: 400 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  // The signed URL also requires `x-goog-content-length-range`. The mock
  // does not enforce it — the size cap is checked against the actual body.
  const arrayBuffer = await req.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const result = mockStore.commitTicket({
    token,
    contentType,
    sizeBytes: bytes.byteLength,
    bytes,
  });

  if ("error" in result) {
    return new Response(result.error, { status: result.status });
  }

  return new Response(null, { status: 200 });
}

export async function GET(): Promise<Response> {
  // No GET on the mock ingestion path — Firebase signed PUT URLs have the
  // same property. Reads, if needed, will get their own signed READ URL
  // via a separate endpoint.
  return new Response("method not allowed", { status: 405 });
}
