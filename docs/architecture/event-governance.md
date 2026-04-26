# Event governance

Authoritative source: Addendum 002 §8.

- Events are typed in `src/server/events/domain-events.ts`.
- `publishEvent` is the only emission boundary.
- Sensitive payloads stay server-only; analytics handlers receive sanitized projections.
- Event names are stable; renames require a new event + migration window.
- Audit-relevant events MUST also write through `auditLog`.
