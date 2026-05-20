import "server-only";

import { cookies, headers } from "next/headers";

import { brandConfig, type SupportedLocale } from "@/core/branding/brand-config";

import { LOCALE_COOKIE } from "./constants";

export { LOCALE_COOKIE };

const SUPPORTED = new Set<SupportedLocale>(brandConfig.supportedLocales);

function isSupported(value: string | undefined): value is SupportedLocale {
  return !!value && SUPPORTED.has(value as SupportedLocale);
}

/**
 * Picks the active locale for the current request.
 *
 * Precedence (highest → lowest):
 *   1. `biringas:locale` cookie — set by the header switcher.
 *   2. `Accept-Language` header, first matching tag.
 *   3. `brandConfig.defaultLocale` (es) fallback.
 *
 * Returns a `SupportedLocale` — never `null` — so server components
 * can call `t(locale, key)` without an extra guard.
 */
export async function readLocale(): Promise<SupportedLocale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isSupported(fromCookie)) return fromCookie;

  const headerStore = await headers();
  const accept = headerStore.get("accept-language") ?? "";
  const tags = accept
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase().slice(0, 2))
    .filter((v): v is string => !!v);
  for (const tag of tags) {
    if (isSupported(tag)) return tag;
  }

  return brandConfig.defaultLocale;
}
