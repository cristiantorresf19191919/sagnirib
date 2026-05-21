import "server-only";

import { cookies, headers } from "next/headers";

import { brandConfig, type SupportedLocale } from "@/core/branding/brand-config";

import { LOCALE_COOKIE, isSupportedLocale } from "./constants";

export { LOCALE_COOKIE };

/**
 * Reads the active locale for the current request.
 *
 * Precedence (highest → lowest):
 *   1. `x-locale` request header — set by `proxy.ts` from the URL prefix.
 *      This is the canonical source whenever the URL carries a locale.
 *   2. `biringas:locale` cookie — sticky user preference set by the
 *      header switcher (used outside the locale tree, e.g. inside
 *      Server Actions that don't see the modified request headers).
 *   3. `Accept-Language` header — first matching tag.
 *   4. `brandConfig.defaultLocale` (`es`) fallback.
 *
 * Returns a `SupportedLocale` — never `null` — so server components
 * can call `t(locale, key)` without an extra guard.
 *
 * **Prefer `params.lang`** when inside an `app/[lang]/...` segment —
 * the URL is the canonical source and reading `params` is cheaper
 * than the headers/cookies dance.
 */
export async function readLocale(): Promise<SupportedLocale> {
  const headerStore = await headers();

  const fromProxy = headerStore.get("x-locale");
  if (isSupportedLocale(fromProxy ?? undefined)) {
    return fromProxy as SupportedLocale;
  }

  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isSupportedLocale(fromCookie)) return fromCookie;

  const accept = headerStore.get("accept-language") ?? "";
  for (const raw of accept.split(",")) {
    const tag = raw.split(";")[0]?.trim().toLowerCase().slice(0, 2);
    if (isSupportedLocale(tag)) return tag;
  }

  return brandConfig.defaultLocale;
}
