# ADR-008 · Event / Observer for analytics and audit

- Status: accepted
- Date: 2026-04-25

## Decision
- Domain events are typed in `src/server/events/domain-events.ts`.
- `publishEvent` is the single boundary for emitting events. Features must NOT call analytics SDKs or audit log writers directly.
- Sensitive payloads MUST stay server-side; analytics handlers receive sanitized projections.
- Until an analytics provider is chosen (intake-pending), `publishEvent` logs in dev and is a no-op in prod.

## Consequences
- We can wire PostHog / Plausible / GA4 / audit DB later in a single place.
