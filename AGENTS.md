<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Biringas — Agent contract

Biringas runs the **Next Greenfield System v2/v3** (Blueprint Maestro + Project Intake & Brand Handshake + Addendum 001 SEO/Agents/Design + Addendum 002 Patterns/Responsive). Those four documents are the authoritative source of truth. This file is the entry point that tells you in what order to read them and what is non-negotiable.

## Order of reading (mandatory before touching code)

1. This `AGENTS.md`.
2. `CLAUDE.md` (re-exports this file).
3. The relevant guide(s) in `node_modules/next/dist/docs/01-app/` for whatever you are touching:
   - Routing / layouts: `01-getting-started/03-layouts-and-pages.md`
   - Server / client boundaries: `01-getting-started/05-server-and-client-components.md`
   - Mutations: `01-getting-started/07-mutating-data.md`
   - Caching / revalidation: `01-getting-started/08-caching.md`, `09-revalidating.md`
   - Metadata / OG: `01-getting-started/14-metadata-and-og-images.md`
   - Sitemap / robots: `03-api-reference/03-file-conventions/01-metadata/{sitemap,robots}.md`
   - Proxy (Next 16 replacement for middleware): `01-getting-started/16-proxy.md`
   - Instrumentation: `02-guides/instrumentation.md`
   - Internationalization: `02-guides/internationalization.md`
   - MCP: `02-guides/mcp.md`
4. The matching rule under `.claude/rules/`.
5. The matching skill under `.claude/skills/<skill>/SKILL.md`.
6. The relevant ADR(s) under `docs/adr/`.

## Non-negotiables

- **Server-first.** `page.tsx` and `layout.tsx` are Server Components. No `'use client'` for data — only for interaction.
- **No final indexable page without a SEO Route Contract** (`docs/seo/routes/<route>.md`).
- **No final visible feature without a Responsive Route Contract** when applicable (`docs/responsive/routes/<route>.md`).
- **No design hardcoding.** Colors, spacing, radius, shadows, motion go through `src/shared/design-system/tokens/*` and `src/styles/theme.css`.
- **No Server Action without `'use server'` + schema validation + auth + authorization.** (Next 16 docs: Server Functions are reachable by direct POST.)
- **No external SDK in features.** SDKs live behind `src/server/adapters/<provider>/`.
- **`proxy.ts`, not `middleware.ts`.** Renamed in Next 16.
- **No copy / claims / brand decisions invented.** Wait for the Brand Handshake.
- **Firebase boundaries are audit-enforced.** Read ADR-010 + the Firebase governance section below before touching anything that imports `firebase`, `firebase-admin`, `firestore`, or any file under `src/server/adapters/firebase/`. `pnpm firebase:audit` fails CI on any violation.
- **No parallel fake data.** The mocks under `src/server/mocks/<port>/` are canonical. Do not create new arrays of demo/sample/fixture domain data anywhere else.

## Workflow per change

1. State the goal.
2. Read the relevant Next docs (above).
3. Open the rule + skill + ADR that apply.
4. Propose a plan. For non-trivial changes, write a Pattern Decision Record under `docs/architecture/`.
5. Implement in small phases.
6. Run gates: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, plus the relevant audit (`seo:audit`, `design:audit`, `security:audit`, `patterns:audit`, `responsive:audit`, `firebase:audit`).
7. Update docs / ADRs / contracts if a decision changed.

## Firebase / Firestore / Auth — required reading

This is the most regression-prone area in the repo. Read in this order
**before writing code**:

1. `docs/adr/ADR-010-firebase-data-ownership.md` (the constitutional layer).
2. `.claude/rules/firebase-data-ownership.md` (rules — `pnpm firebase:audit` enforces them).
3. `docs/architecture/firebase-governance.md` (playbook — find your scenario, follow the steps).
4. `docs/architecture/firebase-schema.md` (Firestore shape + indexes).

Common refusals the audit / governance enforces:

- "Just import `firebase-admin` here for one query" → use the barrel `@/server/biringas` / `@/server/auth`.
- "Add a sample/demo array of listings to a feature/script" → reuse `src/server/mocks/<port>/`.
- "Read `process.env.FIREBASE_*` here" → use `getFirebaseConfig()` / `isFirebaseConfigured()`.
- "Add a new collection inline as part of this PR" → open an ADR + follow `firebase-governance.md` § "Adding a new collection".
- "Disable / soften the audit so the PR can merge" → fix the violation; the audit is not optional.

There is no `--fix` mode for `firebase:audit`. Boundaries are fixed by humans
who understand the data model.

## Authority

If this file conflicts with the four governance PDFs (Blueprint, Intake, Addendum 001, Addendum 002), the PDFs win. If this file conflicts with installed Next docs in `node_modules/next/dist/docs/`, the installed docs win for Next API behavior.
