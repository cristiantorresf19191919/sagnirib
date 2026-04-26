# ADR-005 · Data mutation and security

- Status: accepted
- Date: 2026-04-25

## Decision
- All mutations go through Server Functions / Server Actions (`'use server'`).
- Every Server Action MUST: validate input via a schema (`validateActionInput`), call `requireAuth()`, verify role/permission via a Policy/Guard, write an audit log entry, and revalidate the affected cache tag/path.
- Route Handlers (`route.ts`) only for webhooks, file responses, or external HTTP integrations. Webhooks pass through `verifyOrigin` and a signature check.
- Secrets stay in `src/server/`. Adapters wrap third-party SDKs.
- Auth provider is **not yet** chosen. `requireAuth` is a fail-closed stub today; wiring it requires a follow-up ADR.

## Consequences
- We cannot ship a real mutation until auth is wired. That is intentional.
- Foundation phase passes typecheck because `requireAuth` exists; runtime calls would throw, which is the correct behavior pre-auth.
