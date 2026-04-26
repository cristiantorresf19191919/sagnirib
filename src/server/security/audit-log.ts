import "server-only";

export interface AuditLogEntry {
  event: string;
  actorId?: string;
  resource?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Append-only audit log contract. Sensitive payloads must NOT leak via
 * analytics events — events bus and audit log are deliberately separate
 * (Addendum 002 §8).
 */
export async function auditLog(entry: AuditLogEntry): Promise<void> {
  // TODO(F5): persist to chosen sink (DB table, log drain).
  if (process.env.NODE_ENV !== "production") {
    console.info("[audit]", entry);
  }
}
