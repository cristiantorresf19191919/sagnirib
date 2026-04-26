# ADR-006 · Architecture patterns governance

- Status: accepted
- Date: 2026-04-25

## Decision
Patterns enabled from foundation: Server-first, Provider/Composition (empty), Factory (SEO metadata), Policy/Guard (skeletons), Repository (folders only).

Patterns reserved for real need (per Addendum 002): Adapter, Builder, Strategy, Observer/Event Bus (boundary exists, no real bus yet), Command/Action, Mapper/DTO, State Machine.

Each non-trivial feature must produce a Pattern Decision Record (`docs/architecture/patterns-governance.md` template) before adopting Adapter, Strategy, Observer, Builder, or State Machine.

## Consequences
- No premature abstraction. Decorative patterns are an audit failure.
