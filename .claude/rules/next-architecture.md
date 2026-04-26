# Rule: Next.js architecture

When you touch routing, layouts, server/client boundaries, caching, Server Actions, proxy or instrumentation:

1. Read the relevant guide under `node_modules/next/dist/docs/01-app/`.
2. Default to Server Components. `'use client'` only for real interactivity.
3. Mutations: Server Functions with `'use server'`. Route Handlers only for webhooks / file responses / explicit HTTP APIs.
4. Use `proxy.ts` (Next 16). Do not introduce `middleware.ts`.
5. Do not put heavy logic in `page.tsx` / `layout.tsx`.

Reference: ADR-001, ADR-002, ADR-003.
