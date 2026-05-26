# ADR-019 · Immutable account type (Publisher vs Commentator)

- Status: proposed
- Date: 2026-05-25
- Extends: ADR-010 (Firebase data ownership), ADR-009 (Integration
  adapters), ADR-018 (Person-scoped KYC + partner accounts)
- Supersedes (in part): the cookie-only `biringas:account-type`
  semantics introduced alongside ADR-018 § "Account-type cookie on
  Google sign-in". The cookie continues to exist as a UX hint, but
  the **authoritative** account type now lives in Firestore.

## Context

The product has two parallel registration journeys (ADR-018, the PDF
flows doc, `src/features/auth/lib/rbac.ts`):

- **Publisher** (UX label "Partner" / "Modelo") → can administer
  `persons/{personId}` and publish listings via `createListingDraft`.
  Server-side role: `Role.Model`.
- **Commentator** (UX label "Cliente") → can comment, favorite,
  request bookings; **cannot** publish. Server-side role:
  `Role.Commentator`.

The selection currently lives in **two places**:

1. An httpOnly cookie `biringas:account-type` set by `setAccountType`
   (`src/features/auth/actions/set-account-type.ts`). UX hint.
2. Additive custom claims (`Role.Model` / `Role.Commentator`) minted
   by `loginWithIdToken` / `signUpWithIdToken` based on the cookie.

Three production bugs surfaced from this shape:

1. **Both roles can coexist on the same uid.** `setAccountType` only
   skips grant when the *same* role is already present
   ([set-account-type.ts:109](src/features/auth/actions/set-account-type.ts#L109)):

   ```ts
   if (user.roles.includes(target)) return null;
   await grantRole(user.uid, target, user.uid);
   ```

   It never **revokes** the opposite role. A user who signs up as
   `commentator` and later clicks the "Soy partner" card on
   `/ingresar` ends up with `roles: ['commentator', 'model']` and
   gains publishing rights.

2. **`createListingDraft` does not gate on `Role.Commentator`**
   ([src/server/biringas/index.ts:413-608](src/server/biringas/index.ts#L413-L608)).
   It only checks `requireAuth()`, and on the first draft it
   pre-grants `Role.Model` ([line 604](src/server/biringas/index.ts#L604)) —
   so a commentator who reaches `/publicar` and submits a draft
   walks out as a publisher with no explicit consent.

3. **The cookie is the only source of truth for the dashboard
   router.** `/mi-cuenta` redirects to `/mi-cuenta/comentarios` if
   `accountType === 'commentator'`. The cookie is httpOnly but
   `setAccountType` can overwrite it server-side at any time —
   there is no record that says "this account is locked as
   commentator". A motivated user (or a buggy code path) can flip
   the cookie value, re-acquire the publisher role, and bypass
   every check.

The root issue: **the account type is treated as a UX preference,
not as an immutable identity decision.** Custom claims are additive
by Firebase's design (they merge), so additive role grants alone
cannot enforce mutual exclusion.

A related constraint surfaced in the requirements review: legal /
trust&safety wants the account type to be **non-mutable** once chosen,
because mixing the two journeys on one identity creates audit
ambiguity (which writes happened "as a buyer" vs "as a seller"?).
"Sé los dos" → register a second account with a different email.

## Decision

Introduce a new top-level collection `users/{uid}` whose **`accountType`
field is the single source of truth** for the publisher-vs-commentator
distinction, and treat that field as **write-once / read-many** at every
layer.

### Firestore — `users/{uid}`

One document per Firebase Auth user. Written exactly once, at
account-type lock time. Doc id mirrors `request.auth.uid` so the
read is always `.doc(uid).get()` — zero query cost.

```
users/{uid}
  uid: string                              // == doc id, mirrored for convenience
  accountType: 'publisher' | 'commentator' // IMMUTABLE after first write
  email: string | null                     // snapshot at lock time; not source of truth
  accountTypeChosenAt: Timestamp           // serverTimestamp() at lock
  accountTypeChosenVia: 'pre-oauth' | 'post-oauth-modal' | 'lazy-migration'
  createdAt: Timestamp                     // == accountTypeChosenAt (kept distinct for future fields)
```

**Why a new top-level collection (not a field on `persons/`)?**
Persons are owned by an account (`persons.ownerUid → users.uid`).
The account type is a property of the *account*, not of any person
it owns — a partner with N persons has one account type, not N.
Putting it on `persons/` would force every read that needs to know
"can this user publish?" through a person lookup, which is a join.

**Why a separate doc instead of a custom claim?** Three reasons:

- **Queryable.** The admin codebase needs "show me all publisher
  accounts with no listings" and "show me all commentator accounts
  with > N reviews" — Firestore queries land in seconds, custom
  claim sweeps require Auth admin exports.
- **Auditable.** A field with `chosenAt` + `chosenVia` records the
  lock event. Custom claims have no per-grant metadata; the audit
  log already captures grants but the doc state itself is the
  authority.
- **Drift-proof.** Custom claims propagate via ID token refresh and
  can lag for ~1h. The doc reflects the truth immediately. Server
  Actions read the doc; the UI surfaces the claim — drift becomes
  a one-direction sync issue, not a permission gap.

Custom claims continue to be granted (so client-side `useAuthSession`
can render the right surface without a Firestore read), but they are
**derived** from `users/{uid}.accountType`, not the other way around.

### Mutual exclusion at the role layer

`grantRole(uid, Role.Model)` rejects with `AuthError('conflicting-role')`
if the user already holds `Role.Commentator`, and vice versa. This is
defense-in-depth — the primary gate is the `users/{uid}` doc, but a
mis-wired code path that tries to grant the opposite role hits a hard
floor instead of silently inflating the role set.

`Role.Admin` is unchanged — it is orthogonal to the publisher /
commentator axis and may coexist with either.

### Locking semantics

The doc is written **exactly once**:

- Path 1 — **Pre-OAuth chooser** (`/ingresar`, `/registrarse`):
  cookie set by `setAccountType`. On the next
  `signUpWithIdToken` / `loginWithIdToken`, if `users/{uid}` does
  not exist, we write it from the cookie value. If it does exist,
  we **ignore the cookie** — the doc wins.
- Path 2 — **Post-OAuth modal** (`AccountTypeFallbackModal`):
  fires when the dashboard sees `users/{uid}` is missing AND the
  cookie is missing. The modal calls `setAccountType`, which (a)
  writes the cookie, (b) writes `users/{uid}` if absent, (c)
  grants the matching role.
- Path 3 — **Lazy migration** (described below).

`setAccountType` is **idempotent on the same type** (calling it with
`'commentator'` when the user is locked as `'commentator'` is a no-op)
and **rejects on the opposite type** with `error.kind ===
'account-type-locked'`. The UI surfaces this as a static message:
"Tu cuenta está registrada como cliente. Para publicar perfiles,
creá una cuenta nueva con otro correo."

`clearAccountType` is **removed**. It existed as a debug helper and
is incompatible with immutability — its presence means any client
could nuke the cookie and re-enter the chooser.

### Enforcement at every mutation point

The Firestore doc is the authority, but every write path that depends
on the distinction re-checks the doc (not the cookie, not the claim).
This is the part the current system gets wrong — the dashboard router
checks, but `createListingDraft` does not.

| Surface | Old behavior | New behavior |
| ------- | ------------ | ------------ |
| `createListingDraft` | requireAuth + first-time grant of `Role.Model` | requireAuth + `getMyAccountType()` must be `'publisher'`; throws `permission-denied` for commentators. Role grant in signup, not here. |
| `/publicar` page | Auth gate only | Auth gate + redirect to `/mi-cuenta/comentarios` if `accountType === 'commentator'` |
| `/mi-cuenta/comentarios` | Auth gate only | Auth gate + redirect to `/mi-cuenta` if `accountType === 'publisher'` |
| `/mi-cuenta` | Cookie check for redirect to `/comentarios` | DB check (`getMyAccountType()`); cookie is a fallback only when the doc read fails |
| `setAccountType` | Always writes cookie + grants matching role | Reads `users/{uid}.accountType` first; if locked and different, rejects |
| `loginWithIdToken` / `signUpWithIdToken` | Grants role based on cookie | Writes `users/{uid}` from cookie OR lazy-migration, then grants the corresponding role |
| `grantRole` | Additive claim write | Rejects on conflicting role (Model ↔ Commentator) |

### Lazy migration for legacy accounts

Existing accounts at deploy time fall into four states:

| State | Has `Role.Model` | Has `Role.Commentator` | Has listings/drafts | Has reviews/bookings |
| ----- | ---------------- | ---------------------- | ------------------- | -------------------- |
| A | yes | no | yes or no | any | → lock as **publisher** |
| B | no | yes | no | any | → lock as **commentator** |
| C | yes | yes | yes | any | → **publisher wins** (drafts are the stronger signal of original intent) |
| D | yes | yes | no | yes | → lock as **commentator** |
| E | no | no | any | any | → cookie value if present, else **force modal** |

Implemented as a one-shot read inside `getMyAccountType()`:

1. If `users/{uid}` exists, return its `accountType` — done.
2. Else, probe in this order:
   - `listing_drafts` where `ownerUid == uid` (limit 1) → if any, lock as
     `publisher` (covers states A and C; **drafts beat reviews** on tie).
   - If no drafts: check claims. If `Role.Commentator` in claims and no
     drafts → lock as `commentator` (covers B and D).
   - If claims also empty: fall back to cookie. If cookie present, lock
     as the cookie value. If neither → return `null` and let the UI
     trigger `AccountTypeFallbackModal`.
3. Write `users/{uid}` with `accountTypeChosenVia: 'lazy-migration'`.
4. As a side effect, **revoke the opposite role** if both were present
   (idempotent via `grantRole`'s new exclusion check, plus an explicit
   `revokeRole` call from the migration path).

This is identical in spirit to ADR-018's lazy person creation. The
first read for an account triggers the migration; the second sees the
doc and short-circuits.

### Cookie's new role

The cookie continues to exist for two narrow purposes:

- **Pre-auth funnel hint** — the visitor picks on `/ingresar` before
  any session exists; the cookie carries that pick through the OAuth
  redirect.
- **Cache buffer during ID token refresh** — when the session cookie
  is refreshing and the doc read is briefly unavailable, the cookie
  short-circuits the dashboard router for one render. The doc takes
  over on the next render.

The cookie is **never trusted** by mutation paths
(`createListingDraft`, `setAccountType`). They read the doc.

### Server Action surface

```
src/server/users/
  types.ts                  // UserRecord, AccountType type aliases
  index.ts                  // barrel: getMyAccountType, setAccountTypeOnce, ...
  schema.ts                 // zod schema for setAccountTypeOnce input
src/server/adapters/firebase/users/
  index.ts                  // raw adapter (no requireAuth, no audit)
src/server/mocks/users/
  index.ts                  // Map-based in-memory mock
```

Barrel exports (the public API features may import):

```ts
// reads
getMyAccountType(): Promise<'publisher' | 'commentator' | null>
isAccountLocked(): Promise<boolean>

// mutations
setAccountTypeOnce(input: { accountType, via }):
  Promise<{ accountType, locked: boolean } |
          { error: 'account-type-locked', currentAccountType }>
```

`setAccountTypeOnce` uses a Firestore **transaction** to read-then-write:
if the doc exists, return the lock error; else write. This is the
canonical atomicity boundary — no two parallel requests can race past it.

## Migration plan

### Phase A — code lands, lazy migration on demand

1. Deploy this PR. `users/` collection ships; the `users` adapter +
   mock + barrel are wired through.
2. On first `getMyAccountType()` for an account with no
   `users/{uid}`, run the migration logic above. Result is written
   to Firestore; the second call short-circuits.
3. `setAccountType` reads the doc before writing. If locked to the
   opposite type, returns the typed error; the UI shows the
   non-dismissable "tu cuenta es X, crea otra para Y" message.
4. `createListingDraft` and `/mi-cuenta/*` start enforcing the doc.
5. The pre-existing `clearAccountType` Server Action is deleted in
   the same PR. Any UI that calls it (today: none in production
   surfaces; only debug paths) is removed too.

This avoids a synchronous migration script. Inactive accounts (never
log in again after deploy) are never migrated, which is fine — they
have no live behavior to break.

### Phase B (optional, future) — proactive sweep + claim cleanup

After ~30 days post-launch:

6. A one-shot admin script walks every Firebase Auth user, applies
   the lazy-migration logic from a batch job, and **revokes** the
   non-winning role for any account that still has both. This
   normalizes the long tail of inactive-but-dual-rol accounts.
7. Once that script completes, MAIN can drop the additive code path
   in `setAccountType` (the one that grants the role from cookie) —
   the only path to grant a publisher/commentator role becomes the
   first `users/{uid}` write.

Phase B is not blocking for this ADR; it's a hygiene follow-up.

## Out of scope (deferred)

- **Account-type "appeals" UI.** A user who picked wrong can email
  support, who manually edits the doc + revokes/grants claims. A
  self-service flow is explicitly out of scope to preserve the
  immutability guarantee.
- **Hard-deleting a `users/{uid}` doc.** Operational deletes happen
  out-of-band with admin tooling. There is no "reset my account
  type" Server Action. Ever.
- **Soft-deleting a user.** Account deletion in general is a future
  ADR; this one only governs the type field.
- **Per-account-type billing.** Plans and pricing remain attached to
  listings (publisher side); commentator side has no paid surface
  today. If commentator plans land, they hang off `users/{uid}`
  alongside `accountType` in a separate ADR.
- **Phone Auth gating.** Today commented out (`PHONE_AUTH_ENABLED =
  false`). When it lights up, it lands as a Phase-2 step inside the
  publisher journey only — does not affect the type lock.

## Consequences

- New Firestore collection `users/`.
- No new env vars (reuses existing Firebase config).
- New audit events:
  - `auth.account_type_locked` (fires once per uid, on the doc write)
  - `auth.account_type_lock_attempt_blocked` (fires when a user with
    a locked doc tries to switch)
  - `auth.account_type_lazy_migrated` (fires on the lazy-migration
    branch — includes the signals that drove the decision)
- Removed Server Actions: `clearAccountType`.
- Changed Server Action: `setAccountType` now returns
  `{ ok: false, error: { kind: 'account-type-locked', ... } }` when
  the requested type differs from the locked value. Callers
  (`SignInGate`, `AccountTypeFallbackModal`) surface this as a copy
  block.
- Changed mutation: `createListingDraft` now throws
  `permission-denied` for commentators. Existing client surfaces
  (`/publicar` wizard) already redirect commentators out before they
  reach the action; the throw is defense in depth.
- Changed mutation: `grantRole(Model)` rejects when the user holds
  `Role.Commentator`, and vice versa. The exception class stays
  `AuthError` with `kind === 'conflicting-role'`.
- New audit rule entry: `users/` prefix added to the Firebase audit's
  `collection-prefix-fence` allowlist alongside `persons/`,
  `listings/`, `verifications/`, etc.
- `firebase-schema.md` and `firebase-governance.md` updated.
- The cookie `biringas:account-type` becomes a **hint**, not an
  **authority**. Documented in inline comments where it is read.

## Why this shape — design alternatives rejected

**Rejected: enforce mutual exclusion in custom claims only (no
Firestore doc).** Custom claims are not queryable from the data
plane — the admin codebase would have to call Firebase Auth's user
export endpoint to discover "who is a commentator". Doc reads are
also the only place to store `chosenAt` / `chosenVia` audit metadata
without inventing a second collection.

**Rejected: a boolean field `isPublisher` on `users/{uid}`.**
Booleans are bistate, and we already have a known third state ("not
yet chosen"). A union type (`'publisher' | 'commentator'`) extends to
future categories cleanly; a bool would require migration if a new
category lands.

**Rejected: keep the cookie as authority + "lock" it server-side
via signed value.** Cookies are still client-side state — every
browser, device, incognito session is a fresh slate. The lock would
have to be in the database anyway, so the cookie is redundant for
authority.

**Rejected: per-route role checks duplicated across mutations.**
We need every mutation to consult the same source. Putting the
check inside `requireAuth` (so any auth-gated mutation
short-circuits commentators when needed) is tempting but wrong —
`submitReview` and `requestBooking` are commentator-allowed actions
and need to coexist. The right level of abstraction is a per-action
gate `requirePublisher()` / `requireCommentator()` that reads the
doc.

**Rejected: lock at the role layer only (mutex in `grantRole`)
without a Firestore doc.** That solves the dual-role bug but leaves
the "no decision yet" state ambiguous. The doc gives us a third
distinguishable state (`null` → must choose) that claims-only cannot
represent without a sentinel value.

**Rejected: allow type changes if no Publisher activity exists.**
Considered: "you can switch to publisher only if you have no
commentator activity, and vice versa." Rejected because it creates
audit ambiguity ("when was this account a commentator?") and shifts
support burden to "I want to switch back" requests. The "create
another account" answer is honest and simpler.

## Security rules (sketch)

```
match /users/{uid} {
  allow read, write: if false;            // Admin SDK only — Server Actions wrap it
}
```

Same posture as every other collection (deny-all client SDK; access
flows through Admin SDK Server Actions only).

## Authority

This ADR establishes `users/{uid}.accountType` as the **sole
authoritative source** for the publisher-vs-commentator distinction.
When this conflicts with ADR-018 § "Account-type cookie on Google
sign-in" (which framed the cookie as the persistence layer), THIS
ADR wins — the cookie is downgraded to a UX hint. When it conflicts
with `src/features/auth/lib/rbac.ts`'s legacy
`ROLE_PROFILE_PUBLISHER` / `ROLE_COMMENT_PUBLISHER` constants, THIS
ADR wins — those constants are UI hints that mirror the doc and
will be deleted in a follow-up sweep once no UI reads them.

All other constitutional layers (ADR-010 data ownership, ADR-009
integration adapters, ADR-018 person-scoped KYC) apply unchanged.
