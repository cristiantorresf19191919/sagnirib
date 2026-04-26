# Rule: Event / Observer governance

1. Domain events are typed in `src/server/events/domain-events.ts`.
2. Emit only via `publishEvent`. Do not call analytics SDKs from features.
3. Sensitive payloads do not leave the server. Sanitize before fan-out.
4. Audit-relevant events also write through `auditLog`.

Reference: ADR-008, docs/architecture/event-governance.md.
