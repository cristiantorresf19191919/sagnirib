"use server";

import { cookies } from "next/headers";

import { brandConfig, type SupportedLocale } from "@/core/branding/brand-config";

import { LOCALE_COOKIE } from "./constants";

const SUPPORTED = new Set<SupportedLocale>(brandConfig.supportedLocales);

/**
 * Server Action: persist the active locale in a cookie. The client
 * then calls `router.refresh()` so server components re-read the
 * cookie + render with the new dictionary.
 *
 * Cookie is `lax` + `httpOnly: false` (the client switcher reads it
 * to highlight the active locale) + 1-year max-age so a user only
 * picks their language once per device.
 */
export async function setLocale(locale: string): Promise<{ ok: boolean }> {
  if (!SUPPORTED.has(locale as SupportedLocale)) {
    return { ok: false };
  }
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });
  return { ok: true };
}
