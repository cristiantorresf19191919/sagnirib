# ADR-015 · Listing videos (short-form, owner-uploaded)

- Status: accepted
- Date: 2026-05-20
- Extends: ADR-012 (Storage adapter & asset lifecycle), ADR-011 (`listing_drafts`)

## Context

The catalog already advertises a video affordance — every listing has a
`hasVideo: boolean` flag, and `CatalogCard` renders a play overlay when
it is true. But the contract is hollow: there is no `videoUrl` on the
listing, no upload path in the wizard, and no player on the profile.
The icon promises an interaction that does not exist, which erodes
trust on every empty tap.

Founder direction (2026-05-20): each listing may attach **one or two
videos of up to 30 seconds**. The intent is a short, hand-held intro
that complements the photos without turning the listing into a feed.
Long-form video, autoplay carousels, and any form of "stories" are
explicitly out of scope.

## Decision

Reuse the ADR-012 storage architecture. Videos travel through the same
staging → draft → listing lifecycle as photos, the same Server-signed
V4 PUT URL pattern, and the same per-session staging prefix. The only
differences are:

- **New `kind`** on `requestUploadTicket` — `"video"` alongside
  `"photo"`. The schema enforces video MIME + size when the kind is
  `"video"`.
- **New sub-prefix** under each existing path root — `videos/` instead
  of `photos/` — so a single staging session can hold both kinds without
  collision and the audit's hardcoded-prefix rule still passes (the
  prefix roots `users/`, `listing_drafts/`, `listings/` are unchanged).
- **No client-side compression.** Photos use `browser-image-compression`
  (Canvas-based). The browser equivalent for video would require
  FFmpeg.wasm (~30MB bundle weight) and minutes of CPU on mobile. MVP
  accepts the raw recording within the size cap; a future ADR can
  layer a Cloud Function transcode pass on top of this contract
  without changing it.
- **Duration check is client-only.** The wizard reads
  `<video>.duration` after `loadedmetadata` and refuses uploads longer
  than 30 seconds. The server signature cannot enforce duration (V4
  signs path + MIME + byte range, not media content). A Cloud Function
  post-upload validator that deletes overruns is documented as a
  follow-up; it is not required for MVP because there is no incentive
  for a modelo to upload a long video (the player crops to 30 seconds
  anyway).

### Bucket layout

```
users/{ownerUid}/staging/{sessionId}/videos/{videoId}.{mp4|webm}
listing_drafts/{draftId}/videos/{videoId}.{mp4|webm}
listings/{listingSlug}/videos/{videoId}.{mp4|webm}
```

Identical lifecycle to photos (ADR-012 § Lifecycle table). The 24h
staging lifecycle rule already catches the `users/*/staging/` prefix
— no new bucket-level config needed.

### Limits (server-enforced via signed URL byte range)

| Parameter              | Value         | Rationale |
| ---------------------- | ------------- | --------- |
| `videoMaxBytes`        | 35 MB         | ~30s of phone-grade MP4 at 8–10 Mbps. Adds headroom for HEVC variants. |
| `videoMinBytes`        | 50 KB         | Anything smaller is a broken capture. |
| `videoMimes`           | `video/mp4`, `video/webm` | Universal browser support; rejects QuickTime to avoid Safari export edge-cases. |
| `videoMaxDurationSec`  | 30            | Client-checked (see above). Server records the value but cannot enforce. |
| `videoMinDurationSec`  | 3             | Filters accidental 0.5s clips that no one wants to watch. |
| `videoMaxPerListing`   | 2             | Founder cap. Validated by the draft schema; the wizard hides the picker after the second upload. |
| `ticketTtlSeconds`     | 600 (10 min)  | Video uploads are slower than photos over LTE — buys a comfortable retry window. |

### Domain shape

`BiringaListing` gains an optional `videos` field:

```ts
videos?: ReadonlyArray<{
  path: string;           // canonical bucket path
  durationSeconds: number; // 3..30
}>;
```

`ListingDraftPayloadDescription` mirrors the shape — same migration
pattern as `gallery`. The schema enforces `videos.length <= 2` and
each entry's path matches the staging regex at submit time.

### Why store `durationSeconds`

Two reasons:

1. The catalog UI may want to surface "0:18" / "0:24" labels on the
   player thumbnail without hitting metadata (cheap render, no
   `<video>` mount until tap).
2. Server-side audit / abuse triage benefits from knowing the
   client-reported value even when the actual file says something
   different — a discrepancy between client-reported and server-
   computed (via the future Cloud Function) is itself signal.

### Wizard step

Live in the existing **Description** step (StepDescription.tsx), under
the photo grid. Adding a fifth step for two optional fields would over-
weight the wizard. The picker accepts up to 2 files; the third
attempt is rejected client-side.

### Player

HTML5 `<video controls preload="metadata">` with `poster` set to
`listing.mainImage` for the first paint, displayed on `/p/[slug]` in
a small grid below the gallery. No autoplay, no custom controls in
MVP — native controls work on every browser including iOS Safari and
keep us out of the "video player" library churn (Plyr, video.js,
Vidstack).

## Consequences

- One new storage MIME family allowed. The audit rule for hardcoded
  prefixes (firebase rule 9) is unchanged because the new sub-prefix
  `videos/` lives inside the existing roots.
- `STORAGE_ASSET_KINDS` becomes `["photo", "video"]`. Every consumer
  of the kind enum gets a TypeScript compile error until it
  switch-completes — exactly the change we want.
- `BiringaListing.hasVideo` becomes derived (`videos.length > 0`) at
  write time on the listing side. The legacy stored boolean stays in
  the doc shape for query efficiency (`where('hasVideo', '==', true)`
  beats `where('videos', '!=', [])`); we KEEP both in sync, with the
  flag as the authority for filtering.
- One new audit event: `biringa.video.uploaded` (per confirmed video).
  Same shape as `biringa.photo.uploaded`.
- New cache-tag invalidation surface? No — videos are part of the
  listing doc, so the existing `biringa:listing:<slug>` tag covers
  them.
- The wizard's per-photo state machine
  (`queued → compressing → uploading → ready`) is reused for video
  with the compression step swapped for a `validating` (duration
  check) step.

## Indexes

None required. Videos are read inline with the listing doc.

## Security rules

Unchanged from ADR-012. The bucket remains deny-all for the client SDK;
all uploads / reads go through Admin-SDK signed URLs.

## Out of scope

- Transcoding / format normalisation (server-side FFmpeg pass).
- Video thumbnail extraction (using `mainImage` as poster covers MVP).
- HLS / DASH streaming. The 35MB cap fits a single MP4 fetch.
- Watermarking / branded overlay. The cropped first frame from
  `mainImage` does the job at zero infra cost.
- Comments / reactions on videos. Listings have a single review
  surface; the video is a discovery affordance, not a feed.
- Multi-video carousel UI. With max 2 videos a side-by-side grid
  reads better than a swiper.
