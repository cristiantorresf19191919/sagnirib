import "server-only";

import {
  MEETING_CONTEXT_CATALOG,
  SERVICE_CATALOG,
  SUPPORTED_CITIES,
} from "@/server/mocks/biringas/data";

/**
 * Catalogs (cities, services, meeting contexts) are static domain config —
 * they do not live in Firestore. The functions below match the contract
 * exposed by the mock so the barrel can route uniformly.
 *
 * If a "cities with at least one listing" view is ever needed, that is a
 * derived query (e.g. distinct city values in `listings`) and should live
 * elsewhere as `listActiveCities()`.
 */

export async function listCities(): Promise<ReadonlyArray<string>> {
  return SUPPORTED_CITIES;
}

export async function listServiceCatalog(): Promise<ReadonlyArray<string>> {
  return SERVICE_CATALOG;
}

export async function listMeetingContextCatalog(): Promise<
  ReadonlyArray<string>
> {
  return MEETING_CONTEXT_CATALOG;
}
