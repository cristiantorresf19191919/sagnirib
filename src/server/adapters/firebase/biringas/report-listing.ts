import "server-only";

import type { ReportListingInput } from "@/server/biringas/report-types";

/**
 * Firestore adapter for listing reports — STUB. See the booking-request
 * adapter sibling for the rationale. When this is replaced, write
 * `listing_reports/{auto-id}` with the same shape as `ReportListingRecord`
 * + a server timestamp; the barrel already handles auth + audit + tag
 * invalidation.
 */

interface RawArgs {
  input: ReportListingInput;
  reporterUid: string | null;
}

export async function reportListingRaw(
  _args: RawArgs,
): Promise<{ id: string }> {
  throw new ReportDisabledError(
    "El sistema de reportes en Firestore aún no está implementado.",
  );
}

class ReportDisabledError extends Error {
  readonly kind = "report-disabled" as const;
  constructor(message: string) {
    super(message);
    this.name = "ReportDisabledError";
  }
}
