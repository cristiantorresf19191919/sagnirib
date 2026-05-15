# Integration adapters

Authoritative source: Addendum 002 §4 (Adapter) and ADR-009.

- Every external SDK lives behind `src/server/adapters/<provider>/`.
- Adapters import `server-only` and never re-export provider types.
- Mappers translate provider DTOs ↔ internal types under `src/server/mappers/`.
- Errors are thrown as typed adapter errors so callers handle a stable shape.
- Tests/mocks live next to the adapter; integration tests use a fake.

## Active adapters

### Firebase (Firestore) — Biringa listings · `src/server/adapters/firebase/biringas/`

- Surface: read-only access for the Biringa listings catalog (`listAll`, `listFeatured`, `listHeroMosaic`, `findBySlug`, `getListingReviews`, plus catalog readers).
- Public contract: `src/server/biringas/types.ts` + `src/server/biringas/review-types.ts`. Provider types (`Timestamp`, `DocumentSnapshot`) do not leak past `src/server/mappers/firebase-biringa.ts`.
- Routing: the barrel `src/server/biringas/index.ts` chooses Firestore vs the in-memory mock at module load via `isFirebaseConfigured()`. No feature code is aware of this.
- Runtime: Node only — Admin SDK is incompatible with the Edge runtime.
- Errors: thrown as `FirebaseAdapterError` with a `kind` discriminant. Features handle `not-found` and `permission-denied` explicitly; the rest bubbles.
- Cache: `unstable_cache` per function, tagged `biringa:listings` and `biringa:listing:<slug>`. Mutations must call `revalidateTag` to invalidate.
- Schema: see [docs/architecture/firebase-schema.md](./firebase-schema.md).
