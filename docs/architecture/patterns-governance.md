# Patterns governance

Authoritative source: Addendum 002 §4–§7. This file restates the rules for this repo and hosts Pattern Decision Records (PDRs).

## Pattern decision rules

- Use a pattern only when there is a real problem it solves. Decorative usage = audit fail.
- Patterns enabled by default: Server-first, Provider/Composition, Factory (SEO), Policy/Guard (skeletons), Repository (folders).
- Patterns gated by PDR: Adapter, Builder, Strategy, Observer/Event Bus (real bus), Command/Action, Mapper/DTO, State Machine.

## PDR template

```
# Pattern Decision Record · <feature-or-module>

Problem:
Pattern chosen:
Alternatives considered:
Why this pattern applies:
Why this is not over-engineering:
Layer affected: app | core | shared | features | server | tests
Server / client boundary:
Files created or modified:
Tests required:
Risks:
Owner:
Status: proposed | accepted | implemented | audited | rejected
```

## Active PDRs

### PDR-001 · Firebase adapter for Biringa listings (Adapter + Mapper)

- Problem: features need a real backend for the listings catalog without
  taking a hard dependency on Firestore (provider must remain swappable).
- Pattern chosen: Adapter + Mapper.
- Alternatives considered: (1) call Firestore directly from features —
  rejected, violates ADR-009 and prevents swapping; (2) repository
  abstraction with multiple impls registered — rejected as over-engineering
  for a single provider; (3) Route Handlers wrapping Firestore — rejected
  because Server Components already need direct access (no extra HTTP hop).
- Why this pattern applies: an external SDK with a different shape
  (`Timestamp`, `DocumentReference`) needs translation; multiple providers
  (mock + Firestore) must satisfy the same internal contract.
- Why this is not over-engineering: the contract already existed (the mock
  defined it); the Adapter is the single thinnest layer that lets us swap.
- Layer affected: server.
- Server / client boundary: 100% server (`import "server-only"` everywhere).
- Files created or modified:
  - `src/core/config/firebase.ts` (env validation, fallback toggle).
  - `src/server/adapters/firebase/{client,errors}.ts`.
  - `src/server/adapters/firebase/biringas/{index,filters,reviews,catalogs}.ts`.
  - `src/server/mappers/firebase-biringa.ts`.
  - `src/server/biringas/{types,review-types}.ts` (canonical contract).
  - `src/server/biringas/index.ts` (barrel: env-routed dispatch).
  - `docs/architecture/firebase-schema.md` (Firestore shape).
- Tests required: a fake Firestore (next iteration) + golden tests on the
  mapper round-trip; integration test against the emulator gated by env.
- Risks: (1) Firestore index creation is lazy (first failed query prints a
  URL); document the indexes up front to avoid surprises in prod.
  (2) Memory post-filtering is bounded by `FETCH_LIMIT=500`; revisit when
  the catalog crosses ~10k listings and switch to cursor pagination + more
  pushdowns.
- Owner: camilo-gutierrez.
- Status: implemented (PR 1 — read-only catalog). PR 2 will add Firebase
  Auth, which extends `requireAuth()` and introduces a session-cookie
  verifier in `proxy.ts`.

### PDR-002 · Firebase Auth (session cookie + Adapter)

- Problem: `requireAuth()` was a fail-closed stub; features need real
  identity to (a) gate sensitive surfaces like the contact channel and (b)
  audit who did what. Identity must be swappable per ADR-009.
- Pattern chosen: Adapter at `src/server/auth/` with the same env-routed
  dispatch as `src/server/biringas/`.
- Alternatives considered: (1) NextAuth — rejected, brings its own DB
  schema and conflicts with the Firebase identity store the founder wants
  to use; (2) JWT-only without server-side cookie — rejected because we
  need revocation and short-lived server-side trust windows; (3) Custom
  identity service — rejected as over-build for project stage.
- Why this pattern applies: same problem as PR 1 — an external SDK with
  cross-runtime concerns (Admin server-side, Web client-side) needs a
  uniform internal contract.
- Why this is not over-engineering: the dispatch already exists for the
  catalog; the auth port reuses the exact same pattern with one more
  function set (`getSession`, `createSession`, `destroySession`).
- Layer affected: server + features (auth feature).
- Server / client boundary: server side is `import "server-only"`. The
  client-side JS SDK is contained in `src/features/auth/lib/` ONLY — no
  other client code imports from `firebase/app` or `firebase/auth`.
- Files created or modified:
  - `src/core/config/firebase-client.ts` (public env vars).
  - `src/server/auth/{types,index}.ts` (port + dispatch).
  - `src/server/adapters/firebase/auth/{verify-session,manage-session,index}.ts`.
  - `src/server/mocks/auth/index.ts` (no-op stub).
  - `src/server/security/require-auth.ts` (wired to `getSession`).
  - `src/server/biringas/{private-contact-types,index}.ts` (auth-gated
    `getPrivateContact` + adapter raw helpers).
  - `src/features/auth/actions/session.ts` (Server Actions).
  - `src/features/auth/lib/{firebase-client,use-auth-session}.ts`.
- Session lifetime: 5 days. Cookie is `__session`, httpOnly, sameSite=lax,
  secure in production. Refresh tokens are revoked on `destroySession`.
- Tests required: integration tests with the Auth emulator (next iteration).
  Mapper-side: claims-to-AuthenticatedUser round-trip golden test.
- Risks: (1) the JS SDK is in the public bundle (~50kB gzipped); revisit
  if bundle budget gets tight. (2) Without App Check, the apiKey is
  reachable from any browser — App Check + reCAPTCHA enforce Firebase
  rules; add before public launch. (3) Session cookie is bound to the
  hosting domain; any sub-route prefix change requires re-issuing.
- Owner: camilo-gutierrez.
- Status: implemented (PR 2 foundation — no UI components yet, since copy
  awaits the Brand Handshake).
