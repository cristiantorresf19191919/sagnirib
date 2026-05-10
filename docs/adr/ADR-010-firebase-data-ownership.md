# ADR-010 · Firebase data ownership boundary

- Status: accepted
- Date: 2026-05-10
- Supersedes: nothing
- Extends: ADR-009 (Integration adapters boundary)

## Context

Firebase (Firestore + Auth + future Storage / Cloud Functions / FCM) is the
backend of record. Without rules, every new contributor — human or LLM —
will:

- Reach for `firebase-admin` from a feature.
- Read `process.env.FIREBASE_*` ad-hoc.
- Define a parallel fake data set "for testing".
- Bypass the barrel and call Firestore directly from a Server Component.
- Skip auth on a sensitive read because "it's just one line".

Each of those is a one-folder regression that costs a multi-folder cleanup.
ADR-009 already says external SDKs live behind adapters; this ADR makes the
Firebase-specific boundary mechanically enforceable.

## Decision

Five hard boundaries. Violating any of them is an audit failure.

### 1. Import boundary

| Package           | Allowed locations                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| `firebase-admin/*` | `src/server/adapters/firebase/**`, `src/server/mappers/firebase-*.ts`, `scripts/seed-*.ts`        |
| `firebase/*`       | `src/features/auth/lib/**` only (Web SDK is an auth-feature internal)                             |

(Mappers need Admin SDK *types* like `Timestamp` for `instanceof` checks
when translating Firestore DTOs; that's the one and only concession.)

Anywhere else: forbidden. Use the barrel (`@/server/biringas`, `@/server/auth`)
or the `useAuthSession` hook.

### 2. Configuration boundary

`FIREBASE_*` and `NEXT_PUBLIC_FIREBASE_*` env vars are read **only** in:

- `src/core/config/firebase.ts` (server)
- `src/core/config/firebase-client.ts` (client)
- `scripts/seed-firebase.ts` (one-off bootstrap)

Anywhere else, even for a "quick check", is forbidden. `isFirebaseConfigured()`
is the public predicate.

### 3. Data ownership boundary

Each Firestore collection has a single **port** at `src/server/<port>/`:

```
src/server/<port>/index.ts          ← public barrel (env-routed dispatch)
src/server/<port>/types.ts          ← canonical domain contract
src/server/adapters/firebase/<port>/ ← Firestore implementation
src/server/mocks/<port>/             ← in-memory fallback
```

Features import from the barrel **only**. The mock is canonical fake data;
no second source of mock data exists in the repo.

Adding a new collection is a multi-file ADR-level change — see the playbook
in `docs/architecture/firebase-governance.md`.

### 4. Sensitive data boundary

Any field that must not appear in rendered HTML (private contact, payment
tokens, audit metadata) follows the **`*Raw` + barrel-wrap** pattern:

- The adapter exposes `getXRaw(...)` (no auth check).
- The barrel exposes `getX(...)` that wraps with `requireAuth()` + `auditLog()`.
- Features import the wrapped version. The raw version is never re-exported.

Mappers must explicitly NOT copy sensitive fields into the public type.

### 5. Mutation boundary

All Firestore writes happen in:

- Server Actions with `'use server'`, **and**
- `validateActionInput` schema validation, **and**
- `requireAuth()` (and `requireRole()` if applicable), **and**
- `auditLog()` for the relevant event, **and**
- `revalidateTag()` for any cache tag the write affects.

Direct writes from Server Components or Route Handlers are forbidden. The
seed script is the only exception and it lives in `scripts/`, not `src/`.

## Consequences

- The Firebase audit (`pnpm firebase:audit`) catches violations in CI before
  they ship.
- Swapping providers (Firestore → Postgres, Firebase Auth → Auth0) stays a
  per-port change.
- LLM-driven contributions that try to "just call Firestore here" fail the
  gate and get redirected to the playbook.
- Every collection has a documented schema, indexes, and security rules.

## Enforcement

Mechanical: `scripts/audit-firebase.mjs` (run via `pnpm firebase:audit`).
Documentary: this ADR + `.claude/rules/firebase-data-ownership.md` +
`docs/architecture/firebase-governance.md`.

The audit MUST pass before any PR that touches `firebase`, `firestore`,
`firebase-admin`, or any file under `src/server/adapters/firebase/` is
merged. The check is also part of release-hardening.
