# Metadata policy

- Shared defaults live in `src/core/seo/default-metadata.ts`.
- Every public route uses `buildPageMetadata` from `src/core/seo/build-page-metadata.ts`. No ad-hoc `Metadata` objects.
- `metadataBase` is set per environment from `NEXT_PUBLIC_SITE_URL`.
- Each indexable route declares its own canonical.
- If a route is multilingual, it declares `alternates.languages`.
- OG / Twitter cards are set for every public route worth sharing.
- No generic title / description on a final page.
- Dashboards, auth, admin and pages with placeholder copy are NEVER indexed.
