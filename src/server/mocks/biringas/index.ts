import "server-only";

import {
  BIRINGA_LISTINGS,
  MEETING_CONTEXT_CATALOG,
  SERVICE_CATALOG,
  SUPPORTED_CITIES,
} from "./data";
import type {
  BiringaListing,
  ListingsFilters,
  PaginatedListings,
} from "./types";

const DEFAULT_PAGE_SIZE = 20;

function applyFilters(
  source: ReadonlyArray<BiringaListing>,
  filters: ListingsFilters,
): BiringaListing[] {
  let results = [...source];

  if (filters.city) {
    const needle = filters.city.toLowerCase();
    results = results.filter((ad) => ad.city.toLowerCase() === needle);
  }

  if (filters.search) {
    const needle = filters.search.toLowerCase();
    results = results.filter(
      (ad) =>
        ad.name.toLowerCase().includes(needle) ||
        ad.bio.toLowerCase().includes(needle) ||
        ad.tags.some((t) => t.toLowerCase().includes(needle)) ||
        ad.services.some((s) => s.toLowerCase().includes(needle)),
    );
  }

  if (filters.priceMin !== undefined) {
    results = results.filter((ad) => ad.pricePerHour >= filters.priceMin!);
  }
  if (filters.priceMax !== undefined) {
    results = results.filter((ad) => ad.pricePerHour <= filters.priceMax!);
  }

  if (filters.ageMin !== undefined) {
    results = results.filter((ad) => ad.age >= filters.ageMin!);
  }
  if (filters.ageMax !== undefined) {
    results = results.filter((ad) => ad.age <= filters.ageMax!);
  }

  if (filters.verifiedOnly) {
    results = results.filter((ad) => ad.verified);
  }
  if (filters.withVideo) {
    results = results.filter((ad) => ad.hasVideo);
  }
  if (filters.withAudio) {
    results = results.filter((ad) => ad.hasAudio);
  }

  if (filters.services && filters.services.length > 0) {
    const wanted = filters.services.map((s) => s.toLowerCase());
    results = results.filter((ad) =>
      wanted.some((w) => ad.services.some((s) => s.toLowerCase().includes(w))),
    );
  }

  if (filters.meetingContexts && filters.meetingContexts.length > 0) {
    const wanted = filters.meetingContexts.map((s) => s.toLowerCase());
    results = results.filter((ad) =>
      wanted.some((w) =>
        ad.meetingContexts.some((s) => s.toLowerCase().includes(w)),
      ),
    );
  }

  if (filters.attributes) {
    for (const [key, values] of Object.entries(filters.attributes)) {
      if (!values || values.length === 0) continue;
      results = results.filter((ad) => {
        const attr = ad.attributes[key as keyof typeof ad.attributes];
        if (typeof attr !== "string") return false;
        const lower = attr.toLowerCase();
        return values.some((v) => lower.includes(v.toLowerCase()));
      });
    }
  }

  switch (filters.sortBy) {
    case "price_asc":
      results.sort((a, b) => a.pricePerHour - b.pricePerHour);
      break;
    case "price_desc":
      results.sort((a, b) => b.pricePerHour - a.pricePerHour);
      break;
    case "rating":
      results.sort((a, b) => b.reputation.score - a.reputation.score);
      break;
    case "recent":
    default:
      results.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }

  return results;
}

/**
 * Paginated catalog query. The signature is what the future Firebase
 * adapter must implement — keep it stable.
 */
export async function listAll(
  filters: ListingsFilters = {},
): Promise<PaginatedListings> {
  const filtered = applyFilters(BIRINGA_LISTINGS, filters);
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);

  return {
    data,
    meta: { total, page, pageSize, totalPages },
  };
}

/**
 * Featured listings for the home hero / carousel. Sorted by daysFeatured
 * (descending) among verified, well-rated entries. The home contract
 * requires "featured listings" content.
 */
export async function listFeatured(
  limit = 8,
): Promise<ReadonlyArray<BiringaListing>> {
  return BIRINGA_LISTINGS.filter((ad) => ad.verified && ad.reputation.score >= 4.5)
    .slice()
    .sort((a, b) => b.reputation.daysFeatured - a.reputation.daysFeatured)
    .slice(0, limit);
}

export async function findBySlug(slug: string): Promise<BiringaListing | null> {
  return BIRINGA_LISTINGS.find((ad) => ad.slug === slug) ?? null;
}

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

export type {
  BiringaAttributes,
  BiringaListing,
  BiringaReputation,
  ListingsFilters,
  PaginatedListings,
} from "./types";
