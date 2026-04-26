# i18n routing policy

- Default locale: `es`. Secondary: `en`.
- Per Next 16 docs (`02-guides/internationalization.md`), the recommended pattern is `proxy.ts` detecting `Accept-Language` and redirecting to `/[lang]/...`.
- Foundation phase: structure documented but **NOT yet activated**. Pages live at root paths until the intake confirms URL strategy.
- When activated:
  - `src/app/[lang]/...` becomes the canonical layout.
  - `proxy.ts` performs locale detection and redirect for the root path.
  - SEO Route Contract per locale; sitemap only includes approved translations.
