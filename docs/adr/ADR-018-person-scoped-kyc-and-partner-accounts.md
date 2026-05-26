# ADR-018 · Person-scoped KYC + partner accounts (N modelos por cuenta)

- Status: accepted
- Date: 2026-05-25
- Extends: ADR-010 (Firebase data ownership), ADR-011 (listing_drafts),
  ADR-012 (Storage adapter), ADR-013 (admin promotion contract),
  ADR-014 (KYC verification basic)
- Supersedes (in part): ADR-014's "one verification per uid" decision —
  the verification doc moves from `verifications/{uid}` to
  `persons/{personId}` (see § Migration).

## Context

ADR-014 anchored KYC to the Firebase Auth user (`verifications/{uid}`,
one doc per account). That was correct for the launch shape where every
account managed exactly one model and the modelo *was* the account
owner.

Two production observations broke that assumption:

1. **The KYC card on `/mi-cuenta` shows "Identidad verificada" for a
   brand-new modelo as soon as the account has ANY approved
   verification.** Reproducible: an account that approved one modelo
   starts publishing a second one and the wizard reports "ya estás
   verificada" before the second modelo has uploaded a single document.
   This is the ADR-014 design surfacing — the verification is per-uid,
   not per-modelo.
2. **The product is moving toward "1 cuenta = N modelos".** Two
   shapes coexist:
   - **Modelo individual** — one human, one account, one listing
     (today's shape).
   - **Partner / agencia** — one account owner who manages N modelos,
     each a distinct physical person, each with her own listing.

Both observations point at the same fix: the unit of KYC is the
**person** (the physical modelo whose identity the platform vouches
for), not the **account** (the login that administers her listing).

A third constraint, surfaced during the requirements review:

3. **No duplicate listings per person.** A person may *edit* or *renew*
   her listing, but cannot have two parallel listings — that would be
   spam-shaped. Person ↔ listing is **1:1** (a person has at most one
   active listing).

## Decision

Introduce a new top-level collection `persons/{personId}` that owns the
modelo's KYC and links 1:1 to her listing. The Firebase Auth user
becomes the **account owner**; it may own 1 person (modelo individual)
or N persons (partner / agencia).

The existing `Role.Model` covers both shapes — it means "this account
can publish models", not "this account *is* a model". No new role is
introduced. The legacy `ACCOUNT_TYPE_PUBLISHER` cookie label is
relabeled in copy as "Partner" but its value (`"publisher"`) and its
role mapping (→ `Role.Model`) stay the same.

### Firestore — `persons/{personId}`

One document per physical modelo. `{personId}` is an opaque
Firestore-generated id; it survives display-name renames.

```
persons/{personId}
  id: string                              // == doc id, mirrored for convenience
  ownerUid: string                        // account that administers this person
  displayName: string                     // label for the dashboard (3..64 chars)
  kyc: {
    status: 'not_submitted' | 'pending_review' | 'approved' | 'rejected'
    documentType?: 'CC' | 'CE' | 'PASSPORT' // identity document kind — see § "Document number uniqueness"
    documentNumber?: string               // normalized identity number — globally unique across persons/{*}
    documentFrontPath?: string            // persons/{personId}/document_front.<ext>
    documentBackPath?: string             // persons/{personId}/document_back.<ext>
    selfiePath?: string                   // persons/{personId}/selfie.<ext>
    submittedAt?: Timestamp
    createdAt?: Timestamp                 // first-ever KYC submit for this person
    approvedAt?: Timestamp
    approvedByUid?: string                // founder uid that approved
    rejectedAt?: Timestamp
    rejectedByUid?: string
    rejectionReason?: string              // 3..500 chars, surfaces to dashboard
  }
  activeDraftId?: string | null           // current draft owned by this person
  activeListingSlug?: string | null       // current published listing slug
  createdAt: Timestamp                    // serverTimestamp at person creation
```

**Why nested `kyc` map (not a subcollection / separate top-level)?**
Two reasons. One: the read is always "give me person X with her KYC
status" — one `.doc()` get, zero joins, zero indexes. Two: ADR-014
already proved this shape works (overwrite on resubmit, history in
audit log). Subcollection would buy us per-attempt history at the cost
of an extra read on every dashboard render; we are not ready to spend
that read.

**Why both `activeDraftId` AND `activeListingSlug`?** A person's
lifecycle is `draft → approved → published`. After approval the draft
record stays (history, edit flow), the listing exists, and both refer
back to the same person. The two fields let the dashboard render
without joining drafts and listings on each load. They are kept in
sync by the same Server Action that flips the lifecycle.

### Document number uniqueness (CC / CE / Pasaporte)

The KYC payload captures **structured identity** in addition to the
document images:

```
documentType:   'CC' | 'CE' | 'PASSPORT'
documentNumber: string   // normalized: uppercase, trim, no spaces / dashes / dots
```

**Physical storage during Phase A.** The two fields live on
`verifications/{personId}.documentType` + `.documentNumber` (the same
doc where image paths already live, since `personId === uid` for
lazy-migrated accounts). The `persons/{personId}.kyc` map in this ADR
is the **logical view** — the denormalized read; the underlying
write goes to `verifications/`. When Phase B ships in the admin
codebase (moving KYC out of `verifications/` into `persons/`), the
fields move with the rest of the map. The uniqueness query and
composite index live on the `verifications` collection until that
cutover.

The pair `(documentType, documentNumber)` is **globally unique across
all KYC submissions** (every account, every modelo) regardless of
which physical collection owns it. This provides the structural
answer to "is this the same physical person trying to publish a
second time?" — a question the platform could not answer when KYC
stored only image blobs.

**Two use cases, one rule:**

1. **Same account, second persona, same cedula.** Partner already has
   a persona "María" with CC 1234567, submits KYC for "Sofía" with the
   same CC 1234567 → rejected. (Either an honest dedupe attempt or an
   attempt to game the 1:1 person↔listing rule.)
2. **Different account, same cedula.** A modelo whose verification was
   rejected on account A creates account B and resubmits the same CC →
   rejected. (Closes the "abandon and re-register" loophole.)

**Collision policy: auto-reject.** If the submit Server Action finds
ANY other `persons/{*}` with the same `(documentType, documentNumber)`
pair and a non-`rejected` KYC status, the submit is refused with
`error.kind === 'duplicate-document-number'`. The UI surfaces a static
copy "Ese documento ya está registrado. Si crees que es un error,
contactá soporte." There is no automatic transfer flow; a legitimate
case (modelo cambió de agencia) is handled by support manually
re-keying the existing person to the new ownerUid.

Rejected KYC submissions DO release the number — a person rejected on
account A can re-submit on account A (or be re-keyed by support to
account B). This avoids permanently locking a real human's identity
because of a one-time bad photo.

**Normalization at write time.** Both fields are normalized before
the uniqueness query and before storage so that `123.456.789`,
`123 456 789`, and `123456789` collide:

- `documentNumber`: uppercase + remove every char that is not
  alphanumeric (covers dots/dashes/spaces — passports are
  alphanumeric, CC/CE are numeric).
- `documentType`: validated against the literal union; any other
  value is rejected at the schema layer.

**Why store in clear, not hashed?** The admin codebase reads the
number when manually approving / rejecting (it must match the photo
of the document). A hash makes the admin's job impossible. The
collection is Admin-SDK-only (deny-all rules) so the number never
leaves the server.

**The uniqueness query.** A composite index on
`(kyc.documentType ASC, kyc.documentNumber ASC, kyc.status ASC)` —
the third field lets the query exclude `rejected` rows cheaply (the
release-on-reject rule above). The query is one `.where().where().where().limit(1).get()`
per submit — O(1) cost.

**What about a person submitting WITHOUT a document number?**
Possible during the lazy-migration path (legacy
`verifications/{uid}` docs predate the field). Those persons have
`documentType` / `documentNumber` undefined. The uniqueness check
skips them (no row to collide with). When that person re-submits KYC
in MAIN, the wizard requires the number — the field becomes mandatory
in the schema; only the lazy-migrated rows are grandfathered until
their next submit.

### Firestore — `listing_drafts/{draftId}` gains `personId`

```
listing_drafts/{draftId}
  ownerUid: string                        // unchanged — account owner
  personId: string                        // NEW — required, denormalized for queries
  status: 'pending_review' | 'approved' | 'rejected'
  payload: { … }
  submittedAt: Timestamp
  createdAt: Timestamp
```

Required on every new draft. Validated by `createListingDraft` against
`persons/{personId}.ownerUid === caller.uid` (ownership) AND
`persons/{personId}.activeDraftId === null OR refers to this draft`
(uniqueness — a person has at most one in-flight draft).

### Firestore — `listings/{listingId}` gains `personId`

Same field, set when the admin promotes a draft. Indexed for the
"list listings owned by this person" query.

### Storage — `persons/{personId}/`

KYC blobs move out of the `verifications/{uid}/` prefix into a
per-person prefix:

```
persons/{personId}/document_front.{jpg|webp}
persons/{personId}/document_back.{jpg|webp}
persons/{personId}/selfie.{jpg|webp}
```

The `signKycUploadUrl` Server Action takes `(personId, kind)` and
verifies `persons/{personId}.ownerUid === caller.uid` BEFORE issuing
the signed URL. This is the multi-tenant safety boundary — without it
an attacker could enumerate person IDs and write into another
account's KYC.

The deny-all Storage rule continues to cover the new prefix; the
ADR-014 fence rule (the `verifications/` allowlist) gets a sibling
entry for `persons/`.

### Routes

| Route | Purpose | Auth |
|---|---|---|
| `/verificacion` | Public explainer — minimal change (copy stays general). | Anonymous OK |
| `/verificacion/[personId]` | 3-step wizard scoped to a specific person. | Auth + ownership |
| `/mi-cuenta/personas` | Partner dashboard — list of persons + per-person KYC card + "Crear nueva modelo" CTA. | Auth required |
| `/publicar` | Wizard — now requires choosing which person the listing is for (auto-skipped if account has exactly one person). | Auth required |

The old `/verificacion/enviar` (no `personId`) becomes a redirect to
`/verificacion/{personId}` for the account's default person, or to
`/mi-cuenta/personas` if the account has multiple persons and none has
been picked.

### Approval gate on listings (admin codebase)

The admin's `approveDraft` action loads `persons/{draft.personId}` (not
`verifications/{ownerUid}` anymore) and refuses if
`person.kyc.status !== 'approved'`. The cross-codebase contract:

- `listing_drafts/{draftId}.personId` is the authority for which person
  this listing represents.
- The admin tooling reads `persons/{personId}.kyc.status` to gate
  promotion.
- Backfilling `verified: true` on the listing happens via
  `markListingsVerifiedByPersonRaw(personId)` (the admin-codebase
  equivalent of the existing `markListingsVerifiedByOwnerRaw`, now
  keyed by person).

The admin codebase needs its own change to honor this — that work is
out of scope for this PR and is tracked separately. Until the admin
codebase ships its update, the legacy `verifications/{ownerUid}` doc
remains writable and is mirror-synced (see § Migration).

### `Role.Model` lifecycle (no role enum change)

- `Role.Commentator` — granted on signup/login when the account-type
  cookie is `commentator`. Unchanged.
- `Role.Model` — currently granted on first `createListingDraft`.
  Continues to fire there. NEW: also pre-granted on signup when the
  account-type cookie is `publisher` (so a partner has the role from
  day 1 and the dashboard can render the "Crear modelo" CTA before any
  listing exists).
- No `Role.Partner`. "Partner vs Modelo individual" is a UX
  presentation derived from `persons.length` — 1 person = individual,
  N > 1 = partner. The role enum stays at three values.

### Account-type cookie on Google sign-in

The `biringas:account-type` cookie was previously set only by the
email/password signup form. Google OAuth bypassed it, so
`maybeGrantCommentatorRole` never fired for a Google user (the
underlying bug behind "no puedo distinguir cliente y partner" at
sign-in).

Two surfaces are added to fix that:

1. **Pre-OAuth selector on `/ingresar`** — two cards
   ("Soy cliente" / "Soy partner") that write the cookie *before* the
   user clicks Google. This is the primary UX.
2. **Post-OAuth fallback modal** — if a user returns from Google with
   `roles.length === 0` AND no account-type cookie set, the dashboard
   surfaces a one-time modal asking them to pick. The
   `chooseAccountType` Server Action writes the cookie + grants the
   appropriate role + audits the event.

Both surfaces converge on the same `chooseAccountType(type)` Server
Action so there is one path for role granting (less drift than two
independent code paths).

## Migration plan

The cutover is two-phase to keep the live admin tooling working.

### Phase A — code lands, data lazily migrates

1. Deploy this PR. The `persons` adapter ships; the `verifications`
   adapter stays alive (read-only) so the admin codebase keeps working
   off its old read path until it ships its own update.
2. On first read of `getMyPersons()` for an account that has NO
   `persons/{*}` docs but HAS a legacy `verifications/{uid}` doc,
   auto-create a single default person:
   - `personId` = freshly minted
   - `ownerUid` = uid
   - `displayName` = derived from `listings.name` if a published
     listing exists for the uid, else `session.email.split("@")[0]`,
     else `"Modelo"`
   - `kyc` = copy of the legacy `verifications/{uid}` fields
     (status, paths, timestamps preserved)
   - `activeListingSlug` = the uid's listing slug if exactly one
     `approved` listing exists, else null
   - `activeDraftId` = the uid's pending draft id if exactly one
     `pending_review` draft exists, else null
3. On the same read, every existing `listing_drafts/{id}` and every
   `listings/{listingId}` whose `ownerUid === uid` AND whose
   `personId` field is missing gets `personId` set to the
   newly-created person's id (single batch write).
4. The auto-migration is idempotent — second read sees the person, no
   work happens.

This avoids a synchronous migration script. Accounts that never log in
are never migrated, which is fine — they have no live listings to
break.

### Phase B — admin codebase update + verifications cleanup

After the admin codebase ships its update to read
`persons/{personId}.kyc`:

5. The admin-side migration script (ADR-018b in the admin repo) sweeps
   any remaining `verifications/{uid}` docs whose owners never logged
   into MAIN again, applying the same lazy-migration logic from a
   batch job.
6. Once the admin codebase confirms zero reads against
   `verifications/{uid}` for 30 days, a follow-up PR drops the
   `verification` port from MAIN entirely. The Storage prefix
   `verifications/{uid}/` stays in the deny-all rules forever (defense
   in depth).

## Out of scope (deferred)

- **Multi-listing per person.** A person has 1 listing; "second
  listing on same person" is explicitly forbidden to prevent spam.
  Editing / renewing the existing listing covers the legitimate use
  cases.
- **Moving a listing between persons.** Not supported. To "give" a
  listing to a different person, archive the existing listing and
  publish a new one — the audit log keeps the trail.
- **Soft-deleting a person.** Out of scope. Operational deletes
  (someone leaves the agency) happen out-of-band with an admin run.
  Future ADR if/when this becomes a flow.
- **Per-person Cloud Functions / billing.** All billing remains
  account-scoped (the partner pays one plan that covers her N
  listings, OR each listing carries its own plan — that is a separate
  product decision).
- **Person-level audit timeline UI.** The audit log captures every
  KYC event with `resource: person:{personId}`; a UI to render that
  timeline is a future PR.

## Consequences

- New Firestore collection `persons/`.
- New bucket prefix `persons/{personId}/`.
- New env var: none (reuses existing Firebase config).
- New audit events:
  - `biringa.person.created`
  - `biringa.person.kyc.upload_ticket_requested`
  - `biringa.person.kyc.upload_completed`
  - `biringa.person.kyc.submitted`
  - `biringa.person.kyc.duplicate_document_blocked` — fires when a KYC
    submit is refused due to `(documentType, documentNumber)` collision
    against another non-rejected `persons/{*}`
  - `biringa.person.kyc.approved` (admin codebase)
  - `biringa.person.kyc.rejected` (admin codebase)
  - `auth.role_granted` (existing — now also fires on partner signup
    pre-grant)
  - `auth.account_type_chosen` (new — fires on the post-OAuth modal)
- New role grants: none. Pre-grant of `Role.Model` on partner signup
  uses the existing `grantRole` path.
- New audit rule: `persons/` prefix added to the `bucket-prefix-fence`
  allowlist alongside `verifications/`.
- The admin's `approveDraft` gains a person-keyed verification gate —
  this is a contract change that the admin codebase consumes in its
  own PR.
- `createListingDraft` gains required `personId` input + 1:1
  uniqueness check. Existing client code that called it without
  `personId` will fail validation until updated.
- The dashboard `/mi-cuenta` adds a per-person KYC card.
  `/mi-cuenta/personas` lands as a new route for partner accounts
  (>1 person).
- `/ingresar` lands the pre-OAuth account-type chooser cards.
  `/registrarse` keeps its existing chooser unchanged.

## Why this shape — design alternatives rejected

**Rejected: keep KYC per-account, gate per-listing.** The simpler
patch would be a `listing.kycVerified` boolean set when the listing's
modelo proves identity. Rejected because KYC is fundamentally about a
person's identity, not a publication — the same physical person
publishing twice should not require two rounds of documents.

**Rejected: introduce `Role.Partner`.** The role would mean nothing
the current `Role.Model` does not already cover (both can publish
models). The "partner vs individual" distinction is a UX flavor, not a
permissions tier. Adding a role inflates the enum and forces every
gated code path to think about partner-only behavior that does not
exist.

**Rejected: subcollection `users/{uid}/persons/{personId}`.**
Discoverability cost — the admin codebase wants to list "all persons
pending KYC" cheaply, which a top-level collection makes a single
indexed query and a subcollection makes a collection-group query plus
an extra index. Same trade-off ADR-011 made for `listing_drafts/`.

**Rejected: store KYC in a separate `kyc/{personId}` collection.**
Doubles the doc read on every dashboard render. The nested `kyc` map
on `persons/` keeps the dashboard a single read per person.

## Indexes

Required to satisfy the new queries:

| Collection | Fields | Used by |
| ---------- | ------ | ------- |
| `persons` | `ownerUid ASC`, `createdAt DESC` | `listPersonsByOwner` (dashboard render). |
| `persons` | `kyc.status ASC`, `kyc.submittedAt DESC` | admin codebase KYC queue (future). |
| `verifications` (Phase A) → `persons` (Phase B) | `documentType ASC`, `documentNumber ASC`, `status ASC` | `findActiveKycByDocumentNumber` — uniqueness check at submit. |
| `listing_drafts` | `personId ASC`, `submittedAt DESC` | "drafts for this person" (dashboard). |
| `listings` | `personId ASC`, `updatedAt DESC` | "listings for this person" (admin promote backfill). |

The first index ships with this PR; the others ship when their queries
land (Firestore prompts a console URL on first run, copy into
`firestore.indexes.json`).

## Security rules (sketch)

```
match /persons/{id} {
  allow read, write: if false;            // Admin SDK only — Server Actions wrap it
}
```

Same posture as every other collection (deny-all client SDK; access
flows through Admin SDK Server Actions only).

## Authority

When this ADR conflicts with ADR-014 on "where KYC lives", THIS ADR
wins (it supersedes ADR-014 § "Firestore — `verifications/{uid}`").
When it conflicts with ADR-011 on "drafts have no person link", THIS
ADR wins (it adds `personId` to the draft shape). All other
constitutional layers (ADR-010 data ownership, ADR-012 storage
adapter, ADR-009 integration adapters) apply unchanged.
