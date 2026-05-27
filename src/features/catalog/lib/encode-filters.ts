import type { ListingsFilters } from "@/server/biringas";

/**
 * URL-encoding helpers for `ListingsFilters`. This module deliberately uses
 * **type-only imports** so it can be loaded by Client Components without
 * dragging the server-only catalog mock into the browser bundle.
 *
 * `parseFilters` (the inverse) needs runtime allowlists from the catalog
 * data, so it stays in `parse-filters.ts` — server-only territory.
 */

/**
 * Catalog grid presentation modes. Lives outside `ListingsFilters` because it
 * does not affect the dataset — only how cards render.
 */
export const CATALOG_VIEWS = ["spotlight", "grid2", "grid3", "list"] as const;
export type CatalogView = (typeof CATALOG_VIEWS)[number];
export const DEFAULT_CATALOG_VIEW: CatalogView = "grid3";

/**
 * Re-encode a `ListingsFilters` into a `URLSearchParams` instance. Used when
 * a UI element needs to compose links that toggle a single key while
 * preserving the rest of the active filters.
 */
export function encodeFilters(filters: ListingsFilters): URLSearchParams {
  const out = new URLSearchParams();
  if (filters.category) out.set("category", filters.category);
  if (filters.sex) out.set("sex", filters.sex);
  if (filters.city) out.set("city", filters.city);
  if (filters.search) out.set("q", filters.search);
  if (filters.priceMin !== undefined)
    out.set("priceMin", String(filters.priceMin));
  if (filters.priceMax !== undefined)
    out.set("priceMax", String(filters.priceMax));
  if (filters.ageMin !== undefined) out.set("ageMin", String(filters.ageMin));
  if (filters.ageMax !== undefined) out.set("ageMax", String(filters.ageMax));
  if (filters.verifiedOnly) out.set("verified", "1");
  if (filters.withVideo) out.set("video", "1");
  if (filters.withAudio) out.set("audio", "1");
  if (filters.withReviews) out.set("reviews", "1");
  if (filters.faceVisible) out.set("face", "1");
  if (filters.paymentByCard) out.set("card", "1");
  filters.attention?.forEach((v) => out.append("attention", v));
  filters.contactChannels?.forEach((v) => out.append("contact", v));
  filters.services?.forEach((v) => out.append("service", v));
  filters.specialServices?.forEach((v) => out.append("special", v));
  filters.meetingContexts?.forEach((v) => out.append("place", v));
  if (filters.attributes) {
    for (const [key, values] of Object.entries(filters.attributes)) {
      values.forEach((v) => out.append(`attr_${key}`, v));
    }
  }
  if (filters.sortBy) out.set("sort", filters.sortBy);
  if (filters.page && filters.page > 1) out.set("page", String(filters.page));
  return out;
}

/**
 * Build a relative URL for `/explorar?…` after toggling/setting a single
 * field. Pass `value === undefined` to clear a key. The optional `view` is
 * preserved on the URL when it is non-default.
 */
export function withFilter(
  base: ListingsFilters,
  key: "category" | "city" | "sex",
  value: string | undefined,
  view?: CatalogView,
): string {
  const next: ListingsFilters = { ...base, page: undefined };
  switch (key) {
    case "category":
      // Casting through string preserves union narrowing without re-importing
      // the union type from server-only territory.
      next.category = value as ListingsFilters["category"];
      break;
    case "city":
      next.city = value;
      break;
    case "sex":
      next.sex = value as ListingsFilters["sex"];
      break;
  }
  const params = encodeFilters(next);
  if (view && view !== DEFAULT_CATALOG_VIEW) params.set("view", view);
  const qs = params.toString();
  return qs.length > 0 ? `/explorar?${qs}` : "/explorar";
}
