import "server-only";

import type {
  ReportListingInput,
  ReportListingRecord,
} from "@/server/biringas/report-types";

/**
 * In-memory mock store for listing reports.
 *
 * When the Firestore adapter ships, it gets its own `report-listing.ts`
 * that writes to `listing_reports/{auto-id}` with the same shape +
 * server timestamps.
 */
const STORE: ReportListingRecord[] = [];

let counter = 0;
function nextId() {
  counter += 1;
  return `report-${Date.now()}-${counter}`;
}

interface RawArgs {
  input: ReportListingInput;
  /** May be null when reporter is anonymous. */
  reporterUid: string | null;
}

export async function reportListingRaw({
  input,
  reporterUid,
}: RawArgs): Promise<{ id: string }> {
  const record: ReportListingRecord = {
    ...input,
    id: nextId(),
    reporterUid,
    submittedAt: new Date().toISOString(),
    status: "open",
  };
  STORE.push(record);
  return { id: record.id };
}

/** Test/inspection helper. */
export async function listReportsRaw(): Promise<
  ReadonlyArray<ReportListingRecord>
> {
  return STORE.slice();
}
