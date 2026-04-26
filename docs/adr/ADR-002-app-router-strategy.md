# ADR-002 · App Router strategy

- Status: accepted
- Date: 2026-04-25

## Context
We need conventions for routing, layouts, and route groups so that public marketing routes, authenticated dashboards, and integrations stay separated.

## Decision
- App Router only. Pages Router is out of scope.
- Route groups planned: `(marketing)`, `(auth)`, `(dashboard)`. Created as features land — not preemptively.
- Public routes live under `(marketing)` and require an SEO Route Contract before becoming indexable.
- Private routes live under `(dashboard)` and `(auth)`; never indexed, never in sitemap.
- i18n routing (`/[lang]`) is deferred until the intake locks idiomas (es, en confirmed conceptually but routing not yet activated).

## Consequences
- Adding a public route is a multi-step process: contract → metadata helper → page → audit. This is intentional friction.
