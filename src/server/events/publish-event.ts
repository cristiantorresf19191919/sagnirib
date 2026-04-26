import "server-only";

import type { DomainEvent } from "./domain-events";

/**
 * Single boundary through which domain events are published. Until a real
 * bus is in place, this is a no-op-with-log; handlers (analytics, audit,
 * notifications) get wired here, never directly inside features.
 */
export async function publishEvent(event: DomainEvent): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.info("[event]", event);
  }
  // TODO(F5+): fan out to analytics + audit handlers behind this boundary.
}
