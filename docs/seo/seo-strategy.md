# SEO strategy

## Goal
Acquire organic search demand for accompaniment-services queries (es / en) once content and brand handshake are closed. Until then the entire site is `noindex`.

## Master switch
`src/core/seo/seo-config.ts → indexingEnabled`. Foundation default: **false**. Flipped to true only after the SEO release checklist passes.

## Public route inventory (initial — pending intake confirmation)
- `/` — home / hero + featured listings
- `/listings` (or equivalent) — index of available companions
- `/listings/[slug]` (or `/p/[id]`) — listing detail (the marketplace's CTA "compra directa")
- Legal pages (terms, privacy) — pending

## Pending decisions
- Final URL structure of listing detail (`/p/[id]` vs `/listings/[slug]`).
- Whether listings are indexable individually or only the index is.
- Production domain and `metadataBase`.
- i18n URL strategy (`/es`, `/en`, single domain vs subdomain).
