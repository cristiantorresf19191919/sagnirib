"use client";

import { usePathname } from "next/navigation";

import { brandConfig, type SupportedLocale } from "@/core/branding/brand-config";

import { isSupportedLocale } from "./constants";
import { localizedHref } from "./href";

/**
 * Reads the active locale from the current URL. Returns `brandConfig.defaultLocale`
 * when the path is not yet locale-prefixed (transient state during the
 * proxy redirect) so client components never crash and never render
 * stray `undefined` strings.
 *
 * Use this hook inside Client Components that build internal links —
 * for Server Components, read from `params.lang` (canonical) or call
 * `readLocale()` (fallback for file-convention routes).
 */
export function useActiveLocale(): SupportedLocale {
  const pathname = usePathname() ?? "/";
  const first = pathname.split("/", 2)[1] ?? "";
  return isSupportedLocale(first) ? first : brandConfig.defaultLocale;
}

/**
 * Composes `useActiveLocale()` + `localizedHref()` so client components
 * can build locale-prefixed links with one call:
 *
 * ```tsx
 * const href = useLocalizedHref("/explorar"); // → /es/explorar or /en/explorar
 * ```
 */
export function useLocalizedHref(href: string): string {
  const locale = useActiveLocale();
  return localizedHref(locale, href);
}
