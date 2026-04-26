# ADR-004 · SEO and metadata strategy

- Status: accepted
- Date: 2026-04-25

## Decision
- One Factory: `src/core/seo/build-page-metadata.ts`. Every public route generates its `Metadata` through it. No ad-hoc `metadata` objects.
- Global `metadataBase` from `src/core/env/site.ts` (env-driven).
- Master switch `seoConfig.indexingEnabled` defaults to **false** during foundation — every route is noindex until release-hardening flips it on.
- `sitemap.ts` and `robots.ts` read from the route registry `src/core/seo/seo-routes.ts`. Adding a route to the registry without an approved contract is an audit failure.
- JSON-LD (`Organization`, `WebSite`, `Service`, etc.) is only emitted when the contract states it AND the visible content backs it (Addendum 001 §6).

## Consequences
- The site cannot be accidentally indexed before content/branding are finalized.
- Adding a public route is "boring": fill the contract, register it, build via the factory.
