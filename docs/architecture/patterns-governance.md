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

### PDR-003 · Storage port (Adapter + Command + State Machine)

- Problem: the `/publicar` wizard needs to attach photos to a `listing_drafts/{id}`
  document. The browser must not hold storage credentials; the server must
  decide where bytes land and at what size / MIME; the asset lifecycle has
  three states (staging → draft → listing) that must be auditable.
- Pattern chosen: Adapter (Firebase Admin Storage behind a server port) +
  Command (upload-ticket Server Action) + lightweight State Machine for the
  per-asset lifecycle.
- Alternatives considered:
  - (1) Web SDK direct upload with Storage Rules as the sole guard —
    rejected, would require relaxing the `firebase-data-ownership` rule that
    fences the Web SDK to `src/features/auth/lib/**`, and Storage Rules are
    weaker than IAM-bound signed URLs (see ADR-012 § "Decision").
  - (2) Server-proxied upload (`POST /api/upload` → server streams to
    bucket) — rejected, doubles bandwidth + adds a Node route handler that
    has to babysit multipart bodies. Signed URLs let the client upload
    directly to GCS without us touching the bytes.
  - (3) Third-party uploader (UploadThing / Uploadcare) — rejected, adds a
    second vendor for what is effectively three signed URLs and a copy.
- Why this pattern applies: same boundary problem as the listings adapter,
  with one extra dimension (the asset has a lifecycle that survives across
  Server Actions). The Command is the upload ticket; the State Machine is
  staging → draft → listing.
- Why this is not over-engineering: the State Machine has three states and
  two transitions (`submit` moves staging → draft; admin `approve` moves
  draft → listing). It is encoded by the path layout itself, not as a
  separate orchestrator. The Command pattern is a one-function Server
  Action — it earns the name only because we'll add `revokeUploadTicket` and
  `confirmUpload` siblings.
- Layer affected: server + features (enrollment).
- Server / client boundary: 100% server for the adapter and mock; the
  client only knows about the returned `{ uploadUrl, path, expiresAt }`
  shape and `fetch`s against the signed URL.
- Files created or modified:
  - `src/server/storage/{types,upload-ticket-schema,index}.ts` (port + barrel).
  - `src/server/adapters/firebase/storage/{client,errors,sign-upload-url,confirm-upload,copy-to-draft,index}.ts`.
  - `src/server/mocks/storage/{index,store}.ts` (in-memory blob store with
    fake signed URL endpoint mounted in `proxy.ts`).
  - `src/features/enrollment/actions/{request-upload-ticket,confirm-upload}.ts`.
  - `src/features/enrollment/lib/compress-image.ts` (client-side, wraps
    `browser-image-compression`).
  - `src/features/enrollment/components/StepDescription.tsx` (refactored
    for the per-asset upload state machine).
  - `src/server/biringas/{draft-types,create-draft-schema,index}.ts` (gallery
    becomes `{ path: string }[]`; on submit, paths are validated to live
    under the caller's `users/{uid}/staging/...` prefix and then copied
    into `listing_drafts/{draftId}/`).
  - `storage.rules`, `cors.json`, `.env.example` (new env var), `firebase.json`
    (storage block), `package.json` (deploy script).
  - `scripts/audit-firebase.mjs` (new boundary rule).
  - `docs/architecture/firebase-governance.md` (new Scenario 8).
- Tests required:
  - Schema unit tests: `uploadTicketSchema` rejects unsupported MIME, sizes
    above cap, paths outside the caller's staging prefix.
  - Mapper unit test: server-side path generator emits the documented
    prefix shape (`users/{uid}/staging/{sessionId}/photos/{photoId}.jpg`).
  - Adapter integration test (gated by env): signed PUT URL accepts
    in-range payload, rejects out-of-range payload, expires after TTL.
  - Boundary test: `pnpm firebase:audit` flags `firebase-admin/storage`
    outside `src/server/adapters/firebase/storage/**`.
- Risks:
  - (1) The 24h staging lifecycle rule is applied at the bucket level
    (operator step). If the operator skips it, staging blobs accumulate.
    Mitigation: a `scripts/audit-storage.mjs` (future) can scan and warn.
  - (2) The mock signed-URL endpoint runs inside the Next.js process; in
    production-prod it would be a public ingestion point. The mock is gated
    behind `NODE_ENV !== "production"` and `!isFirebaseConfigured()` — a
    deployment with real Firebase config skips the mock entirely.
  - (3) `browser-image-compression` adds ~25KB gzipped to the wizard bundle.
    Acceptable; the page is funnel-only (noindex) and not in the critical
    public path.
- Owner: camilo-gutierrez.
- Status: implemented (Fase 1 of the publish-profile completion roadmap,
  ADR-012). Closing summary: 5 rounds delivered — storage port (types,
  schema, barrel), Firebase adapter (V4 signed URLs, HEAD verify,
  staging→draft copy), dev mock with route-handler ingestion, draft schema
  + slug uniqueness, wizard with per-photo FSM and EXIF-stripped
  compression, MVP-free plans gated by `PLANS_ENABLED`. 40 unit tests
  pass; firebase:audit clean with 10 rules. Video deferred to Fase 1b.
  Admin approval / draft promotion deferred to Fase 2 (ADR-013, future).

