# Firebase governance — playbook

Authoritative source: ADR-009 (integration adapters) + ADR-010 (Firebase
data ownership). This file is the **how-to** for every common Firebase task.
If you are about to write code that talks to Firebase, find your scenario
below and follow the steps. If your scenario is not here, add an ADR before
writing code.

## Map of where things live

```
src/core/config/
├── firebase.ts                       # FIREBASE_* env vars (server)
└── firebase-client.ts                # NEXT_PUBLIC_FIREBASE_* env vars (client)

src/server/<port>/                    # PORT — public contract per data domain
├── index.ts                          # barrel (env-routed dispatch)
├── types.ts                          # canonical domain types
└── …                                 # auth-wrapped helpers if any

src/server/adapters/firebase/         # ADAPTER — Firestore implementation
├── client.ts                         # Admin app + Firestore singleton
├── app.ts                            # re-export of Admin app for auth
├── errors.ts                         # FirebaseAdapterError
├── <port>/                           # one folder per port
│   ├── index.ts                      # public adapter functions
│   ├── filters.ts                    # in-memory post-filters
│   └── …                             # any other adapter-internal helpers
└── auth/                             # auth port (special — see § Auth)

src/server/mocks/<port>/              # MOCK — in-memory canonical fake data
src/server/mappers/                   # MAPPER — Firestore DTO ↔ domain types
src/features/auth/                    # CLIENT-side auth feature (only)
scripts/seed-firebase.ts              # bootstrap data into Firestore
```

## Scenario 1 — I need to fetch Firestore data from a Server Component

**Don't:**

```ts
// ❌ feature reaching for the SDK
import { getFirestore } from "firebase-admin/firestore";
```

**Do:**

```ts
// ✅ feature reaching for the barrel
import { listAll } from "@/server/biringas";
const { data, meta } = await listAll({ category: "prepagos" });
```

If the function you need does not exist on the barrel, **extend the port**
(see Scenario 4), do not bypass it.

## Scenario 2 — I need a private/sensitive read

Sensitive = anything that must never appear in pre-rendered HTML
(private contact, payment data, audit metadata, internal flags).

Pattern:

1. Adapter exposes `getXRaw(...)` — pure data access, **no auth check**.
2. Mock exposes the same `getXRaw(...)`.
3. Barrel exposes `getX(...)` that wraps the adapter raw with
   `requireAuth()` + `auditLog()`.
4. The barrel **does not re-export** `getXRaw`.
5. Mappers do not copy the sensitive fields into the public domain type.

Example: `getPrivateContact` in `src/server/biringas/index.ts`.

## Scenario 3 — I need to mutate Firestore

All writes happen through Server Actions. The five-step contract:

```ts
"use server";

import { revalidateTag } from "next/cache";
import { auditLog } from "@/server/security/audit-log";
import { requireAuth } from "@/server/security/require-auth";
import { validateActionInput } from "@/server/security/validate-action-input";
import { CACHE_TAGS } from "@/server/adapters/firebase/biringas";

export async function updateListing(rawInput: unknown) {
  // 1. validate
  const input = validateActionInput(updateListingSchema, rawInput);
  // 2. authenticate
  const user = await requireAuth();
  // 3. authorize (when applicable)
  await requireRole(user, "moderator");
  // 4. mutate via adapter (the adapter exposes update/write helpers)
  await updateListingRaw(input);  // adapter-internal
  // 5. audit + revalidate
  await auditLog({ event: "biringa.listing.updated", actorId: user.uid, resource: `listing:${input.id}` });
  revalidateTag(CACHE_TAGS.listing(input.slug));
  revalidateTag(CACHE_TAGS.listings);
}
```

Direct writes from Route Handlers, Server Components, or scripts other than
`scripts/seed-*` are forbidden.

## Scenario 4 — I need to add a function to an existing port

Example: add `listByCity(city)` to the `biringas` port.

1. Add the function signature to `src/server/biringas/types.ts` if it has
   new parameter or return shapes.
2. Implement the Firestore version in
   `src/server/adapters/firebase/biringas/index.ts`. Use `unstable_cache`
   with a `CACHE_TAGS` tag.
3. Implement the mock version in `src/server/mocks/biringas/index.ts`.
4. Re-export from the barrel `src/server/biringas/index.ts`.
5. Run `pnpm firebase:audit` + `pnpm typecheck`.

If the implementation needs a new Firestore index, also update
`docs/architecture/firebase-schema.md` § "Composite indexes".

## Scenario 5 — I need to add a NEW Firestore collection

This is the ADR-level change. The cost is intentional — a new collection
is a new contract that future code will depend on.

1. Open `docs/adr/ADR-NNN-<slug>.md` documenting the collection's purpose,
   schema, indexes, security rules, retention.
2. Create the port: `src/server/<port>/{index.ts,types.ts}`.
3. Create the adapter: `src/server/adapters/firebase/<port>/index.ts`.
4. Create the mock: `src/server/mocks/<port>/index.ts` with canonical fake
   data. **Do not invent fake data anywhere else.**
5. If the collection has provider DTOs, add a mapper:
   `src/server/mappers/firebase-<port>.ts`.
6. Update `docs/architecture/firebase-schema.md` with the collection's
   shape, fields, indexes, and security rules.
7. Update `docs/architecture/integration-adapters.md` § "Active adapters"
   with a one-paragraph entry pointing at the ADR.
8. If the collection contains user-facing data, also update
   `docs/architecture/event-governance.md` and `audit-log` events.
9. Add a Pattern Decision Record under
   `docs/architecture/patterns-governance.md` if the new port introduces a
   gated pattern (Builder, Strategy, State Machine, etc.).
10. Run `pnpm firebase:audit` + `pnpm typecheck` + `pnpm lint`.

## Scenario 6 — I need to seed or migrate data

- **Initial seed (mock → Firestore):** `pnpm seed:firebase`. The script
  lives in `scripts/seed-firebase.ts` and is the **only** place outside
  `src/server/adapters/firebase/` that may import `firebase-admin/*`.
- **One-off migration:** add a new file under `scripts/` named
  `migrate-<date>-<slug>.ts`. Idempotent by design (use `set()` not
  `add()`, key by the same id space). Document the migration at the top of
  the file. Delete the script after the migration runs in production —
  migrations are not retained as living code.
- **Schema changes:** update `docs/architecture/firebase-schema.md` first,
  then write the migration that brings prod data into the new shape, then
  update the mapper, then update the mock. Order matters because the
  mapper assumes the new shape.

## Scenario 7 — I need to call Firebase Auth from the client

The Web SDK is fenced inside `src/features/auth/lib/`. From any other
client code, the **only** door is the `useAuthSession()` hook
(`src/features/auth/lib/use-auth-session.ts`):

```tsx
"use client";
import { useAuthSession } from "@/features/auth/lib/use-auth-session";

const { status, user, signInWithEmail, signOut } = useAuthSession();
```

If the hook is missing a method you need (e.g. password reset, email
verification), add it to the hook + the corresponding Server Action — do
not import `firebase/auth` elsewhere.

## Scenario 8 — I need to call Firebase Auth from the server

Use `getSession()` from `@/server/auth` for optional auth, or
`requireAuth()` from `@/server/security/require-auth` when auth is
mandatory. Both are cached per request.

## Scenario 9 — I need to swap providers (e.g. add Postgres alongside Firestore)

The port pattern was designed exactly for this. To add a Postgres adapter
for the `biringas` port:

1. Create `src/server/adapters/postgres/biringas/index.ts` with the same
   signatures the Firebase adapter exposes.
2. Add a config predicate (`isPostgresConfigured()` in
   `src/core/config/postgres.ts`).
3. Update the barrel `src/server/biringas/index.ts` to choose between
   Firebase, Postgres, and the mock at module load.
4. Update ADR-010 with the new boundary rule for `pg`/`postgres`/whatever
   driver is added.
5. Update `pnpm firebase:audit` (or add `pnpm postgres:audit`) to enforce
   the new boundary.

Features stay untouched. The whole point is that swapping is a one-folder
change at the adapter layer plus the barrel.

## Anti-patterns refusal list

If a task description matches any of these, refuse to implement it as
described and propose the correct path:

| Anti-pattern                                            | Correct path                            |
| ------------------------------------------------------- | --------------------------------------- |
| "Add a quick `getFirestore` call in this Server Component"            | Extend the port; barrel-only access.    |
| "Stub the listings response with a hardcoded array here"             | Use the mock; share canonical fake data.|
| "Read `process.env.FIREBASE_PROJECT_ID` from this script"            | Reuse `getFirebaseConfig()`.            |
| "Disable the audit script so the PR can merge"                       | Fix the violation; audit is not optional.|
| "Bypass `requireAuth()` because the route is admin-only"             | Use `requireRole(user, "admin")` after `requireAuth()`.|
| "Add a new collection under `src/features/...`"                      | Collections live at `src/server/<port>/`; open an ADR.|
| "Import `firebase/auth` in a Client Component for one button"        | Use `useAuthSession()`.                 |
| "Write a 'demo data' script under `src/` for Storybook"              | Storybook reads from the mock; do not fork.|

## Deploying rules + indexes

Rules and indexes live in repo as the source of truth:

| File | Purpose |
| ---- | ------- |
| `firestore.rules`           | Security rules. **Deny-all by design** — all access goes through Admin SDK on the server. |
| `firestore.indexes.json`    | Composite indexes. Append when adding queries that need them. |
| `firebase.json`             | Firebase project config (points to the two files above). |
| `.firebaserc`               | Project alias mapping (`default → biringas-v2`). |

Deploy commands (run from repo root, requires login via `pnpm dlx firebase-tools login` once):

```
pnpm firebase:deploy:rules     # rules only — fast, idempotent
pnpm firebase:deploy:indexes   # indexes — Firestore builds them in the background
pnpm firebase:deploy           # both (rules + indexes)
```

When **adding a new query** that needs a composite index:

1. Run the query first against staging — Firestore returns the URL of the
   missing index in the error message.
2. Click the URL, let Firestore propose the index, copy the JSON shape into
   `firestore.indexes.json`. (Or, more reliably, append by hand following
   the existing entries' shape.)
3. Commit the change + run `pnpm firebase:deploy:indexes`.
4. Update `docs/architecture/firebase-schema.md` § "Composite indexes" with
   the new entry.

Rules + indexes deploy is part of release-hardening. CI should run
`pnpm firebase:deploy:rules` against the prod project on tagged releases
(post merge, not on every PR — merging an unwanted rule change to prod is
bad).

## Gates

Before merge:

```
pnpm typecheck
pnpm lint
pnpm test
pnpm firebase:audit
pnpm patterns:audit
pnpm build
```

The Firebase audit alone catches the most common LLM regressions; run it
locally on every change to a Firebase-touching file.
