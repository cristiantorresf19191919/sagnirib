# ADR-016 · `bookings` collection

- Status: superseded by ADR-021 (2026-05-28)
- Date: 2026-05-20
- Extends: ADR-010 (Firebase data ownership), ADR-011 (`listing_drafts`)

> **Superseded by ADR-021.** The booking / scheduling system documented
> below has been removed from the MVP. The catalog now ships with only
> the "reveal contact" affordance — the client sees the profile detail
> and reaches out directly through the revealed phone / WhatsApp.
> See `ADR-021-remove-bookings-mvp.md` for the rationale and the
> code surfaces removed.

## Context

Booking requests have shipped end-to-end against an in-memory mock since
PR2. The buyer-side modal (`BookingRequestModal`), the seller-side inbox
(`BookingInboxList`), and the mutual-review flow all already work — but
only inside a single dev process. The Firestore adapter for the
`bookings/` collection has been a STUB since ADR-011 shipped:
`requestBookingRaw`, `listBookingsForListingsRaw`,
`updateBookingStatusRaw`, and `attachBuyerReviewRaw` throw
`BookingDisabledError` so the action wrapper surfaces a friendly
"no implementado" banner.

That stub was the right move while we landed listings, drafts, and
storage. It is no longer acceptable because the catalog's
"Responde ~Xmin" chip (ADR-015 era) feeds off
`computeReplyMedianMinutesForSlug`, which can only return real
medians once the underlying bookings exist server-side.

## Decision

Promote the `bookings/{bookingId}` collection from stub to real. Same
shape that the in-memory mock has been serving — no domain-type
changes, just a Firestore adapter that mirrors it.

### Shape (full schema in `firebase-schema.md`)

```
bookings/{bookingId}
  listingSlug: string         // indexed for inbox + median queries
  requesterUid: string        // buyer (Firebase Auth uid)
  proposedAt: Timestamp       // ISO inbound; mapper coerces
  durationHours: number       // 1 | 2 | 3 | 4 | 8 | 12 | 24
  meetingType: string         // 'outcall' | 'incall' | 'videocall'
  contactPreference: string   // 'whatsapp' | 'telegram' | 'platform'
  message: string             // freeform 12..1000 chars
  submittedAt: Timestamp      // serverTimestamp
  respondedAt: Timestamp | null   // set on first pending → terminal transition
  status: string              // 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'completed'
  buyerReview?: {             // attached post-`completed` by `submitBuyerReview`
    rating: 1..5,
    comment?: string,
    submittedAt: Timestamp
  }
```

`bookingId` is a Firestore auto-id. No application logic depends on the
id's content beyond uniqueness; the previous mock generated
`booking-<ts>-<counter>` purely so React keys stayed stable. The
adapter exposes the auto-id back through the return value, identical
contract.

### Why a top-level collection, not a subcollection

The inbox queries by `listingSlug` (the owner's listings, plural) —
`where('listingSlug', 'in', [...])` is a single round-trip on a top-level
collection but a collection-group query on subcollections, which requires
an extra index AND surfaces every "bookings" subcollection in the project
(including any future buyer-side hierarchy). Top-level keeps the
mental model and the Firestore reads simple.

### Adapter operations

| Function                              | Pattern                                       | Indexes used                                       |
| ------------------------------------- | --------------------------------------------- | -------------------------------------------------- |
| `requestBookingRaw`                   | `doc().set()` with `serverTimestamp`          | none (single write)                                 |
| `listBookingsForListingsRaw(slugs)`   | `where('listingSlug', 'in', slugs)` + order   | `listingSlug ASC, submittedAt DESC`                |
| `updateBookingStatusRaw(id, status)`  | `update()` with optional `respondedAt`        | none (single write)                                 |
| `attachBuyerReviewRaw(id, review)`    | `update()` of `buyerReview` map               | none                                                |
| `computeReplyMedianMinutesForSlug`    | `where('listingSlug','==',slug) + orderBy('respondedAt','desc') + limit(20)` | `listingSlug ASC, respondedAt DESC` |

`in` clauses are capped to 30 elements in Firestore. The seller dashboard
chunks the slugs list into 30-element batches and merges results
client-side; sellers with > 30 listings are rare and a 2-chunk fan-out is
still one round-trip per chunk in parallel.

### Lifecycle

| Phase | Trigger | Cleanup |
| ----- | ------- | ------- |
| Created | Buyer submits the booking modal | n/a — survives the booking window |
| Responded | Owner confirms/declines | n/a — `respondedAt` records the transition; status stays |
| Completed | Owner marks delivered | Eligible for `buyerReview` write |
| Cancelled | Owner / buyer cancellation | Soft state; doc stays for audit |

There is no scheduled deletion. Booking history is part of the trust
trail (especially for dispute resolution) and the data volume is small
(one doc per booking is < 1 KB).

### Cache tags

Reuses the existing `biringa:bookings:<slug>` tag the barrel already
invalidates on every mutation. The Firestore adapter only persists; the
barrel handles the tag flip.

`computeReplyMedianMinutesForSlug` is NOT cached at the adapter layer
— the barrel reads it once per `respondToBooking` call and writes the
result back onto the listing doc (per ADR-015 reply-time wiring), so
catalog reads pick up the new median via the existing
`biringa:listing:<slug>` tag.

## Consequences

- One new top-level collection. Two new composite indexes.
- No domain-type changes — `BookingRequestRecord` and friends stay
  intact. Mapper translates Firestore Timestamps ↔ ISO strings.
- The `BookingDisabledError` class is removed; the adapter throws
  `FirebaseAdapterError` for transport-level failures, same as the
  rest of the Biringa adapters.
- `computeReplyMedianMinutesForSlug` returns a real median instead of
  `null` once 2+ bookings have been responded to — the catalog's
  "Responde ~Xmin" chip starts appearing organically.
- One new audit event surface? No — `biringa.booking.requested` and
  friends already fire from the barrel. The adapter is silent.

## Composite indexes

| Collection | Fields                                | Used by                                  |
| ---------- | ------------------------------------- | ---------------------------------------- |
| `bookings` | `listingSlug ASC`, `submittedAt DESC` | `listBookingsForListingsRaw` (inbox)     |
| `bookings` | `listingSlug ASC`, `respondedAt DESC` | `computeReplyMedianMinutesForSlug`        |

Both are added to `firestore.indexes.json` as part of this ADR.
Firestore prompts at first run with a console URL for either — apply
when they appear if a deploy missed the indexes file.

## Security rules

```
match /bookings/{id} {
  allow read, write: if false;     // Admin SDK only
}
```

Same deny-all posture as `listings/`, `listing_drafts/`, and
`favorites/`. Buyer + seller reads/writes all flow through Server
Actions behind the auth + audit stack — no client-SDK doors.

## Out of scope

- Buyer history surface (`/mis-reservas`). The collection supports the
  query (`where('requesterUid', '==', uid) + orderBy('submittedAt')`)
  but the UI is a separate PR.
- Scheduled reminders / SMS / email. The booking lifecycle is
  manually progressed today; automated nudges land in a future ADR.
- Booking-level cache tags (`biringa:booking:<id>`). The existing
  `biringa:bookings:<slug>` tag covers every inbox surface; per-id
  tagging adds invalidation work without a use case.
