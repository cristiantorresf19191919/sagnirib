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
bookings/{bookingId}                           # see ADR-016
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

## Collection — `bookings/{bookingId}`

Buyer-side booking requests + seller responses (ADR-016). Auto-id;
written by `requestBookingRaw`, updated by `updateBookingStatusRaw` and
`attachBuyerReviewRaw`.

| Field              | Type              | Notes                                                   |
| ------------------ | ----------------- | ------------------------------------------------------- |
| `listingSlug`      | string            | Slug of the listing being requested. Equality-indexed.  |
| `requesterUid`     | string            | Firebase Auth uid of the buyer.                          |
| `proposedAt`       | Timestamp         | Buyer's proposed encounter datetime.                    |
| `durationHours`    | number            | `1 \| 2 \| 3 \| 4 \| 8 \| 12 \| 24`.                    |
| `meetingType`      | string            | `outcall \| incall \| videocall`.                       |
| `contactPreference`| string            | `whatsapp \| telegram \| platform`.                     |
| `message`          | string            | Freeform 12..1000 chars; trimmed server-side.           |
| `submittedAt`      | Timestamp         | `serverTimestamp()` at write.                           |
| `respondedAt`      | Timestamp \| null | Set the first time status leaves `pending`.             |
| `status`           | string            | `pending \| confirmed \| declined \| cancelled \| completed`. |
| `buyerReview`      | map \| null       | Seller-to-buyer mutual review. See below.               |

`buyerReview` (optional, attached post-`completed`):

```
{
  rating: 1..5 integer,
  comment?: string,
  submittedAt: Timestamp
}
```

Reads:

- **Inbox** (`listBookingsForListingsRaw`): one or more chunks of
  `where('listingSlug', 'in', [...])` + `orderBy('submittedAt', 'desc')`.
  Sellers with > 30 slugs see one chunk per 30; results merged in
  memory.
- **Reply median** (`computeReplyMedianMinutesForSlug`):
  `where('listingSlug', '==', slug)` +
  `orderBy('respondedAt', 'desc')` + `limit(20)`. The orderBy
  naturally excludes pending bookings (Firestore skips `null` on
  orderBy fields).

Writes always go through the Server Action stack
(`requestBooking`, `respondToBooking`, `submitBuyerReview`,
`completeMockCheckout` for the plan side-effect).

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
| `bookings` | `listingSlug ASC`, `submittedAt DESC`                               | `listBookingsForListingsRaw` (inbox).  |
| `bookings` | `listingSlug ASC`, `respondedAt DESC`                               | `computeReplyMedianMinutesForSlug`.    |
| `reviews` (group) | `verified ASC`, `date DESC`                                  | `listTestimonials` (home cross-listing feed). |

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
