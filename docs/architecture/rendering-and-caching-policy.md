# Rendering and caching policy

| Route type | Rendering | Cache |
|---|---|---|
| Marketing / home / listing detail | Server-rendered, prerender where data allows | Cacheable, revalidate on listing mutation |
| Listing index | SSR with cache tags per filter | Revalidated on `listing.*` events |
| Auth / dashboard | Dynamic, request-time | Never cached, never indexed |
| API / webhooks | Route Handler, dynamic | No CDN cache by default |
| Draft / preview | Dynamic | noindex, fuera de sitemap |

Rules:
- Public indexable routes prefer prerender + revalidation. Heavy interactivity moves to leaf Client Components.
- Mutation flow: validate → mutate → `revalidateTag` / `revalidatePath` → return.
- Reads that feed both metadata and the page must be wrapped with React `cache()` to dedupe (see Next 16 docs § Memoizing data requests).
