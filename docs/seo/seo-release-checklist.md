# SEO release checklist

Run before flipping `seoConfig.indexingEnabled` to `true`.

- [ ] Every public route has an approved `docs/seo/routes/<route>.md`.
- [ ] Every indexable route has unique `title` + `description`.
- [ ] Every indexable route has a canonical URL.
- [ ] `metadataBase` is set per environment.
- [ ] Indexable routes appear in the sitemap; private / draft routes do not.
- [ ] Auth, dashboard, admin, and draft routes are `noindex` / protected.
- [ ] OG image exists and renders on key public routes.
- [ ] JSON-LD is present where the contract requires it (and only there).
- [ ] No placeholder copy / lorem ipsum on indexable pages.
- [ ] Important images have meaningful `alt`.
- [ ] Required internal links exist.
- [ ] Production build succeeds without errors.
