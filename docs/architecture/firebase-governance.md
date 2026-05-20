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

## Scenario 9 — I need to touch KYC verification (ADR-014)

KYC has two halves — modelo upload (this codebase) and admin review (the
admin codebase). Both write to the same `verifications/{uid}` doc and
the same `verifications/{uid}/` Storage prefix.

**Authoritative read order:**

1. `docs/adr/ADR-014-kyc-verification-basic.md` — the decision and shape.
2. `src/server/verification/types.ts` — the canonical KycRecord shape.
3. This file (Scenario 9).

**Where things live in this codebase (modelo side):**

```
src/app/verificacion/                       # public explainer + 3-step wizard route
src/features/verification/
├── components/VerificationWizard.tsx       # 3-step status-aware form
├── lib/upload-kyc-file.ts                  # compress + ticket + PUT + confirm
└── actions/verify.ts                       # "use server" wrappers (3 actions)
src/server/verification/
├── index.ts                                # barrel — validateActionInput + requireAuth + audit
├── schemas.ts                              # path regex, uid cross-check
└── types.ts                                # canonical types
src/server/adapters/firebase/verification/  # signs PUT URLs, writes the doc
src/server/mocks/verification/              # in-memory mock for dev / tests
```

**Where things live in the admin codebase:**

```
sagnirib-admin/src/app/verifications/[uid]/page.tsx   # standalone review
sagnirib-admin/src/app/drafts/[id]/page.tsx           # inline review during draft approval
sagnirib-admin/src/features/verifications/
├── components/KycActions.tsx                         # approve/reject buttons + two-step confirm
└── actions/{approve,reject}.ts                       # "use server" wrappers
sagnirib-admin/src/server/verification/
├── index.ts                                          # barrel — validates, calls adapter, backfills
└── schemas.ts                                        # uid + rejection reason validation
sagnirib-admin/src/server/adapters/firebase/verification/  # status flip transaction + signed READ URLs
sagnirib-admin/src/server/adapters/firebase/biringas/mark-verified.ts  # listings.verified backfill
```

**Two non-obvious invariants:**

1. **Approval gate on listings.** The admin's `approveDraft` refuses if
   `verifications/{ownerUid}.status !== "approved"`. Pre-ADR-014 listings
   stay published; only future approvals are gated. Source: ADR-014 §
   "Approval gate on listings".

2. **Backfill on KYC approve.** When the admin flips a verification to
   `approved`, every listing owned by that uid gets `verified: true` in
   a single batch. The barrel invalidates `CACHE_TAGS.listing(slug)` for
   each. This is what makes the gold badge appear without a separate
   migration job. Source: ADR-014 § "Migration note" + this file's
   `markListingsVerifiedByOwnerRaw`.

**Tasks that need an ADR (not a PR comment):**

- Adding a 4th file type (passport scan, address proof…).
- Adding re-verification periodicity (expiry after N months).
- Swapping the manual review for a provider (Veriff / Onfido / Trulioo)
  — Pro level per ADR-014. The adapter pattern makes this a
  one-folder change, but the contract / audit shape changes need an ADR.

## Scenario 10 — I need to swap providers (e.g. add Postgres alongside Firestore)

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

## Scenario 8 — Provisioning the storage bucket (one-time, per environment)

Cloud Storage backs the `/publicar` wizard's photo upload (ADR-012). The
adapter is server-only; the client never sees credentials. This setup
gives the operator the bucket the adapter signs URLs against.

1. **Enable Cloud Storage for Firebase.** In the Firebase Console of the
   target project → `Storage` → "Get started". Choose the **same region**
   as Firestore. The default name is `<projectId>.appspot.com` for legacy
   projects, `<projectId>.firebasestorage.app` for projects created after
   October 2024. Both work — pick the one the console shows you.
2. **Set `FIREBASE_STORAGE_BUCKET`** in `.env.local` (and the deployment
   host secrets) to that exact string. `src/core/config/firebase.ts`
   requires all four FIREBASE_* env vars now — missing the bucket flips
   the project back to the mock storage adapter.
3. **Deploy storage rules:** `pnpm firebase:deploy:storage`. The rules
   in `storage.rules` deny everything to the client SDK; access is
   exclusively via Admin SDK signed URLs.
4. **Configure CORS.** Required so the browser can PUT to the signed URL
   from `localhost` and the production domain. Run **once** per bucket:

   ```
   gsutil cors set cors.json gs://<your-bucket>
   ```

   (Requires `gcloud` CLI authenticated against the Firebase project.
   `gsutil` ships with the Google Cloud SDK.) The allowed origins live in
   `cors.json` at the repo root — update the production domains there
   before deploying.
5. **Add a bucket lifecycle rule.** In the Google Cloud Console →
   Cloud Storage → your bucket → Lifecycle → "Add a rule":
   - Action: **Delete object**.
   - Condition: **Age** = 1 day, **Object name matches prefix** = `users/`.
   This deletes staged-but-never-submitted uploads after 24 hours. The
   draft and listing prefixes are never auto-cleaned.
6. **IAM:** the service account behind `FIREBASE_CLIENT_EMAIL` must have
   **Storage Object Admin** on the bucket. If the service account was
   provisioned with `Editor` / `Owner` at the project level it already
   inherits this; otherwise grant it explicitly:

   ```
   gcloud storage buckets add-iam-policy-binding gs://<your-bucket> \
     --member="serviceAccount:<email>" \
     --role="roles/storage.objectAdmin"
   ```

7. **Verify.** Boot the app with the env vars set, hit `/publicar`, and
   inspect the network panel — the `requestUploadTicket` Server Action
   should return a `uploadUrl` pointing at
   `https://storage.googleapis.com/...`. A subsequent PUT with the
   compressed JPEG should return `200`. If you get `403`, the bucket name
   or the IAM role is wrong; if `4xx` on CORS, re-run step 4.

When **adding a new bucket prefix**: treat it as ADR-level work. Open a
new ADR, extend `storage.rules`, the adapter, and the audit rule for
hardcoded prefixes (rule 9). For reference, `verifications/{uid}/` was
added in ADR-014 (KYC basic level) following exactly this playbook.

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
| "Just upload directly with `firebase/storage` from the wizard"       | Server-signed V4 URL via `@/server/storage`. The client never holds upload creds (ADR-012). |
| "Let the client decide the upload path and just check the prefix"    | The server **mints** the path inside `requestUploadTicket`; the client only sends MIME + size. |
| "Skip compression — the bucket can hold the 12MB JPEG"               | EXIF + bandwidth + cost. Run `compressImage()` client-side before any upload. |
| "Approve this draft even though the modelo's KYC isn't done — I trust her" | `approveDraft` refuses by design (ADR-014). Ask the modelo to complete `/verificacion/enviar` first. |
| "Just flip `verified: true` in Firestore on the listing doc"         | `verified` is backfilled by `approveVerification` (admin codebase). Bypassing the barrel skips the audit log and the cache invalidation. |
| "Add another KYC file slot (passport, address proof) for this case"  | The 3-file shape is canonical (ADR-014). Adding a 4th is ADR-level. |

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
