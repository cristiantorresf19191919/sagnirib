# ADR-011 · `listing_drafts` collection

- Status: accepted
- Date: 2026-05-12
- Extends: ADR-010 (Firebase data ownership)

## Context

The `/publicar` wizard collects details, description, and a chosen plan, then
submits. Until now the submit was a `setTimeout` stub. To make the MVP loop
demonstrable end-to-end we need to persist that submission somewhere.

Two shapes were considered:

1. Write into the existing `listings/` collection with a new `status` field
   (`pending_review | approved | rejected`). All public read paths would have
   to filter `status === 'approved'`.
2. Write into a separate `listing_drafts/` collection. The public catalog
   keeps reading from `listings/` unchanged. An admin (or future Cloud
   Function) moves an approved draft into `listings/`.

Option 1 forces every read path and every composite index to learn about
`status`. The catalog today has six composite indexes; under option 1 each
gains a `status ASC` prefix, and any existing seeded listing without
`status` disappears from results. Backfilling is possible but adds a
migration story to a release that has none.

Option 2 isolates moderation from production reads. The cost is one extra
collection and an "approve" operation (manual for MVP, automated later).

## Decision

Introduce `listing_drafts/{draftId}` as a separate top-level collection. The
catalog's `listings/` collection remains the **published, public** shape
described in `docs/architecture/firebase-schema.md`. Drafts never appear in
catalog reads.

### Shape (summary — full schema in `firebase-schema.md`)

```
listing_drafts/{draftId}
  ownerUid: string              // Firebase Auth uid of the submitter
  status: 'pending_review'      // only state at write time; admin tooling flips it
  payload: { … }                // the wizard EnrollmentDraft, normalized
  submittedAt: Timestamp
  createdAt: Timestamp          // serverTimestamp for audit reconciliation
```

`{draftId}` is an opaque Firestore-generated id. Multiple drafts per
`ownerUid` are allowed — a modelo who is rejected can resubmit; an existing
modelo can publish a second profile. Deduplication / rate-limiting per uid
belongs to a future review-queue Cloud Function, not to this collection's
shape.

### Lifecycle

1. Authenticated user POSTs from `/publicar` (Server Action).
2. Adapter writes the draft. No row appears in `listings/`.
3. Out-of-band: admin (today via Firestore console, tomorrow via an `/admin/drafts` UI) reviews and either:
   - Approves → copies the relevant fields into a new `listings/{id}` doc and updates `status` on the draft to `'approved'` (or deletes the draft).
   - Rejects → updates `status` to `'rejected'` with a reason note.

The admin tooling itself is **out of scope for MVP**. Approval is manual.

### Role grant

On the first successful draft write, the user's Firebase Auth custom claims
gain `'model'` in `roles`. Subsequent drafts do not re-grant (idempotent
merge). Granting on draft submission (not on approval) lets the user see a
future "Mis publicaciones" surface even before approval; gating "approved
content visibility" is a separate read concern on the listing doc, not on the
user role.

### Why not subcollection under users?

`users/{uid}/drafts/{id}` would couple draft discovery to user discovery —
admin queues want to list "all pending drafts across users" cheaply, which
a top-level collection makes a single query and a subcollection makes a
collection-group query plus an extra index. No upside, two downsides.

## Consequences

- One new top-level collection. No change to existing `listings/` reads or
  indexes.
- New audit event: `biringa.draft.submitted`.
- New Firebase Auth custom claim: `roles: ['model']` (additive merge).
- The audit script (`pnpm firebase:audit`) already allows the new collection
  string in `src/server/adapters/firebase/biringas/**` (rule 8 is path-based,
  not name-based).
- The barrel `@/server/biringas` gains `createListingDraft(input)` with the
  standard mutation contract (validate → requireAuth → adapter call → audit
  → role-grant → cache invalidation).
- The wizard's `submit()` no longer simulates; it calls the Server Action and
  uses the existing `submitted` success screen.
- Photo upload is **deferred** to a follow-up (PR2b — Firebase Storage adapter).
  For MVP the draft's `payload.gallery` is `string[]` of arbitrary names; the
  admin attaches photos at approval time, or the modelo re-edits later. The
  wizard's "at least one photo" validation is relaxed to "optional".

## Indexes

None required for the write path. The admin queue will eventually want:

| Collection       | Fields                              | Used by              |
| ---------------- | ----------------------------------- | -------------------- |
| `listing_drafts` | `status ASC`, `submittedAt DESC`    | admin queue          |
| `listing_drafts` | `ownerUid ASC`, `submittedAt DESC`  | "mis publicaciones"  |

These are filed here for the day admin tooling lands. Firestore prompts at
first run with a console URL — apply when needed.

## Security rules (sketch)

```
match /listing_drafts/{id} {
  allow read: if false;           // Admin SDK only
  allow write: if false;          // Admin SDK only — Server Actions wrap it
}
```

Same posture as `listings/`: all reads and writes flow through the adapter
behind a Server Action. Direct client SDK access is forbidden.
