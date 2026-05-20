# ADR-012 · Storage adapter & asset lifecycle

- Status: accepted
- Date: 2026-05-19
- Extends: ADR-009 (integration adapters boundary), ADR-010 (Firebase data
  ownership), ADR-011 (listing_drafts collection)

## Context

ADR-011 deferred photo upload to a follow-up. The wizard today persists a
`payload.description.gallery: string[]` of arbitrary filenames — there is no
storage adapter and the modelo cannot actually attach an image.

Three real-world constraints shape this decision:

1. **Privacy is non-negotiable.** Profile photos may contain EXIF (incl. GPS)
   from a phone camera. Bare-bones upload leaks the modelo's home address.
2. **The bucket cannot be a free-for-all.** Anonymous PUTs to a public bucket
   end in spam / illegal content. The boundary must be policed at write time.
3. **The wizard does not have a `draftId` at upload time.** The draft is
   only persisted on submit. The asset upload happens BEFORE submit, so the
   asset path cannot embed a real `draftId`.

Two upload models were evaluated:

### A — Web SDK direct from the browser
The browser holds the user's Firebase Auth ID token, calls `uploadBytes` on
`firebase/storage`. Storage Rules enforce `request.auth.uid == uid` on the
path prefix.

Pros: simplest client; reused token; resumable uploads out-of-the-box.
Cons:
  - Forces relaxing `.claude/rules/firebase-data-ownership.md` § rule 2
    (Web SDK only in `src/features/auth/lib/**`). Adding `storage` would
    open a new client-side surface the audit no longer guards.
  - Storage Rules are the **only** line of defense. A typo in a rule
    publishes the world's content under our domain.
  - Size / contentType cannot be enforced on the upload itself — rules
    can read `resource.contentType` and `resource.size`, but client SDK
    multi-part uploads have edge cases where rules evaluate on the
    finalized object only.

### B — Server-signed URLs (V4) + Admin SDK
Server Action validates the request, asks Admin SDK to sign a single-use
PUT URL with: path, contentType, byte range, 5-min TTL. Client PUTs the
compressed blob to the signed URL via raw `fetch`.

Pros:
  - The server **decides the path** — the client cannot upload anywhere
    else. Forging a path requires forging Google's V4 signature, which
    requires the service account private key.
  - Size and contentType are **locked in the signature**. A 100MB PUT
    with the wrong contentType returns 403 before any byte is stored.
  - Storage Rules collapse to `allow read, write: if false` for the
    entire bucket — Admin SDK ignores rules. One fewer auditable surface.
  - Boundary rules stay intact: `firebase-admin/storage` lives only in
    `src/server/adapters/firebase/storage/**`. No change to the Web SDK
    boundary.
  - Identical semantics in dev (mock) and prod (Firebase): the mock
    returns a fake `uploadUrl` that the client `fetch`es against an
    in-memory endpoint. The wizard does not know which world it is in.

Cons:
  - One extra round-trip (request ticket, then PUT). Negligible — the
    PUT itself is the heavy step.
  - No native resumable upload. Acceptable: the cap is 4MB per photo
    after client compression; a phone-grade connection finishes in <2s.

## Decision

Adopt **option B — server-signed URLs**.

### Bucket layout

```
users/{ownerUid}/staging/{sessionId}/photos/{photoId}.{jpg|webp}
listing_drafts/{draftId}/photos/{photoId}.{jpg|webp}
listings/{listingSlug}/photos/{photoId}.{jpg|webp}
```

- **`users/{uid}/staging/{sessionId}/…`** holds the working set while the
  wizard is open. `sessionId` is server-generated (UUID v4) and lives only
  inside the wizard's React state, never in a URL.
- **`listing_drafts/{draftId}/…`** is the canonical asset location once
  the draft is persisted. The submit Server Action **copies** blobs from
  staging to draft and rewrites `payload.description.gallery` to the new
  paths. Original staging blobs are deleted in the same step.
- **`listings/{slug}/…`** is the public, served location. Promotion from
  draft to listing (admin tooling, Fase 2 / ADR-013) does another copy.
  Public reads come from `https://firebasestorage.googleapis.com/v0/b/<bucket>/o/listings%2F…`.

Why three locations instead of one? Each step is an authorization
boundary: a leaked staging path cannot impersonate an approved listing;
an approved listing photo cannot be silently swapped by a still-draft
upload. The lifecycle is auditable.

### Lifecycle

| Phase | Trigger | Cleanup |
| ----- | ------- | ------- |
| Staging | Client requests `requestUploadTicket` | Bucket lifecycle rule deletes objects under `users/*/staging/` after 24h |
| Draft | `createListingDraft` succeeds | Held until admin approves or rejects (Fase 2) |
| Listing | Admin promotes draft (Fase 2) | Lifetime of the listing |

The 24h staging lifecycle is set at the **bucket** level (GCS lifecycle
config, not code). This catches all the "started the wizard, never
submitted" cases without requiring a periodic job.

### Compression policy (client)

Photos are compressed before upload using `browser-image-compression`
(MIT, ~25KB gzipped, Canvas + Web Workers):

| Parameter | Value | Rationale |
| --------- | ----- | --------- |
| `maxSizeMB` | 0.5 | ~500KB target post-compression |
| `maxWidthOrHeight` | 2048 | Largest dimension; 4K source down-scaled |
| `useWebWorker` | true | Keeps UI responsive on iPhones |
| `fileType` | `image/jpeg` | Universal browser support |
| `initialQuality` | 0.82 | Visual sweet spot |
| `exifOrientation` | preserved | Rotation correct on iOS portraits |

**EXIF is stripped by default** by `browser-image-compression` when the
canvas re-encodes — GPS / camera serial / timestamp do not reach the
bucket. This is critical for modelo safety.

Server hard cap: 4MB per upload. A photo larger than the cap is rejected
at signature time (the signed URL embeds `X-Goog-Content-Length-Range`).

### Video

Out of scope for Fase 1 (deferred to Fase 1b per founder decision,
2026-05-19). The wizard's video slot is hidden until a transcoding
pipeline lands (Cloud Function with ffmpeg, or Mux / Cloudflare Stream).
Plan copy that promises video (Destacada / Premium) is unaffected —
those packages remain available, the in-wizard video upload simply
isn't there yet.

### Storage Rules

```
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

Deny-all by design. Identical posture to `firestore.rules`. All access
goes through Admin SDK signed URLs, which bypass rules and use IAM
instead. The Storage Rules exist as a belt-and-suspenders guarantee that
even if the Firebase client SDK is accidentally imported in the future
and given the user's auth token, it cannot touch the bucket.

### Cache-Control

Promoted assets in `listings/{slug}/…` get
`Cache-Control: public, max-age=31536000, immutable` at upload time
(set on the object metadata by the promotion adapter). Asset URLs
include a hash of the content so the immutable cache is safe — a new
photo gets a new path. Staging and draft assets get
`Cache-Control: private, max-age=0, no-store` so leaked URLs cannot be
re-served by CDNs.

## Consequences

- New repo files: `storage.rules`, `cors.json`.
- New env var: `FIREBASE_STORAGE_BUCKET` (server-only). Default is
  `<projectId>.appspot.com` for legacy projects, `<projectId>.firebasestorage.app`
  for projects created after Oct 2024. **Operator picks the right one** for
  the project at hand.
- New port: `src/server/storage/` (barrel, types, schema).
- New adapter: `src/server/adapters/firebase/storage/` (Admin SDK only).
- New mock: `src/server/mocks/storage/` (in-memory ticket + blob store
  so `/publicar` works end-to-end without a Firebase project).
- `firebase-admin/storage` is added to the audit's adapter fence — only
  reachable from `src/server/adapters/firebase/storage/**`.
- New audit event surfaces: `biringa.upload.ticket_requested`,
  `biringa.upload.completed`, `biringa.draft.assets_attached`,
  `biringa.draft.assets_orphaned`.
- `ListingDraftPayloadDescription.gallery` changes type from
  `ReadonlyArray<string>` (placeholder names) to
  `ReadonlyArray<{ path: string }>` (real bucket paths). This is a
  breaking change for any future consumer of the draft document — no
  current consumer exists outside the admin queue (still on paper), so
  the migration window is right now.

### Operator setup (one-time, per environment)

A new section in `docs/architecture/firebase-governance.md` § "Scenario
8 — Provisioning the storage bucket" walks through:

1. Enable Cloud Storage for Firebase in the console.
2. Confirm the bucket name and add it to `.env.local`.
3. Deploy storage rules (`pnpm firebase:deploy:storage`).
4. Configure CORS (`gsutil cors set cors.json gs://<bucket>`).
5. Add a bucket lifecycle rule for `users/*/staging/` → delete after 1d.
6. Grant the service account `Storage Object Admin` on the bucket (if
   the service account does not already have `Editor` on the project).

## Out of scope

- Admin queue / draft approval UI (Fase 2 / ADR-013).
- Promotion of draft assets to listing assets (Fase 2 / ADR-013).
- Video upload, transcoding (Fase 1b / future ADR).
- App Check / reCAPTCHA v3 (founder decision 2026-05-19: defer; signed
  URLs are the primary control).
- Image CDN / next/image loader for served assets (separate decision —
  Firebase Hosting CDN suffices until traffic justifies a real CDN).
