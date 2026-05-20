# ADR-014 · KYC verification (basic level)

- Status: accepted
- Date: 2026-05-19
- Extends: ADR-010 (Firebase data ownership), ADR-011 (listing_drafts),
  ADR-012 (Storage adapter), ADR-013 (admin promotion contract)

## Context

The brand promises **verificación humana en 2 capas** (identidad + selfie en
vivo) across the catalog. ADR-011 declared KYC out of scope for the
listing-drafts phase; ADR-013 declared it out of scope for the admin
promotion phase. Now we wire the basic level so the brand promise stops
being a claim and becomes a feature.

Three levels were scoped per the auditoría (2026-05-19):

| Level | What | When |
|---|---|---|
| **Basic** | Modelo uploads `documento (anverso + reverso) + selfie` as files. Founder reviews manually. | **NOW** |
| Intermediate | Adds an admin `/verifications` queue UI (separate from drafts) for batch review + bulk actions. | Future |
| Pro | Provider externo (Veriff / Onfido / Trulioo) automates face-vs-document match. | Future |

Founder direction: do basic, document the upgrade path so intermediate is a
~2-day step (not a rewrite) and pro is just an adapter swap.

## Decision

Add a new top-level collection `verifications/{uid}` and a new bucket
prefix `verifications/{uid}/` (the same uid scoping both layers).

### Firestore — `verifications/{uid}`

One document per user. Resubmission overwrites; audit log preserves
history. Schema:

```
verifications/{uid}
  uid: string                              // owner — same as doc id
  status: 'not_submitted' | 'pending_review' | 'approved' | 'rejected'
  documentFrontPath: string                // verifications/{uid}/document_front.<ext>
  documentBackPath: string                 // verifications/{uid}/document_back.<ext>
  selfiePath: string                       // verifications/{uid}/selfie.<ext>
  submittedAt: Timestamp                   // last submit time
  createdAt: Timestamp                     // first-ever submit
  approvedAt?: Timestamp                   // present iff status='approved'
  approvedByUid?: string                   // founder uid that approved
  rejectedAt?: Timestamp                   // present iff status='rejected'
  rejectedByUid?: string
  rejectionReason?: string                 // 3..500 chars, surfaces to modelo
```

**Why uid as doc id, not auto-id?** Because the natural query is "what's
this user's verification status?" — single `.doc(uid).get()`, no `where`,
no index. Resubmission is an overwrite of the same doc. We trade
"history of attempts" for query simplicity; history is in the audit log.

### Storage — `verifications/{uid}/`

Three blobs per user, deny-all to the client SDK (same posture as
Storage Rules elsewhere):

```
verifications/{uid}/document_front.{jpg|webp}
verifications/{uid}/document_back.{jpg|webp}
verifications/{uid}/selfie.{jpg|webp}
```

Upload flow reuses ADR-012's signed PUT URL machinery. The wizard:
1. Compresses each file client-side (`browser-image-compression`, EXIF
   stripped — same critical privacy bit as photos)
2. Requests a `kyc_upload_ticket` Server Action per file (kind ∈
   `document_front | document_back | selfie`)
3. PUTs to the signed URL
4. POSTs `confirmKycUpload({ path })` so server HEAD-checks the blob
5. On all 3 confirmed, POSTs `submitVerification()` which writes the
   doc with `status='pending_review'` and references the 3 paths

### Approval gate on listings (CRITICAL)

The admin's `approveDraft` action loads `verifications/{ownerUid}` and
refuses if `status !== 'approved'`. Without this, KYC is just storage
with no consequence; the brand promise still doesn't deliver.

Error message surfaces to the founder in the admin UI: "esta modelo no
tiene KYC aprobado — pídele que envíe la verificación primero".

**Migration note:** profiles approved BEFORE ADR-014 (e.g. Eddie) are
not retroactively unverified. The `verified: false` field on the listing
doc remains independent; we may decide to backfill it from
`verifications/{uid}.status === 'approved'` in a future PR, but for now
the existing `verified: false` stays as-is.

### How the modelo discovers this

Two entry points:

1. **`/publicar` success screen** — after submit, the existing
   "Recibimos tu publicación" screen gets a new primary CTA
   "Verificar identidad ahora" → `/verificacion/enviar`. The current
   "Volver al catálogo" stays as secondary.
2. **`/verificacion`** — the existing explainer page gets a sticky
   CTA "Verificar mi identidad" visible only to authenticated modelos.

### Routes

| Route | Purpose | Auth |
|---|---|---|
| `/verificacion` | Public explainer (existing — minimal change) | Anonymous OK |
| `/verificacion/enviar` | 3-step wizard | Auth required (redirects to /ingresar) |

### Security rules (sketch — owned by `firestore.rules` + `storage.rules`)

```
match /verifications/{id} {
  allow read, write: if false;            // Admin SDK only
}

service firebase.storage {
  match /b/{bucket}/o/{allPaths=**} {
    allow read, write: if false;          // existing deny-all covers new prefix
  }
}
```

The Storage deny-all already covers the new `verifications/` prefix —
no rules change needed beyond documentation.

## Out of scope (deferred)

- **Webcam capture for selfie** (live proof against pre-recorded photo
  spoofing). Intermediate level adds `getUserMedia` capture with a
  canvas snapshot.
- **Admin review queue** (`/verifications` similar to `/drafts`).
  Intermediate adds this to the admin codebase.
- **Automated face-document match** via Veriff / Onfido / Trulioo. Pro
  level swaps the manual approve step for a provider webhook.
- **Periodic re-verification** (e.g. expire approval after 12 months).
  Future ADR.
- **Multi-document support** (passport, driver's license — currently
  shape-agnostic; intermediate adds an explicit document-type field).
- **EXIF retention for forensics** — current pipeline strips EXIF for
  privacy. An adversarial trust-and-safety mode could keep server-side
  EXIF after the wizard's strip. Future ADR with privacy review.

## Consequences

- New Firestore collection `verifications/`.
- New bucket prefix `verifications/{uid}/`.
- New env var: none (reuses existing Firebase config).
- New audit events:
  - `biringa.verification.upload_ticket_requested`
  - `biringa.verification.upload_completed`
  - `biringa.verification.submitted`
  - `biringa.verification.approved` (admin codebase)
  - `biringa.verification.rejected` (admin codebase)
- New role grant: none (verification status is per-uid; no new claims).
- New audit rule: `verifications/` prefix added to
  `bucket-prefix-fence` allowlist (only adapters and the verification
  storage subdir may reference it).
- The admin's `approveDraft` gains a verification gate — drafts whose
  owner is not KYC-approved cannot be promoted.

## Migration plan

1. Deploy this PR. Existing drafts in `pending_review` (none beyond
   Eddie's, which is already approved) remain reviewable but the admin
   sees a "no KYC" banner.
2. Notify any modelo with a pending draft to verify.
3. Once KYC is the norm, future PR adds a "verified" badge on the
   listing doc by backfilling `verified: true` whenever
   `verifications/{owner}.status === 'approved'`.
