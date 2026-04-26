# Structured data (JSON-LD) policy

- JSON-LD is emitted only when the SEO Route Contract requires it AND visible content backs it.
- Allowed schemas (initial): `Organization`, `WebSite`, `Service`, `Product`, `Article`, `FAQPage`, `BreadcrumbList`, `LocalBusiness`.
- Reviews, ratings, prices, availability and metrics MUST be real and approved before being added to JSON-LD.
- Schema builders live in `src/core/seo/structured-data.ts` and `src/core/seo/builders/`.
- A Builder is justified when there are real variants by entity, locale, or canonical.
