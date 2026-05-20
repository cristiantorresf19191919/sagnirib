# ADR-013 · `favorites` collection

- Status: accepted
- Date: 2026-05-20
- Extends: ADR-010 (Firebase data ownership), ADR-009 (integration adapters)

## Context

`HeartButton` on every catalog card lets a visitor save listings to
their favorites. Today the favorites + the comparison tray live exclusively
in `localStorage` (`biringas:favorites:v1`, `biringas:favorites:compare:v1`)
under the `useFavorites` external store (`src/features/favorites/store/`).
That works for anonymous browsing but breaks the moment a known user
expects continuity:

- A signed-in user who saves a listing on mobile cannot see it on desktop.
- Clearing browser data wipes a curated shortlist with no backup.
- Future retention surfaces (e.g. `BackOnlinePill`, the "favoritas
  disponibles ahora" badge) cannot reach users on a fresh device.
- We cannot ever say "your favorites are saved to your account" — which
  was the founder's pitch from the intake.

The comparison tray is a session-local working set capped at three items,
and stays on `localStorage` for now — moving it server-side adds
contention with the "Comparar" interaction that wants to feel instant and
device-local. This ADR is **about favorites only**; comparison stays
client-only until there is a product reason to lift it.

## Decision

Introduce `favorites/{uid}/items/{listingId}` as a Firestore subcollection
under a per-user document. The barrel `@/server/favorites` exposes
auth-gated Server Functions and Actions; the `useFavorites` external
store keeps `localStorage` semantics but **dual-writes** to the server
whenever the user is authenticated. On sign-in, the provider merges the
server snapshot with whatever was already in `localStorage` (union, no
deletes) so anonymous shortlist accumulated before login is never lost.

### Shape (full schema in `firebase-schema.md`)

```
favorites/{uid}                  // empty parent doc — created lazily; presence is incidental
favorites/{uid}/items/{listingId}
  listingId: string              // == doc id; opaque Firestore listing id
  listingSlug: string            // snapshot at add time; survives slug renames for legacy display
  addedAt: Timestamp             // serverTimestamp at write
```

The document id is `listingId` (Firestore opaque id, same as
`listings/{id}.id`) — NOT the slug. Slugs can change (renaming policies
land on the modelo side); favorites must survive that rename. The slug
snapshot is denormalized only for display when a listing has been
deleted and we want to show the user "tu favorita antigua" instead of
an opaque id.

### Why subcollection, not top-level

Top-level `favorites/{compositeId}` with `userUid + listingId` fields was
considered but rejected:

- All practical queries are "the favorites of THIS user". Subcollection
  makes those reads a one-shot `favorites/{uid}/items` query without
  composite indexes.
- Security rules become trivial (`request.auth.uid == uid` — even though
  reads go via Admin SDK today, the rule documents intent and protects
  against accidental Web SDK enablement).
- Cross-user analytics ("how many users saved listing X") would benefit
  from a top-level collection, but those queries are not on the roadmap
  and a Cloud Function aggregate counter is the right answer when they
  are, NOT a different primary shape.

### Operations exposed by `@/server/favorites`

| Function                          | Auth | Audit  | Notes                                     |
| --------------------------------- | ---- | ------ | ----------------------------------------- |
| `listMyFavorites(): string[]`     | ✅   | —      | Returns listing ids the caller has saved. |
| `addFavorite({listingId, slug})`  | ✅   | ✅     | Idempotent — re-adding the same id no-ops.|
| `removeFavorite({listingId})`     | ✅   | ✅     | Idempotent — removing nothing no-ops.     |

Why audit add/remove despite being a frequent action: ADR-010 §5 makes
auditing of writes non-optional, and the audit events also feed the
abuse-detection trail (rapid-fire favoriting bursts have shown up in
scraping incidents on similar catalogs). Reads are not audited.

### Cache semantics

`listMyFavorites` is read on every Server Component render that needs to
hydrate the provider. To keep the cost flat:

- Wrap in `unstable_cache` keyed by `uid` with tag `favorites:user:<uid>`,
  revalidate 60s.
- `addFavorite` / `removeFavorite` call `updateTag(...)` (Server Action
  scope) on the per-user tag so the next render reads the new set.

No cross-cutting `favorites` tag exists — favorites are inherently
per-user, and a global tag would invalidate every user's cache on every
write.

### Client hydration strategy

1. The root layout (Server Component) calls `getSession()`. If a session
   exists, it calls `listMyFavorites()` and passes the array as
   `initialFavorites` to the `<FavoritesProvider />`.
2. The provider seeds the in-memory cache with a UNION of
   `localStorage` favorites + `initialFavorites`. This means:
   - Anonymous → sign-in: anonymous favorites are uploaded to the server
     via `addFavorite` for each id missing on the server.
   - Already-signed-in fresh device: localStorage starts empty, server
     hydrates the set, `localStorage` is kept in sync as a second-layer
     cache so subsequent reads are zero-latency.
3. Every `toggleFavorite(id)` mutates `localStorage` immediately (the
   eye sees the heart fill instantly), and — when authenticated — fires
   the corresponding Server Action in the background. Action failures
   (network, auth expired) revert the optimistic update and surface a
   toast.

The union-on-sign-in is one-way (anonymous → server, never server →
delete). A user who signs in with a clean account but had anonymous
favorites does NOT lose them; a user who signs in and finds server
favorites they don't recognise can clear them manually from
`/favoritas`.

### Auth-loss behavior

When `useAuthSession()` flips from `authenticated` to `anonymous`
(explicit sign-out or session expiry), the provider stops dual-writing
but **keeps the local cache intact**. Favorites added while signed out
go to `localStorage` only; the next sign-in re-merges via the same
union path.

## Consequences

- One new top-level collection — `favorites/`. No change to existing
  `listings/` reads, indexes, or shape.
- Three new audit events:
  - `biringa.favorite.added`
  - `biringa.favorite.removed`
  - `biringa.favorite.synced` (one bulk write when anonymous → signed-in
    merge runs; aggregate metadata `{ count: N }` rather than one event
    per id).
- New cache tag namespace: `favorites:user:<uid>`. Documented in
  `src/server/favorites/cache-tags.ts` alongside the existing
  `biringa:*` tags.
- The audit script (`pnpm firebase:audit`) does not need new rules —
  the existing path-based fences (admin-sdk-fence, barrel-only-imports,
  collection-string-fence) cover the new adapter folder
  (`src/server/adapters/firebase/favorites/`) automatically.
- `useFavorites` gains `pendingSync: boolean` (true while a background
  Server Action is in-flight) for future UI affordances; not surfaced
  in v1.
- Comparison tray stays on `localStorage` (no server-side compare port
  in this ADR).

## Indexes

None required. The `favorites/{uid}/items` subcollection is read by id
range (the implicit `__name__` index) and written by document id —
neither needs a composite index.

When the future "fans of this listing" surface lands, a
`collectionGroup('items')` query with `where('listingId', '==', X)` will
need a single-field collection-group index on `listingId`. Add at that
time, not now.

## Security rules

```
match /favorites/{uid} {
  allow read, write: if false;             // Admin SDK only
  match /items/{listingId} {
    allow read, write: if false;           // Admin SDK only
  }
}
```

Same deny-all posture as `listings/` and `listing_drafts/`. The rule is
documented for the day client-SDK access is reconsidered; today every
read and write flows through the adapter behind a Server Action /
authenticated Server Component.

## Out of scope

- Sharing a favorites list with another user (link, embed). Future ADR.
- "Fans count" on listing cards. Needs an aggregate counter
  (Cloud Function on `favorites/*/items/*` create+delete). Future ADR.
- Server-side comparison tray. Future ADR if product wants it.
- Migration of pre-existing anonymous `localStorage` favorites into a
  signed-in account at scale. Per-user merge on sign-in covers the
  organic case; bulk migration is not needed because nothing was
  persisted server-side before this ADR.
