/**
 * Next.js Proxy (renamed from middleware in Next 16).
 *
 * Two jobs:
 *   1. **Detect + redirect** — when an incoming URL has no locale segment
 *      (`/explorar`, `/p/foo`), pick the user's preferred locale and
 *      redirect to the prefixed URL (`/es/explorar`, `/en/p/foo`).
 *   2. **Propagate** — when the URL already carries a supported locale
 *      prefix, forward an `x-locale` request header so deeply-nested
 *      server components can read the active locale without prop drilling
 *      (via `getRequestLocale()`).
 *
 * Locale detection precedence (highest → lowest):
 *   1. URL prefix when the request already has one.
 *   2. `biringas:locale` cookie — sticky user preference set by the
 *      header switcher.
 *   3. `Accept-Language` header — first two-letter tag that matches a
 *      supported locale.
 *   4. `brandConfig.defaultLocale` (`es`) fallback.
 *
 * Per Next 16 internationalization guide + ADR-017.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { brandConfig, type SupportedLocale } from "@/core/branding/brand-config";
import { LOCALE_COOKIE } from "@/core/i18n/constants";

const SUPPORTED_SET = new Set<string>(brandConfig.supportedLocales);

/**
 * File-convention routes Next.js serves from `app/` at the root level —
 * they MUST NOT be prefixed with a locale, otherwise crawlers and
 * installers can't find them.
 */
const ROOT_FILE_ROUTES = new Set<string>([
  "/sitemap.xml",
  "/robots.txt",
  "/manifest.webmanifest",
  "/icon",
  "/apple-icon",
  "/favicon.ico",
]);

function pickLocaleFromRequest(request: NextRequest): SupportedLocale {
  const fromCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (fromCookie && SUPPORTED_SET.has(fromCookie)) {
    return fromCookie as SupportedLocale;
  }

  const accept = request.headers.get("accept-language") ?? "";
  for (const raw of accept.split(",")) {
    const tag = raw.split(";")[0]?.trim().toLowerCase().slice(0, 2);
    if (tag && SUPPORTED_SET.has(tag)) return tag as SupportedLocale;
  }

  return brandConfig.defaultLocale;
}

function pickLocaleFromPath(pathname: string): SupportedLocale | null {
  const first = pathname.split("/", 2)[1] ?? "";
  return SUPPORTED_SET.has(first) ? (first as SupportedLocale) : null;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Bail: API routes never carry a locale prefix.
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // Bail: file-convention routes served from app/ root.
  if (ROOT_FILE_ROUTES.has(pathname)) return NextResponse.next();

  const fromPath = pickLocaleFromPath(pathname);
  if (fromPath) {
    // URL already carries a supported locale — forward it as a header
    // so server components can read it from `headers()` cheaply.
    const headers = new Headers(request.headers);
    headers.set("x-locale", fromPath);
    return NextResponse.next({ request: { headers } });
  }

  // No locale prefix → redirect to the user's preferred one.
  const locale = pickLocaleFromRequest(request);
  const target = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  const url = request.nextUrl.clone();
  url.pathname = target;
  url.search = search;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals and static assets.
  matcher: ["/((?!_next/|favicon.ico|robots.txt|sitemap.xml).*)"],
};
