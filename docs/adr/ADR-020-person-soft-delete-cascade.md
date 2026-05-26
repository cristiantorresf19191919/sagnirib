# ADR-020 · Person soft-delete with cascade

- Status: accepted
- Date: 2026-05-25
- Extends: ADR-010 (Firebase data ownership), ADR-011 (Listing drafts),
  ADR-014 (KYC verification), ADR-018 (Person-scoped KYC + partner
  accounts)

## Context

The mi-cuenta dashboard exposes the `persons/{personId}` rows owned by
the authenticated user (ADR-018). Until now, a person was a one-way
write: created on first publish, never removed. That works for a
modelo individual whose lifecycle starts with a single perfil — but
breaks for two real workflows already on the site today:

1. **Partner accounts** (cuentas con N personas, ADR-018) onboard
   modelos and let go of them; the dashboard accumulates "fantasma"
   perfiles that the owner has no way to clean up.
2. **First-time publishers who change their mind mid-flow.** They
   create a perfil, submit a draft that goes into `pending_review`,
   then realize they don't want to publish. The draft sits in the
   admin queue forever, the perfil sits in the dashboard forever.

The screenshot the user attached (May 2026 dashboard with two perfiles
— `Alejandra` unpublished, `test` with a draft in review) is the
concrete instance of case (2).

A "delete profile" affordance is missing. The non-obvious part is the
**cascade**: a person owns (or co-owns) three other resources, each
under a different port:

- `listing_drafts/{draftId}` via `person.activeDraftId` (biringas
  port, ADR-011).
- `listings/{listingSlug}` via `person.activeListingSlug` (biringas
  port — the public catalog row).
- `verifications/{personId}` (verification port, ADR-014 + ADR-018).
  KYC photos in Storage under `verifications/{personId}/`.

If the person doc disappears without the cascade, those rows become
orphans — the listing keeps serving public traffic, the draft stays in
the admin queue, the KYC doc still holds the (now unowned) ID photos.

## Decision

### Soft-delete the person, hard-delete its KYC, cascade-cancel its draft, refuse on a published listing.

```
deleteMyPerson(personId):
  parsePersonId + requireAuth + ownership check
  if person.activeListingSlug != null:
    auditLog "biringa.person.delete_blocked"
    return { kind: "blocked-published-listing" }
  if person.activeDraftId != null:
    cancelDraftRaw(draftId, ownerUid)   # status → "cancelled"
    setPersonActiveDraftRaw(personId, null)
  deleteVerificationRaw(personId)        # hard-delete the KYC doc
  markPersonDeletedRaw(personId, now)    # set deletedAt
  auditLog "biringa.person.deleted"
  updateTag(personsForOwner) + updateTag(person)
```

#### Why soft-delete the person doc

The audit log records `resource: "person:<id>"` against the person's
lifetime events (create, draft-link, delete). Trust&safety queries
need to resolve that id long after the user deletes the row — e.g.
when investigating a reported listing six months later, knowing that
the draft was attached to a person that was soft-deleted (not a
"never existed" id) is signal. A hard-delete would erase that
backstop. The cost is one extra field on the doc and one in-memory
filter in `listPersonsByOwnerRaw` — at the per-account scale
(`PERSON_LIMITS.maxPersonsPerAccount` ≤ ~50), the saved composite
index isn't worth it. Scale beyond ~50 historical persons per account
adds a `where("deletedAt", "==", null)` clause + composite index.

#### Why hard-delete the KYC doc

KYC docs carry **document numbers** that the platform treats as
unique-per-active-doc (ADR-018 amendment § "Document number
uniqueness"). A soft-deleted KYC would block the same person from
re-submitting under a fresh persons row, which is wrong: the user
chose to wipe their KYC. The verification port already supports
"release-on-reject" semantics for the same reason; "release-on-delete"
is the natural extension.

KYC photos in Storage under `verifications/{personId}/` are NOT
deleted by this flow. A separate sweep job (TODO ADR-020 § "Storage
GC", out of scope for this ADR) reconciles Storage against
Firestore-resident verification docs and deletes orphans.

#### Why cascade-cancel the draft instead of hard-deleting it

Two reasons:

1. **The admin moderation queue.** A `pending_review` draft sits in
   an admin tool we don't own (the sagnirib-admin codebase, see user
   memory). The queue filters by `status` — adding a new
   `cancelled` terminal value is the same shape as the existing
   `rejected` terminal value: the queue stops showing it without a
   data-model change on the admin side.
2. **Audit + replay.** A cancelled draft still answers the question
   "what did this user try to publish?". For T&S investigations
   that's load-bearing.

`findActiveDraftBySlug` already returns false for `rejected` drafts
(the slug is released for re-submission). `cancelled` follows the
same rule — the slug is released so a future person can claim it.

#### Why refuse when a published listing exists

The unpublish flow for a `BiringaListing` does not exist yet:
listings have no `archived`/`status` field, public catalog queries
do not filter, and the public route `/p/{slug}` doesn't know how to
render a 410 Gone. Deleting the person without unpublishing the
listing would leave a public profile pointing at a deleted owner —
worse than blocking the delete with a clear "contactá soporte"
message. The follow-up work to lift this refusal is a separate ADR
(future ADR-0XX: listing unpublish lifecycle).

The refusal is part of the action contract, not a thrown error:
the Server Action returns `{ ok: true, outcome:
"blocked-published-listing" }` so the UI can render a specific
message. The thrown branch is reserved for unexpected failures
(network, Firestore errors, unauthenticated callers).

#### UX: typed-name confirmation

The trash button opens a modal that requires the user to type the
person's `displayName` verbatim before the destructive button
enables. This is the same pattern GitHub uses for repo deletion —
high signal that the action is irreversible. The Server Action layer
is the security boundary; the typed-name check is purely UX (and
the modal is no different from the user calling the action directly
via DevTools).

## Consequences

### Adopted changes

- `PersonRecord.deletedAt: string | null` field added to the public
  shape; `listPersonsByOwnerRaw` filters non-null entries.
- `ListingDraftStatus` union extended with `"cancelled"`. Callers
  that filter by status see it via the existing `coerceStatus`
  helper. `findActiveDraftBySlug` treats it the same as `"rejected"`.
- New adapter functions, all idempotent:
  - `markPersonDeletedRaw(personId, deletedAtIso)`
  - `cancelDraftRaw(draftId, ownerUid)` (transactional ownership
    check inside the txn)
  - `deleteVerificationRaw(personId)`
- `deleteMyPerson(rawPersonId)` exposed from `@/server/persons`.
  Returns a `DeletePersonOutcome` discriminated union.
- `deletePersonAction(personId)` Server Action wraps the barrel and
  returns a typed result.
- `DeleteProfileButton` client component on each `ProfileCard` in
  the dashboard.
- Audit events:
  - `biringa.person.delete_blocked` (active listing branch).
  - `biringa.person.deleted` (success branch). Metadata:
    `cancelledDraftId`, `displayName`.

### Deferred

- Storage GC for orphaned KYC photos under
  `verifications/{personId}/`. Tracked as a follow-up cron job.
- Listing unpublish lifecycle. Requires `archived` field on
  `BiringaListing`, propagation through catalog queries, public route
  410 handling, and sitemap removal. Separate ADR.
- Admin-side surfacing of deleted persons (the sagnirib-admin codebase
  reads `persons/*` directly). Adding a `where("deletedAt", "==", null)`
  filter on its queue is its repo's call.

## Cascade order (for future readers writing similar deletes)

1. **Refuse first.** Check preconditions (`activeListingSlug` here)
   and bail before any mutation. The action contract distinguishes
   "refused" from "thrown".
2. **Mutate side-port resources before the primary.** The draft and
   verification mutations are idempotent — if the person mutation
   fails after them, a retry replays cleanly because we treat
   "already cancelled" and "already deleted" as no-ops.
3. **Soft-delete the primary last.** The order matters only when the
   side-port mutations need the primary's pointers. Here they do:
   `meta.activeDraftId` is read before the person is marked deleted,
   so we keep the read live.
4. **Audit last.** A single `biringa.person.deleted` event captures
   the outcome of the whole cascade. Granular per-step events would
   double-log; the cascade is atomic from the user's perspective.
5. **Cache tags last.** `updateTag` runs in the Server-Action scope;
   firing it before the writes risks a partial revalidate against
   pre-write state.

## References

- ADR-010 § "Mutation contract"
- ADR-011 (Listing drafts collection)
- ADR-014 (KYC verification)
- ADR-018 § "No duplicate listings per person"
- `.claude/rules/firebase-data-ownership.md`
- `docs/architecture/firebase-governance.md` § "Cascading deletes"
