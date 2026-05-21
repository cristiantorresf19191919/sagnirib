# ADR-017 · i18n routing strategy

- Status: accepted
- Date: 2026-05-20
- Extends: docs/localization/i18n-routing-policy.md
- Supersedes: cookie-only locale resolution sketched in the foundation phase

## Context

Until 2026-05-20 the site shipped a single locale tree at the app root
with translation dictionaries available through `t(locale, key)` but
without locale-prefixed URLs. The shell covered ~20 keys (Header, Footer,
Hero kickers) and three dictionaries: `es`, `en`, `pt`.

The MVP audit flagged i18n as bloqueador #4: PT and EN users could not
publish or navigate end-to-end, `/explorar` and `/p/[slug]` were
Spanish-only, and the site had no hreflang signal — making real
SEO multilenguaje impossible.

We considered three approaches:

| Option                       | Pros                                | Cons                                              |
| ---------------------------- | ----------------------------------- | ------------------------------------------------- |
| Cookie-only (status quo)     | Zero URL churn                      | No hreflang, no shareable per-locale links, no SEO benefit |
| `[lang]` sub-path routing    | Canonical URL per locale, hreflang  | All routes move under `[lang]`, proxy redirects   |
| Sub-domain (en.biringas.co)  | Cleaner crawl boundaries            | Cert / DNS / hosting overhead unjustified for MVP |

Sub-path won. It matches the Next.js 16 internationalization guide,
preserves a single domain for ops, and unlocks hreflang in the sitemap
+ in metadata.

We also reduced supported locales from `["es", "en", "pt"]` to
`["es", "en"]`. PT was removed after the locale review: Colombia is the
sole launch market, our buyer + seller demand for PT is anecdotal, and
shipping a half-translated PT surface hurts brand more than helps it.

## Decision

1. **Move all visible routes under `src/app/[lang]/...`.** File-convention
   files that must serve from the app root (`sitemap.ts`, `robots.ts`,
   `manifest.ts`, `icon.tsx`, `apple-icon.tsx`, `favicon.ico`,
   `global-error.tsx`, `api/`) stay at the root.
2. **`proxy.ts` does locale detection.** Any incoming path without a
   locale prefix is redirected to `/{locale}/...` where `{locale}` comes
   from the precedence chain:
   - `biringas:locale` cookie (sticky preference set by the switcher)
   - `Accept-Language` header (first matching tag, two-letter slice)
   - `brandConfig.defaultLocale` (`es`)
3. **The proxy injects `x-locale` on every passthrough** so server
   components nested under `[lang]` can read the active locale from
   `headers()` without prop drilling. `readLocale()` reads
   `x-locale` first, then the cookie, then `Accept-Language`.
4. **Hand-rolled `t(locale, key)` API stays.** The migration target
   in `messages.ts` is API-identical to `next-intl`, so a future swap
   (when we cross ~500 keys, need plurals, or need ICU formatting)
   is byte-compatible at call-sites.
5. **Two locales only:** `es` (default, canonical) and `en`. PT was
   dropped from the MVP.
6. **Sitemap emits per-locale entries.** Every indexable static route
   produces one URL per supported locale plus an `alternates.languages`
   map containing the full set + `x-default` → `es`.
7. **`buildPageMetadata` builds hreflang alternates automatically.**
   Callers pass `pathname` (locale-less) + `locale`; the helper
   composes the canonical and the `alternates.languages` map. The
   legacy `path` field is accepted for backwards compatibility during
   the page-by-page migration.
8. **Locale switcher swaps the prefix in the current URL** (push
   `/{newLocale}{currentPathSansLocale}`) and persists the cookie so
   the next root visit honors the preference.

## Boundaries

- `[lang]/layout.tsx` validates the segment with `isSupportedLocale()`
  and returns `notFound()` for unknown values. URLs like `/de/...`
  return 404 instead of falling back to default.
- `generateStaticParams()` pre-renders every supported locale at build
  time so per-locale shells are statically cached.
- File-convention routes (sitemap/robots/manifest/icons/global-error)
  remain at the app root — they MUST NOT carry a locale prefix.
- The `__session` cookie is unaffected by the locale routing —
  unchanged, still scoped at the root.
- `firebase:audit` and the rest of the audit suite are not impacted;
  this is purely a routing + chrome change.

## Consequences

**Wins**

- Canonical URL per locale (`/es/explorar`, `/en/explorar`) — shareable,
  bookmarkable, indexable.
- hreflang alternates emitted automatically from `buildPageMetadata`
  and from the sitemap — search engines can route users to their
  preferred translation.
- `<html lang>` matches the URL — accessibility + screen-reader
  voice-locale becomes correct.
- Server Components anywhere in the tree can call `readLocale()` and
  always get the URL-derived locale (via the `x-locale` header) —
  no prop drilling.

**Costs**

- All Server Pages must accept `params: Promise<{ lang: string }>`
  and validate. The audit gate (release-hardening) will catch any
  page that doesn't.
- Internal links must route through `localizedHref(locale, "/path")`
  (server) or `useLocalizedHref("/path")` (client) to avoid an extra
  proxy redirect on every navigation. Hardcoded `href="/path"` still
  works functionally (the proxy redirects), but adds one HTTP hop. The
  migration is incremental; the audit will eventually flag remaining
  hardcoded internal hrefs as a perf warning, not an error.
- Two-locale content waves still pending after the chrome (Header,
  Footer, home metadata + CTA) — `/publicar`, `/explorar`, `/p/[slug]`,
  auth funnel, legal, errors. Tracked in `docs/release/i18n-rollout.md`.
- PT speakers see the Spanish surface. We accept this for the MVP.

## Migration plan (post-foundation)

Per `docs/release/i18n-rollout.md`:

- **Wave A · DONE** — Header, Footer, home page metadata + CTA, locale
  switcher, sitemap, `buildPageMetadata`.
- **Wave B** — `/publicar` wizard + planes + checkout shell.
- **Wave C** — `/explorar` filters + toolbar + chips + grid.
- **Wave D** — `/p/[slug]` sections (gallery, reviews, booking modal,
  contact, report menu).
- **Wave E** — Auth funnel (`ingresar`, `registrarse`, `recuperar`,
  `verificacion`) + `/mi-cuenta` dashboard + drafts.
- **Wave F** — Legal stubs (`terminos`, `privacidad`, `disputas`,
  `aviso-legal`) + `seguridad` + `favoritas` + error / not-found /
  toast / validation copy.

Each wave: extract literals → add keys to `es` + `en` in `messages.ts`
→ replace literals with `t(locale, key)` → run typecheck / lint /
seo:audit.

## References

- Next 16 internationalization guide: `node_modules/next/dist/docs/01-app/02-guides/internationalization.md`
- Next 16 proxy: `node_modules/next/dist/docs/01-app/02-guides/redirecting.md`
- docs/localization/i18n-routing-policy.md (updated 2026-05-20 to point at this ADR)
