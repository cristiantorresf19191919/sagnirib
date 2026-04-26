# Integration adapters

Authoritative source: Addendum 002 §4 (Adapter) and ADR-009.

- Every external SDK lives behind `src/server/adapters/<provider>/`.
- Adapters import `server-only` and never re-export provider types.
- Mappers translate provider DTOs ↔ internal types under `src/server/mappers/`.
- Errors are thrown as typed adapter errors so callers handle a stable shape.
- Tests/mocks live next to the adapter; integration tests use a fake.
