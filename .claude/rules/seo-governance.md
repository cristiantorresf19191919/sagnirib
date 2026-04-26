# Rule: SEO governance

Before approving a public route as final:

1. There is a `docs/seo/routes/<route>.md` with status `approved`.
2. Metadata is built via `buildPageMetadata`, never inline literals.
3. Indexable routes have unique title, description, canonical and OG image.
4. JSON-LD only when contract requires it AND visible content backs it.
5. The route is registered in `src/core/seo/seo-routes.ts` so sitemap/robots see it.
6. `seoConfig.indexingEnabled` is OFF until release-hardening passes.

Reference: ADR-004, docs/seo/*.
