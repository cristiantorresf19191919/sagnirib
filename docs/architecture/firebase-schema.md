# Firestore schema — Biringa listings

Authoritative shape for the Firestore database that the Firebase adapter
(`src/server/adapters/firebase/biringas/`) reads from. Until this collection
is provisioned, the barrel falls back to the in-memory mock.

## Collections

```
listings/{listingId}
listings/{listingId}/reviews/{reviewId}
listing_drafts/{draftId}            # see ADR-011
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

### `reputation` map

```
{
  daysAdvertised: number,
  daysSinceVerification: number,
  storiesRecorded: number,
  score: number,           // 0..5
  totalViews: number,
  daysFeatured: number,
  reviewCount: number
}
```

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

## Composite indexes

Required to satisfy the queries in `src/server/adapters/firebase/biringas/index.ts`:

| Collection | Fields                                                              | Used by                                |
| ---------- | ------------------------------------------------------------------- | -------------------------------------- |
| `listings` | `category ASC`, `updatedAt DESC`                                    | `listAll` with category filter.        |
| `listings` | `city ASC`, `updatedAt DESC`                                        | `listAll` with city filter.            |
| `listings` | `verified ASC`, `updatedAt DESC`                                    | `listAll` with verifiedOnly.           |
| `listings` | `verified ASC`, `availableNow ASC`, `updatedAt DESC`                | `listHeroMosaic` (live).               |
| `listings` | `verified ASC`, `reputation.score ASC`, `reputation.daysFeatured DESC` | `listFeatured`.                     |
| `listings` | `slug ASC`                                                          | `findBySlug` (single-field, automatic).|

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
