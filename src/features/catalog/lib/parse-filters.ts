import {
  APPEARANCE_CATALOG,
  ATTENTION_CATALOG,
  CATEGORIES,
  COLOMBIA_LOCATIONS,
  CONTACT_CATALOG,
  DEPARTMENT_NAMES,
  MEETING_CONTEXT_CATALOG,
  SERVICE_CATALOG,
  SPECIAL_SERVICE_CATALOG,
  SUPPORTED_CITIES,
  type AttentionTarget,
  type Category,
  type ContactChannel,
  type ListingsFilters,
  type Sex,
} from "@/server/biringas";

import {
  CATALOG_VIEWS,
  DEFAULT_CATALOG_VIEW,
  encodeFilters,
  withFilter,
  type CatalogView,
} from "./encode-filters";

// Re-export so existing callers keep importing from `parse-filters`.
export {
  CATALOG_VIEWS,
  DEFAULT_CATALOG_VIEW,
  encodeFilters,
  withFilter,
  type CatalogView,
};

/**
 * Next 16 page-level `searchParams` are async and arrive as
 * `string | string[] | undefined` per key. This module is the only place that
 * deals with that shape — features and components see fully-typed
 * `ListingsFilters` instead.
 *
 * Allowlists guard every input so a typo in the URL cannot trigger arbitrary
 * branches downstream (no `?attention=admin` shenanigans).
 */
export type RawSearchParams = Record<
  string,
  string | string[] | undefined
>;

const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));
const ATTENTION_IDS = new Set(ATTENTION_CATALOG.map((a) => a.id));
const CONTACT_IDS = new Set(CONTACT_CATALOG.map((c) => c.id));
const CITY_SET = new Set(SUPPORTED_CITIES);
const DEPARTMENT_SET = new Set(DEPARTMENT_NAMES);
const LOCALITY_SET = new Set(
  COLOMBIA_LOCATIONS.flatMap((d) => d.cities.flatMap((c) => c.localities)),
);
const SERVICE_SET = new Set(SERVICE_CATALOG);
const SPECIAL_SET = new Set(SPECIAL_SERVICE_CATALOG);
const MEETING_SET = new Set(MEETING_CONTEXT_CATALOG);
const SORT_VALUES = new Set(["recent", "price_asc", "price_desc", "rating"]);

const CATALOG_VIEW_SET = new Set<CatalogView>(CATALOG_VIEWS);

export function parseView(params: RawSearchParams): CatalogView {
  const raw = single(params.view);
  if (raw && CATALOG_VIEW_SET.has(raw as CatalogView)) {
    return raw as CatalogView;
  }
  return DEFAULT_CATALOG_VIEW;
}

function single(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function many(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

function pickOne<T extends string>(
  raw: string | undefined,
  allowed: ReadonlySet<T>,
): T | undefined {
  if (!raw) return undefined;
  return allowed.has(raw as T) ? (raw as T) : undefined;
}

function pickMany<T extends string>(
  raw: ReadonlyArray<string>,
  allowed: ReadonlySet<T>,
): ReadonlyArray<T> {
  const out: T[] = [];
  for (const value of raw) {
    if (allowed.has(value as T) && !out.includes(value as T)) {
      out.push(value as T);
    }
  }
  return out;
}

function intParam(raw: string | undefined, fallback?: number): number | undefined {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function boolFlag(raw: string | undefined): boolean | undefined {
  if (raw === "1" || raw === "true") return true;
  return undefined;
}

function attributeFilters(
  params: RawSearchParams,
): Readonly<Record<string, ReadonlyArray<string>>> | undefined {
  const out: Record<string, ReadonlyArray<string>> = {};
  for (const [key, allowed] of Object.entries(APPEARANCE_CATALOG)) {
    const raw = many(params[`attr_${key}`]);
    if (raw.length === 0) continue;
    const allowedSet = new Set(allowed as ReadonlyArray<string>);
    const accepted = raw.filter((v) => allowedSet.has(v));
    if (accepted.length > 0) out[key] = accepted;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Parse the URL search params into a typed `ListingsFilters`. Unknown values
 * are dropped; legitimate empty filters return `{}` so the caller still gets
 * the unfiltered catalog.
 */
export function parseFilters(params: RawSearchParams): ListingsFilters {
  const filters: ListingsFilters = {};

  const category = pickOne<Category>(single(params.category), CATEGORY_IDS);
  if (category) filters.category = category;

  const sex = pickOne<Sex>(single(params.sex), new Set(["mujeres"]));
  if (sex) filters.sex = sex;

  const department = single(params.department);
  if (department && DEPARTMENT_SET.has(department)) filters.department = department;

  const city = single(params.city);
  if (city && CITY_SET.has(city)) filters.city = city;

  const locality = single(params.locality);
  if (locality && LOCALITY_SET.has(locality)) filters.locality = locality;

  const search = single(params.q)?.trim();
  if (search) filters.search = search;

  const priceMin = intParam(single(params.priceMin));
  const priceMax = intParam(single(params.priceMax));
  if (priceMin !== undefined) filters.priceMin = priceMin;
  if (priceMax !== undefined) filters.priceMax = priceMax;

  const ageMin = intParam(single(params.ageMin));
  const ageMax = intParam(single(params.ageMax));
  if (ageMin !== undefined) filters.ageMin = ageMin;
  if (ageMax !== undefined) filters.ageMax = ageMax;

  if (boolFlag(single(params.verified))) filters.verifiedOnly = true;
  if (boolFlag(single(params.video))) filters.withVideo = true;
  if (boolFlag(single(params.audio))) filters.withAudio = true;
  if (boolFlag(single(params.reviews))) filters.withReviews = true;
  if (boolFlag(single(params.face))) filters.faceVisible = true;
  if (boolFlag(single(params.card))) filters.paymentByCard = true;

  const attention = pickMany<AttentionTarget>(
    many(params.attention),
    ATTENTION_IDS,
  );
  if (attention.length > 0) filters.attention = attention;

  const contactChannels = pickMany<ContactChannel>(
    many(params.contact),
    CONTACT_IDS,
  );
  if (contactChannels.length > 0) filters.contactChannels = contactChannels;

  const services = pickMany(many(params.service), SERVICE_SET);
  if (services.length > 0) filters.services = services;

  const specialServices = pickMany(many(params.special), SPECIAL_SET);
  if (specialServices.length > 0) filters.specialServices = specialServices;

  const meetingContexts = pickMany(many(params.place), MEETING_SET);
  if (meetingContexts.length > 0) filters.meetingContexts = meetingContexts;

  const attributes = attributeFilters(params);
  if (attributes) filters.attributes = attributes;

  const sortBy = single(params.sort);
  if (sortBy && SORT_VALUES.has(sortBy)) {
    filters.sortBy = sortBy as ListingsFilters["sortBy"];
  }

  const page = intParam(single(params.page), 1);
  if (page && page > 0) filters.page = page;

  return filters;
}

