# i18n routing policy

Activated 2026-05-20 — see ADR-017 for full rationale.

## Locales

- **Default**: `es` (canonical, fallback for missing keys).
- **Secondary**: `en`.
- PT was removed from the MVP. No new locale is added without an ADR.

## Routing

- Every visible route lives under `src/app/[lang]/...`. Root-level
  file-convention routes (`sitemap.ts`, `robots.ts`, `manifest.ts`,
  `icon.tsx`, `apple-icon.tsx`, `favicon.ico`, `global-error.tsx`,
  `api/*`) stay at the app root and MUST NOT be locale-prefixed.
- `proxy.ts` redirects any path without a locale prefix to the user's
  preferred locale (precedence: cookie → `Accept-Language` → default).
- The proxy injects an `x-locale` request header on every passthrough
  so deeply-nested Server Components can call `readLocale()` and get
  the URL-derived locale without prop drilling.
- The `[lang]` segment is validated with `isSupportedLocale()` — any
  value outside `brandConfig.supportedLocales` returns a 404.
- Internal navigation should use `localizedHref(locale, "/path")` (server)
  or `useLocalizedHref("/path")` (client). Hardcoded `href="/path"`
  still works (the proxy redirects) but costs one extra HTTP hop per
  navigation.

## SEO

- Every public route emits a canonical URL for the active locale plus
  one `<link rel="alternate" hreflang="…">` per supported locale (plus
  `x-default` → `es`).
- The sitemap enumerates each indexable route × each supported locale
  + the `alternates.languages` map.
- `seoConfig.indexingEnabled` is still the master switch; while it is
  off (foundation phase) the sitemap is empty and every page is
  `noindex,nofollow`.

## Translation library

- Hand-rolled `t(locale, key)` in `src/core/i18n/messages.ts`.
- API is intentionally next-intl-compatible — when we cross ~500 keys
  or need plurals / ICU formatting, the swap is byte-identical at
  call-sites. Until then we keep the bundle tiny.

## References

- ADR-017 · i18n routing strategy
- Next 16 internationalization guide:
  `node_modules/next/dist/docs/01-app/02-guides/internationalization.md`
