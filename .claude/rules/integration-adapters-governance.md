# Rule: Integration adapters

1. External SDKs live ONLY in `src/server/adapters/<provider>/` with `import "server-only"`.
2. Provider types do not leak into features or components — use Mappers in `src/server/mappers/`.
3. Adapter errors are typed; callers handle a stable shape.
4. Each adapter has a fake/mock for tests.

Reference: ADR-009, docs/architecture/integration-adapters.md.
