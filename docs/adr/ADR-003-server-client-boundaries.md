# ADR-003 · Server / client boundaries

- Status: accepted
- Date: 2026-04-25

## Decision
- Default to Server Components. `'use client'` is reserved for interactivity, browser APIs, or libraries that require window/document.
- Client Components must NOT be `async`; pass props from server parents.
- Sensitive logic, secrets, and SDKs stay in `src/server/`. The `server-only` import enforces this where it matters.
- Data fetching is colocated in Server Components or in `src/server/repositories/` / adapters; never duplicated client-side.

## Consequences
- We avoid drifting into SPA habits.
- A code review must reject any `'use client'` introduced "for convenience" when a Server Component would do.
