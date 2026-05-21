import { brandConfig, type SupportedLocale } from "@/core/branding/brand-config";

import { isSupportedLocale } from "./constants";

/**
 * Resolves an internal `href` to a locale-prefixed URL.
 *
 * Rules:
 *   - External URLs (`http://`, `https://`, `mailto:`, `tel:`) are returned untouched.
 *   - Anchors (`#section`) are returned untouched.
 *   - Paths already starting with `/{locale}/` are returned untouched.
 *   - Everything else gets `/{locale}` prepended.
 *
 * The helper is intentionally synchronous + pure so it can run from
 * Server Components (where the locale is read from `params.lang`) and
 * Client Components (where the locale is provided by `useActiveLocale()`).
 *
 * @example
 *   localizedHref("es", "/explorar")        // "/es/explorar"
 *   localizedHref("en", "/p/foo")           // "/en/p/foo"
 *   localizedHref("en", "/en/p/foo")        // "/en/p/foo" (idempotent)
 *   localizedHref("es", "https://x.io")     // "https://x.io"
 *   localizedHref("es", "#anchor")          // "#anchor"
 */
export function localizedHref(
  locale: SupportedLocale,
  href: string,
): string {
  // Bail out: external or protocol-relative URLs.
  if (/^(?:https?:)?\/\//i.test(href)) return href;

  // Bail out: pseudo schemes.
  if (/^(?:mailto:|tel:|sms:)/i.test(href)) return href;

  // Bail out: pure fragments.
  if (href.startsWith("#")) return href;

  // Non-rooted path — caller is using a relative href; we don't prefix it.
  if (!href.startsWith("/")) return href;

  // Already locale-prefixed.
  const firstSegment = href.split("/", 2)[1] ?? "";
  if (isSupportedLocale(firstSegment)) return href;

  // Root path "/" → "/{locale}" (no trailing slash).
  if (href === "/") return `/${locale}`;

  return `/${locale}${href}`;
}

/**
 * Strips the leading `/{locale}` from a path. Used by the LocaleSwitcher
 * when it needs to swap the prefix without dropping the rest of the URL.
 *
 * @example
 *   stripLocale("/es/explorar?city=Cali") // "/explorar?city=Cali"
 *   stripLocale("/en")                     // "/"
 *   stripLocale("/explorar")               // "/explorar" (no-op)
 */
export function stripLocale(pathname: string): string {
  if (!pathname.startsWith("/")) return pathname;
  const firstSegment = pathname.split("/", 2)[1] ?? "";
  if (!isSupportedLocale(firstSegment)) return pathname;
  const rest = pathname.slice(`/${firstSegment}`.length);
  return rest.length === 0 ? "/" : rest;
}

/**
 * Returns the language-prefixed path for every supported locale —
 * intended for `<link rel="alternate" hreflang="..."` emission and
 * `metadata.alternates.languages`.
 */
export function localizedAlternates(
  pathWithoutLocale: string,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const loc of brandConfig.supportedLocales) {
    out[loc] = localizedHref(loc, pathWithoutLocale);
  }
  // `x-default` is the recommended fallback when none of the locale
  // tags match the user's preferences.
  out["x-default"] = localizedHref(brandConfig.defaultLocale, pathWithoutLocale);
  return out;
}
