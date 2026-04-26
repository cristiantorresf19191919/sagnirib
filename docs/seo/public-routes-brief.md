# Public routes brief

Snapshot of public routes after F3 close. Each row is backed by an approved contract under `docs/seo/routes/`. The global `seoConfig.indexingEnabled` switch gates indexability until release-hardening.

| Route | Type | Search intent | Indexable | Sitemap | Contract | Status |
|---|---|---|---|---|---|---|
| `/` | marketing | branded + informational | yes (gated) | yes | [home.md](./routes/home.md) | approved |
| `/explorar` | feature-public | comercial / navegacional | yes (gated) | yes | [explorar.md](./routes/explorar.md) | approved |
| `/p/[slug]` | feature-public | navegacional / branded por handle | per-profile gated | per-profile | [p-slug.md](./routes/p-slug.md) | approved |
| `/legal/terminos` | legal | TOS | TBD | TBD | _pending_ | not started |
| `/legal/privacidad` | legal | privacy | TBD | TBD | _pending_ | not started |

## Rules
- `/explorar?page=N` con `N > 1` → `noindex, follow` y canonical a `/explorar`.
- `/p/[slug]` template no se emite literal en sitemap; sólo perfiles con `indexable: true` aprobado.
- Drafts y traducciones incompletas: noindex.
