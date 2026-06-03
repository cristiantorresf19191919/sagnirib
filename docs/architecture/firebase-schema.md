# Firestore schema — Biringa listings

Authoritative shape for the Firestore database that the Firebase adapter
(`src/server/adapters/firebase/biringas/`) reads from. Until this collection
is provisioned, the barrel falls back to the in-memory mock.

## Collections

```
listings/{listingId}
listings/{listingId}/reviews/{reviewId}
listing_drafts/{draftId}                       # see ADR-011
favorites/{uid}/items/{listingId}              # see ADR-013
persons/{personId}                             # see ADR-018 (supersedes ADR-014's verifications/{uid})
users/{uid}                                    # see ADR-019 (account-type lock — publisher vs commentator)
verifications/{uid}                            # KYC physical storage during ADR-018 Phase A. Logical view via `persons/{personId}.kyc`. Carries `documentType` + `documentNumber` (ADR-018 amendment) which enforce per-person uniqueness across accounts.
```

`{listingId}` is an opaque Firestore-generated id. The user-facing slug is
stored as a field with an equality index, not as the document id, so slugs
can change without doc rewrites.

## Document shape — `listings/{listingId}`

| Field             | Type                       | Notes                                                     |
| ----------------- | -------------------------- | --------------------------------------------------------- |
| `slug`            | string                     | Unique. Indexed for `findBySlug`.                         |
| `name`            | string                     |                                                           |
| `age`             | number                     |                                                           |
| `city`            | string                     | Equality filter.                                          |
| `neighborhood`    | string \| null             | Optional.                                                 |
| `pricePerHour`    | number                     | Range filter (one inequality per query).                  |
| `mainImage`       | string                     |                                                           |
| `gallery`         | array&lt;string&gt;        |                                                           |
| `verified`        | boolean                    | Equality filter.                                          |
| `hasVideo`        | boolean                    |                                                           |
| `hasAudio`        | boolean                    |                                                           |
| `tags`            | array&lt;string&gt;        | Memory-filtered (free-text-like).                         |
| `bio`             | string                     |                                                           |
| `shortBio`        | string                     |                                                           |
| `category`        | string                     | `prepagos | masajes | videollamadas`. Equality filter.    |
| `sex`             | string                     | `mujeres | hombres | travestis`.                          |
| `attention`       | array&lt;string&gt;        | Memory-filtered.                                          |
| `contactChannels` | array&lt;string&gt;        | Memory-filtered.                                          |
| `paymentByCard`   | boolean                    |                                                           |
| `faceVisible`     | boolean                    |                                                           |
| `availableNow`    | boolean                    | Equality filter.                                          |
| `storyAt`         | Timestamp \| null          | Most recent story.                                        |
| `privatePhone`    | string \| null             | NEVER mapped through the public read path.                |
| `privateWhatsapp` | string \| null             | NEVER mapped through the public read path.                |
| `reputation`      | map (see below)            |                                                           |
| `attributes`      | map (see below)            |                                                           |
| `services`        | array&lt;string&gt;        |                                                           |
| `specialServices` | array&lt;string&gt;        |                                                           |
| `meetingContexts` | array&lt;string&gt;        |                                                           |
| `coords`          | `{ lat: number, lng: number }` |                                                       |
| `createdAt`       | Timestamp                  |                                                           |
| `updatedAt`       | Timestamp                  | Default `orderBy` for `listAll`.                          |
| `verifiedAt`      | Timestamp \| null          | Set when `verified` flips to `true`. Mapper falls back to `createdAt` when missing on a verified listing. |
| `personId`        | string \| null             | Person (modelo física) this listing represents (ADR-018). Null on legacy listings auto-migrated lazily on first owner login. Indexed for `listListingsByPerson`. |
| `plan`            | map \| null                | Active paid plan. Drives the "Destacada" badge and `listFeatured`. See § "`plan` map". |
| `videos`          | array\<map\> \| null       | Short-form clips (ADR-015). At most `STORAGE_LIMITS.videoMaxPerListing` (today: 2). See § "`videos` array". |

### `reputation` map

```
{
  daysAdvertised: number,           // ignored by the mapper — derived from createdAt at read time
  daysSinceVerification: number,    // ignored by the mapper — derived from verifiedAt ?? createdAt at read time
  storiesRecorded: number,
  score: number,                    // 0..5
  totalViews: number,               // incremented by recordListingViewRaw
  daysFeatured: number,
  reviewCount: number
}
```

`daysAdvertised` and `daysSinceVerification` are kept on the doc only for
admin-tool convenience — the public `findBySlug` / `listAll` paths recompute
them on every read so the profile tiles never go stale.

`totalViews` is incremented by `recordListingViewRaw` (one write per visitor
per listing per 24h — dedupe lives in the action wrapper).

### `plan` map (optional — `undefined` = free tier)

```
{
  tier: 'boost' | 'elite',            // matches PlanTier in checkout-types.ts
  activeUntil: Timestamp              // plan stops counting as active at this moment
}
```

Set by the payment flow when a checkout session reaches `succeeded`
(today the flow is `completeMockCheckout`; webhooks from Stripe /
MercadoPago later). Cleared by a scheduled job once `activeUntil` is in
the past, or by the read-time `isPlanActive()` helper which treats an
expired plan as absent.

Read-time predicate lives in `src/server/biringas/plan-status.ts` —
`isPlanActive(listing)` and `activePlanTier(listing)`. Catalog
surfaces and queries (`listFeatured`, the "Destacada" badge in
`CatalogGrid`) consume the helper exclusively; call sites must NOT
inline the date comparison.

### `videos` array (optional — `undefined` = no clips)

```
[
  {
    path: string,             // canonical bucket path, e.g.
                              //   listings/<slug>/videos/<id>.mp4
    durationSeconds: number   // client-reported, validated 3..30 at submit
  },
  …
]
```

Set when an `approved` draft was created with one or two clips (ADR-015).
The wizard uploads each clip to staging, the submit Server Action copies
to the draft prefix, and the admin promotion (Fase 2) copies again into
`listings/{slug}/videos/...`.

`hasVideo` (top-level boolean) MUST stay in sync with `videos.length > 0`
so the catalog's `withVideo` equality filter works on the cheap. The
write path is the place that bridges them; mappers never derive one from
the other (the boolean is the authority for queries, the array is the
authority for rendering).

Reading: `resolveAssetUrl(video.path)` (in
`src/features/biringas/lib/asset-url.ts`) handles the mock-vs-prod URL
construction. Surfaces consume `VideoPlayer` from
`src/features/biringas/components/VideoPlayer.tsx` — never reach into the
storage adapter directly.

### `attributes` map (all optional)

```
{
  ethnicity?: string,
  hair?: string,
  height?: string,
  body?: string,
  breast?: string,
  pubis?: string,
  country?: string,
  languages?: array<string>
}
```

## Subcollection — `listings/{listingId}/reviews/{reviewId}`

| Field        | Type      | Notes                              |
| ------------ | --------- | ---------------------------------- |
| `alias`      | string    | Display alias (no PII).            |
| `city`       | string    |                                    |
| `date`       | Timestamp | `orderBy('date', 'desc')`.         |
| `rating`     | number    | 1..5 integer.                      |
| `body`       | string    |                                    |
| `helpful`    | number    | Default 0.                         |
| `notHelpful` | number    | Default 0.                         |
| `verified`   | boolean   | True if author authenticated.      |

The adapter computes the review aggregate (distribution / breakdown / counts)
on the fly from the subcollection. When read volume justifies it, replace
with a Cloud Function-maintained `listings/{id}/aggregates/reviews` doc and
use `mapReviewsAggregate` from the mapper.

The home-page testimonials section reads from this same subcollection via
a **collection-group** query (`listTestimonials` in
`src/server/adapters/firebase/biringas/testimonials.ts`). Selection rules:
`verified == true`, `rating >= 4`, body length in `[40, 200]`, one quote
per parent listing, newest-first. Cache-tagged `biringa:listings` so the
home auto-refreshes whenever `submitReview` invalidates the tag. The
collection-group index for the query is registered in
`firestore.indexes.json` (`reviews`, `verified ASC, date DESC`).

## Collection — `listing_drafts/{draftId}`

Write-only from the `/publicar` wizard. Public catalog reads never touch
this collection. See ADR-011 for the lifecycle and the moderation flow.

| Field         | Type        | Notes                                                |
| ------------- | ----------- | ---------------------------------------------------- |
| `ownerUid`    | string      | Firebase Auth uid of the submitter. Indexed for queue per-user. |
| `personId`    | string      | Person (modelo física) this draft is for (ADR-018). Required on new drafts; auto-backfilled on legacy drafts via Phase A migration. Indexed. |
| `status`      | string      | `pending_review` at write time. Admin tooling flips to `approved` / `rejected`. |
| `payload`     | map         | The wizard `EnrollmentDraft`, normalized — see below. |
| `submittedAt` | Timestamp   | Client-supplied; `orderBy('submittedAt', 'desc')` for queues. |
| `createdAt`   | Timestamp   | `serverTimestamp()` — for audit reconciliation.       |

`payload` mirrors the wizard's `EnrollmentDraft` shape (see
`src/features/enrollment/lib/types.ts`):

```
{
  details: {
    displayName, age, city, category, phone, preferredSlug, pricePerHour,
    attention: string[], contactChannels: string[]
  },
  description: {
    shortBio, bio, services: string[], meetingContexts: string[],
    faceVisible, paymentByCard, availableNow, gallery: string[]
  },
  publish: {
    packageId, addOnIds: string[], billing,
    acceptsTerms, acceptsAdult
  }
}
```

Notes:

- `phone` lives **inside** the draft on purpose — it is the modelo's private
  contact for verification. When the draft is approved into `listings/` it
  moves to the sensitive `privatePhone` field and never enters the public
  read path.
- `gallery` is `string[]` of placeholders in MVP. Real photo upload (Firebase
  Storage) lands in PR2b and replaces these with public storage URLs.
- The draft is **not** mapped to `BiringaListing` — the wizard payload and
  the published listing have different fields, and approval is a transform,
  not a copy.

## Collection — `favorites/{uid}/items/{listingId}`

Per-user shortlist persisted across devices for signed-in visitors. The
parent `favorites/{uid}` document is empty — it is created lazily as a
side effect of writing the first item and is never read directly. See
ADR-013 for the lifecycle (anonymous → signed-in merge, optimistic
client updates, audit + cache semantics).

| Field         | Type      | Notes                                                                  |
| ------------- | --------- | ---------------------------------------------------------------------- |
| `listingId`   | string    | == document id. Opaque Firestore listing id; survives slug renames.    |
| `listingSlug` | string    | Snapshot at add time. Used for display fallback when the listing is gone. |
| `addedAt`     | Timestamp | `serverTimestamp()` — orders the user's shortlist newest-first.        |

No composite indexes required. The read path is
`favorites/{uid}/items.orderBy('addedAt', 'desc')`, satisfied by the
implicit document-creation index.

## Collection — `persons/{personId}`

Physical models that an account owner administers. One account owner
(`ownerUid`) has 1 person (modelo individual) or N persons (partner /
agencia). Each person has at most one active draft AND one published
listing — the 1:1 person↔listing rule from ADR-018 is enforced by
`createListingDraft` before write.

| Field                | Type              | Notes                                                                 |
| -------------------- | ----------------- | --------------------------------------------------------------------- |
| `id`                 | string            | == document id. Opaque Firestore-generated id; survives name renames. |
| `ownerUid`           | string            | Account that administers this person. Indexed for `listPersonsByOwner`. |
| `displayName`        | string            | Dashboard label, 3..64 chars.                                          |
| `kyc.status`         | string            | `not_submitted \| pending_review \| approved \| rejected`. Replaces ADR-014's per-uid status. |
| `kyc.documentFrontPath` | string \| null | `persons/{personId}/document_front.<ext>`.                             |
| `kyc.documentBackPath`  | string \| null | `persons/{personId}/document_back.<ext>`.                              |
| `kyc.selfiePath`     | string \| null    | `persons/{personId}/selfie.<ext>`.                                     |
| `kyc.submittedAt`    | Timestamp \| null | Last submit time. Present iff status ≠ `not_submitted`.                |
| `kyc.createdAt`      | Timestamp \| null | First-ever submit for this person. Set once.                           |
| `kyc.approvedAt`     | Timestamp \| null | Present iff status = `approved`.                                       |
| `kyc.approvedByUid`  | string \| null    | Founder uid that approved (admin codebase writes this).                |
| `kyc.rejectedAt`     | Timestamp \| null | Present iff status = `rejected`.                                       |
| `kyc.rejectedByUid`  | string \| null    | Founder uid that rejected.                                             |
| `kyc.rejectionReason`| string \| null    | 3..500 chars; surfaces on the dashboard KYC card.                      |
| `activeDraftId`      | string \| null    | Current draft owned by this person. Enforces 1:1.                      |
| `activeListingSlug`  | string \| null    | Current published listing slug for this person.                        |
| `createdAt`          | Timestamp         | `serverTimestamp()` at person creation.                                |

The nested `kyc` map keeps the dashboard a single read per person (no
join). Resubmission overwrites — historical attempts live in the audit
log (`biringa.person.kyc.submitted` events keyed by `resource:
person:{personId}`).

## Collection — `users/{uid}`

Account-type lock per Firebase Auth user (ADR-019). Exactly one doc per
uid. Doc id mirrors `request.auth.uid` so the read is always
`.doc(uid).get()` — zero query cost. The `accountType` field is
**immutable** after first write; no Server Action ever overwrites it.
To switch journeys, the user creates a new account with a different
email.

This collection supersedes the cookie-as-authority model that
ADR-018 § "Account-type cookie on Google sign-in" introduced. The
cookie continues to exist as a UX hint but the doc is the source of
truth for every gate (`createListingDraft`, `/publicar` redirect,
`/mi-cuenta` router, `Header` CTA visibility).

| Field                    | Type                                                       | Notes                                                                 |
| ------------------------ | ---------------------------------------------------------- | --------------------------------------------------------------------- |
| `uid`                    | string                                                     | == document id, mirrored for convenience.                             |
| `accountType`            | `'publisher' \| 'commentator'`                             | **Immutable** after first write. The single source of truth for the publisher-vs-commentator distinction. |
| `email`                  | string \| null                                             | Snapshot at lock time; not the source of truth for the current email. |
| `accountTypeChosenAt`    | Timestamp                                                  | `serverTimestamp()` at the first (and only) write.                    |
| `accountTypeChosenVia`   | `'pre-oauth' \| 'post-oauth-modal' \| 'lazy-migration'`    | Audit marker for which funnel produced the lock.                       |
| `createdAt`              | Timestamp                                                  | Equals `accountTypeChosenAt` today; kept distinct so future per-uid fields don't have to add a parallel created timestamp. |

The write happens via the `setAccountTypeOnceRaw` adapter, which uses
a Firestore **transaction** to read-then-write atomically. Two
parallel requests cannot both observe the doc as missing — the
loser's call returns `{ kind: 'locked-different' }` or
`{ kind: 'noop-same' }` depending on what won.

No composite indexes required (all reads are `.doc(uid).get()`).

## Composite indexes

Required to satisfy the queries in `src/server/adapters/firebase/biringas/index.ts`:

| Collection | Fields                                                              | Used by                                |
| ---------- | ------------------------------------------------------------------- | -------------------------------------- |
| `listings` | `category ASC`, `updatedAt DESC`                                    | `listAll` with category filter.        |
| `listings` | `city ASC`, `updatedAt DESC`                                        | `listAll` with city filter.            |
| `listings` | `verified ASC`, `updatedAt DESC`                                    | `listAll` with verifiedOnly.           |
| `listings` | `verified ASC`, `availableNow ASC`, `updatedAt DESC`                | `listHeroMosaic` (live).               |
| `listings` | `plan.activeUntil ASC`                                              | `listFeatured` (single-field, automatic). |
| `listings` | `slug ASC`                                                          | `findBySlug` (single-field, automatic).|
| `listings` | — (equality-only `count()`)                                        | `getCatalogStats` — `verified ==` and `verified == && city ==`; equality-only aggregations merge single-field indexes, no composite index. |
| `reviews` (group) | `verified ASC`, `date DESC`                                  | `listTestimonials` (home cross-listing feed). |
| `persons`  | `ownerUid ASC`, `createdAt DESC`                                    | `listPersonsByOwner` (dashboard, ADR-018). |
| `persons`  | `kyc.status ASC`, `kyc.submittedAt DESC`                            | admin-codebase KYC queue (future, ADR-018). |
| `listing_drafts` | `personId ASC`, `submittedAt DESC`                            | "drafts for this person" (ADR-018).    |
| `listings` | `personId ASC`, `updatedAt DESC`                                    | "listings for this person" (ADR-018).  |
| `verifications` | `documentType ASC`, `documentNumber ASC`, `status ASC`         | `findActiveKycByDocumentNumber` — uniqueness check at KYC submit (ADR-018 amendment). |

Firestore prompts for any missing index at first run with a console URL — apply when they appear. Add new entries here as queries grow.

## Sensitive fields policy

`privatePhone` and `privateWhatsapp` are stored on the listing document but
**never** flow through the public read path:

- `mapListing` does not copy them.
- They will be served from a separate authenticated path
  (`getPrivateContact(slug)`) introduced in PR 2 alongside Firebase Auth.

This mirrors Addendum 001 §15 and the comment in `types.ts`.

## Security rules (sketch)

When the project is provisioned, adopt:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /listings/{id} {
      allow read: if false;                  // Admin SDK only
      allow write: if false;                 // Admin SDK only
      match /reviews/{rid} {
        allow read: if false;                // Admin SDK only
        allow write: if false;
      }
    }
  }
}
```

The Admin SDK bypasses these rules. Direct client-SDK access is forbidden;
all reads and writes flow through the adapter / Server Actions.
