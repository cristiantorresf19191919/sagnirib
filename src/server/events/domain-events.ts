import "server-only";

/**
 * Typed catalog of domain events. New events should be added here first
 * so handlers (analytics, audit, notifications) consume a stable shape.
 * Per Addendum 002 §8, events MUST NOT leak sensitive payloads to client.
 */
export type DomainEvent =
  | { type: "system.boot"; environment: string }
  | { type: "lead.submitted"; leadId: string; source: string }
  | { type: "user.profile_updated"; userId: string };

export type DomainEventType = DomainEvent["type"];
