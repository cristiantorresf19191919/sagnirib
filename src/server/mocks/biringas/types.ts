import "server-only";

/**
 * Domain types for the Biringa listings catalog.
 *
 * This is the contract that features import — the same shape the eventual
 * Firebase adapter (src/server/adapters/firebase/biringas/) will return.
 * Provider types must NOT leak through here (Addendum 001 §15 + ADR-009).
 *
 * Adapted from the legacy mock model with intake-driven changes:
 *   - `slug` is the canonical handle in URLs (`/p/[slug]`); legacy `id` was
 *     numeric.
 *   - `services` = companion / event / travel catalog (per intake Bloque A).
 *   - `meetingContexts` replaces legacy `meetingPlaces` to match real product
 *     framing (eventos, viajes, hoteles, salidas).
 *   - `attributes` drops the legacy `pubis` field — it added no signal to the
 *     surfaces we plan to ship and reintroducing it requires an explicit
 *     contract change.
 *   - Private contact fields (`phone`, `whatsapp`) live in the type but MUST
 *     never be serialized into HTML responses (p-slug.md contract).
 */
export interface BiringaAttributes {
  ethnicity?: string;
  hair?: string;
  height?: string;
  body?: string;
  breast?: string;
  country?: string;
  languages?: ReadonlyArray<string>;
}

export interface BiringaReputation {
  /** Days the listing has been live. */
  daysAdvertised: number;
  /** Days since the last verification check. */
  daysSinceVerification: number;
  /** Number of approved video stories. */
  storiesRecorded: number;
  /** Aggregate review score (0–5). */
  score: number;
  /** Cumulative views across surfaces. */
  totalViews: number;
  /** Days the listing has been promoted. */
  daysFeatured: number;
}

export interface BiringaListing {
  id: string;
  slug: string;
  name: string;
  age: number;
  city: string;
  neighborhood?: string;
  /** Hourly rate in COP (Colombian pesos). */
  pricePerHour: number;
  mainImage: string;
  gallery: ReadonlyArray<string>;
  verified: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  tags: ReadonlyArray<string>;
  bio: string;
  /** NEVER render in HTML — contracted via authenticated backend only. */
  privatePhone?: string;
  /** NEVER render in HTML — contracted via authenticated backend only. */
  privateWhatsapp?: string;
  reputation: BiringaReputation;
  attributes: BiringaAttributes;
  services: ReadonlyArray<string>;
  meetingContexts: ReadonlyArray<string>;
  coords: { lat: number; lng: number };
  createdAt: string;
  updatedAt: string;
}

export interface ListingsFilters {
  city?: string;
  search?: string;
  priceMin?: number;
  priceMax?: number;
  ageMin?: number;
  ageMax?: number;
  verifiedOnly?: boolean;
  withVideo?: boolean;
  withAudio?: boolean;
  services?: ReadonlyArray<string>;
  meetingContexts?: ReadonlyArray<string>;
  attributes?: Readonly<Record<string, ReadonlyArray<string>>>;
  sortBy?: "recent" | "price_asc" | "price_desc" | "rating";
  page?: number;
  pageSize?: number;
}

export interface PaginatedListings {
  data: ReadonlyArray<BiringaListing>;
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
