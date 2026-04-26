# ADR-001 · Next.js architecture

- Status: accepted
- Date: 2026-04-25

## Context
Biringas is a greenfield marketplace for accompaniment services. We need a server-first stack capable of hosting public listings (SEO-relevant), user-facing transactions, and eventually an authenticated zone for providers and buyers.

## Decision
- Next.js 16 with **App Router** and TypeScript.
- `src/` layout with the canonical zones `app / core / shared / features / server`.
- pnpm as package manager.
- React Server Components by default; `'use client'` only for real interactivity.
- Mutations via Server Functions (`'use server'`); HTTP endpoints (`route.ts`) only for webhooks, file responses, or third-party integrations.
- Renamed Proxy (`proxy.ts`) replaces middleware (Next 16 breaking change).

## Consequences
- We pay an upfront cost to wire `src/`, tokens, helpers and policies, but gain a stable surface for SEO and security.
- Any agent or contributor MUST consult `node_modules/next/dist/docs/` before touching Next APIs (per `AGENTS.md`).
