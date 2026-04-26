/**
 * Next.js Proxy (renamed from middleware in Next 16).
 *
 * Currently a no-op: i18n routing, auth gating and rewrites are deferred
 * until the intake locks idiomas, auth provider and dominio. Adding logic
 * here MUST be paired with an ADR per Addendum 001 (auth + i18n).
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // Skip Next internals and static assets.
  matcher: ["/((?!_next/|favicon.ico|robots.txt|sitemap.xml).*)"],
};
