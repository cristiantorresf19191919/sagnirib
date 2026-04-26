# ADR-009 · Integration adapters boundary

- Status: accepted
- Date: 2026-04-25

## Decision
- All external SDKs (CMS, payments, email, analytics, auth, maps) live behind `src/server/adapters/<provider>/`.
- Adapters expose internal contracts; provider types do not leak into features or components.
- Adapters are server-only (`import "server-only"`).
- Mappers translate provider DTOs into internal types.

## Consequences
- Swapping a provider stays a one-folder change.
- Foundation has no adapters yet — added per integration as features land.
