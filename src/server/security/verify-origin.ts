import "server-only";

import { headers } from "next/headers";

import { site } from "@/core/env/site";

/**
 * Origin allow-list check for Route Handlers receiving cross-origin POSTs
 * (webhooks, third-party callbacks). Per Addendum 001 §18.
 */
export async function verifyOrigin(allowedOrigins: ReadonlyArray<string> = [site.url]) {
  const h = await headers();
  const origin = h.get("origin") ?? "";
  if (!allowedOrigins.includes(origin)) {
    throw new Error(`[security] disallowed origin: ${origin || "<empty>"}`);
  }
}
