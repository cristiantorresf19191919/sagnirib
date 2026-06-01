# ADR-021 · Remove in-platform booking from the MVP

- Status: accepted
- Date: 2026-05-28
- Supersedes: ADR-016 (`bookings` collection)

## Context

Until this ADR the catalog shipped a full booking funnel:

- `BookingRequestModal` on each `/p/[slug]` profile (buyer → seller
  proposals with date + duration + meeting type + contact preference
  + message).
- `AvailabilityStrip` on the profile and the seller dashboard ("Agenda"
  tab) rendering a synthesised weekly grid.
- `BookingInboxList` + `RateBuyerInline` on `/mi-cuenta` (seller-side
  inbox with confirm / decline / complete + post-encounter rating of
  the buyer).
- A `bookings/{id}` Firestore collection backed by two composite
  indexes; the barrel exposed `requestBooking`, `respondToBooking`,
  `listMyIncomingBookings`, and `submitBuyerReview` Server Actions.
- A `reputation.replyMedianMinutes` field on every listing, recomputed
  whenever a seller transitioned a booking out of `pending`.

Founder direction (2026-05-28): the MVP catalog should NOT expose any
agenda, availability, or in-platform booking. The only acceptable
post-discovery affordance is **reveal contact** — the client sees the
profile detail and reaches out directly through the revealed phone /
WhatsApp. Everything else (real availability, scheduled encounters,
mutual reviews) is post-MVP.

The booking surface had three concrete problems that compounded the
"out of scope" call:

1. **Fake availability.** The picker was a placeholder backed by a
   deterministic per-slug hash; sellers never edited it, so requests
   could clash with their real calendar.
2. **No notifications.** Sellers had to log into `/mi-cuenta`
   manually to discover requests — high abandonment risk.
3. **Trust theatre.** Showing "Responde ~Xmin" without a real reply
   pipeline gave buyers an expectation the platform could not honour.

## Decision

Remove the booking system end-to-end. Keep the existing **reveal
contact** affordance (`ContactReveal` on `/p/[slug]`) as the sole
post-discovery action.

### Code surfaces removed

| Layer | Files |
| ----- | ----- |
| UI (buyer) | `BookingRequestModal`, `BookingDatePicker`, `AvailabilityStrip` |
| UI (seller) | `BookingInboxList`, `RateBuyerInline`, the "Solicitudes" + "Agenda" tabs in `/mi-cuenta` |
| Server actions | `requestBooking`, `respondToBooking`, `submitBuyerReview` |
| Server barrel | `requestBooking`, `respondToBooking`, `listMyIncomingBookings`, `submitBuyerReview` |
| Adapter / Mock / Mapper | `firebase/biringas/request-booking.ts`, `mocks/biringas/request-booking.ts`, `mappers/firebase-booking.ts` |
| Domain types / schemas | `booking-types.ts`, `request-booking-schema.ts` |
| Availability lib | `features/biringas/lib/availability.ts` |
| Cache tags | `CACHE_TAGS.bookingsForListing` |
| Reputation field | `BiringaReputation.replyMedianMinutes` (+ the catalog card's "Responde ~Xmin" chip) |
| i18n keys | `booking.*`, `bookingDatePicker.*`, `availability.*`, `dashboard.inbox.*`, `dashboard.rateBuyer.*`, `catalog.card.respondsIn`, `miCuenta.agenda.*`, `miCuenta.empty.*` |
| Firestore | `bookings/{id}` composite indexes and security rule (deny-all) |
| ADRs | ADR-016 marked superseded |

### Dashboard shape after the cut

`/mi-cuenta` collapses from four tabs to two:

```
Mi perfil   — drafts + published listings + KYC + diagnostics
Invitar     — referral program
```

`DashboardShell` is updated to drop the `inbox` and `agenda` tab
contracts; callers that previously passed them are typecheck-enforced
to stop passing them.

### Firestore

The `bookings/{id}` collection was never written to in production.
- Composite indexes removed from `firestore.indexes.json`.
- Security rule removed from `firestore.rules` (the collection is no
  longer addressed by any code; deny-all by default applies).

### Audit events

The events `biringa.booking.requested`, `biringa.booking.responded`,
and `biringa.buyer_review.submitted` are no longer emitted. Historical
entries in `auditLog/` are kept as-is — they are part of the trust
trail and don't depend on the live code path.

## Consequences

- The buyer flow shortens to: catalog → profile → reveal contact →
  out-of-platform conversation. No in-app inbox to monitor.
- Sellers receive contact reveals via the existing audit event
  (`biringa.private_contact.viewed`) and the out-of-platform channel.
  No platform-side notifications today.
- `reputation.replyMedianMinutes` is gone — no chip, no expectation.
  Reputation is now driven purely by reviews + KYC status + days
  advertised.
- Re-introducing in-platform scheduling later is **not blocked** by
  this ADR. It will require a fresh ADR with: (a) a real availability
  source-of-truth, (b) a notification channel for sellers, (c) a
  decision on whether bookings carry money. The removed code is
  recoverable from git history if any of it is reusable.

## Out of scope

- Buyer history surface (`/mis-reservas`). Never shipped.
- Scheduled reminders / SMS / email. Never shipped.
- Bookings collection backfill / migration. The collection was empty;
  nothing to migrate.
