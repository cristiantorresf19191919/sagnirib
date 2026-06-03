import "server-only";

import type { PlanTier } from "./checkout-types";

/**
 * Domain types for the Biringa listings catalog.
 *
 * Canonical contract — both the in-memory mock and the Firebase adapter
 * import from here, and features import from `@/server/biringas` (which
 * re-exports these). Provider types (Firestore Timestamp, Document refs)
 * MUST NOT leak through this module (Addendum 001 §15 + ADR-009).
 */

export type Category = "prepagos" | "masajes" | "videollamadas";

/**
 * Per founder direction (2026-04-29) the catalog is filtered to women only;
 * the union is open so future categories can be added without a type rename.
 */
export type Sex = "mujeres" | "hombres" | "travestis";

export type AttentionTarget =
  | "hombres"
  | "mujeres"
  | "parejas"
  | "discapacitados";

export type ContactChannel = "llamada" | "whatsapp" | "telegram";

/**
 * A short-form video attached to a listing (ADR-015).
 *
 * `path` is the canonical bucket path under `listings/{slug}/videos/`
 * (post-promotion from `listing_drafts/{draftId}/videos/...`). Features
 * must NOT treat the path as a public URL; the catalog reads videos
 * through signed READ URLs minted server-side or via Firebase Storage
 * public-download semantics on the listing surface.
 *
 * `durationSeconds` is the client-reported clip length. Server-side
 * Cloud Function validation (delete-if-overrun) is a future ADR; for
 * MVP this value is trusted but capped (3..30) by the create-draft
 * schema.
 */
export interface BiringaVideo {
  path: string;
  durationSeconds: number;
}

export interface BiringaAttributes {
  ethnicity?: string;
  hair?: string;
  height?: string;
  body?: string;
  breastSize?: string;
  breastType?: string;
  pubis?: string;
  country?: string;
  languages?: ReadonlyArray<string>;
}

export interface BiringaReputation {
  daysAdvertised: number;
  daysSinceVerification: number;
  storiesRecorded: number;
  score: number;
  totalViews: number;
  daysFeatured: number;
  /** Public review count — drives the "Con experiencias" content filter. */
  reviewCount: number;
}

export interface BiringaListing {
  id: string;
  slug: string;
  name: string;
  age: number;
  city: string;
  neighborhood?: string;
  pricePerHour: number;
  mainImage: string;
  gallery: ReadonlyArray<string>;
  verified: boolean;
  /**
   * True iff `videos.length > 0`. Kept as a stored boolean for cheap
   * Firestore equality queries (`withVideo` catalog filter) — the
   * write path keeps it in sync with the videos array.
   */
  hasVideo: boolean;
  /**
   * Owner-uploaded short clips (ADR-015). At most
   * `STORAGE_LIMITS.videoMaxPerListing` entries (today: 2). Absent /
   * empty when the listing has no videos — the catalog surfaces hide
   * the player and the play overlay.
   */
  videos?: ReadonlyArray<BiringaVideo>;
  hasAudio: boolean;
  tags: ReadonlyArray<string>;
  bio: string;
  /** Surfaced in the catalog header strip — short bio. */
  shortBio: string;

  /** Catalog routing — `prepagos | masajes | videollamadas`. */
  category: Category;
  /** All current listings are `mujeres`; field stays for future variants. */
  sex: Sex;
  /** Audiences this listing accepts. */
  attention: ReadonlyArray<AttentionTarget>;
  /** Channels through which the listing accepts contact. */
  contactChannels: ReadonlyArray<ContactChannel>;
  /** True when the listing accepts card payments. */
  paymentByCard: boolean;
  /** True when face is visible in the public photos. */
  faceVisible: boolean;
  /** ISO time of the most recent story; drives "Grabada a las HH:MM". */
  storyAt?: string;

  /** NEVER render in HTML — contracted via authenticated backend only. */
  privatePhone?: string;
  /** NEVER render in HTML — contracted via authenticated backend only. */
  privateWhatsapp?: string;

  reputation: BiringaReputation;
  attributes: BiringaAttributes;

  services: ReadonlyArray<string>;
  /** Niche / special services. */
  specialServices: ReadonlyArray<string>;
  meetingContexts: ReadonlyArray<string>;

  coords: { lat: number; lng: number };
  createdAt: string;
  updatedAt: string;
  /**
   * Set when the listing transitions to `verified: true`. Drives the
   * "Verificada — hace Xd" tile on the profile page. For listings
   * verified before this field existed, the mapper falls back to
   * `createdAt` so the tile never reads as "hace 0d" by accident.
   */
  verifiedAt?: string;

  /**
   * Active paid plan, if any. Drives the "Destacada" badge (any active
   * plan) and future tier-specific perks (e.g. an "Elite" ribbon when
   * `tier === 'elite'`). `undefined` means the listing is on the free
   * tier and no paid-plan UI affordances should render.
   *
   * Lifecycle (to be wired when the checkout flow goes live — today
   * planes están deshabilitados):
   *   1. `createCheckoutSession` mints the session.
   *   2. The payment provider's webhook (or `completeMockCheckout` in
   *      dev) flips the session to `succeeded` and writes this `plan`
   *      onto every listing owned by the buyer with
   *      `activeUntil = now + cadence`.
   *   3. A scheduled job (or read-time check) clears the field once
   *      `activeUntil` is in the past.
   *
   * Read-time check: `plan && new Date(plan.activeUntil) > new Date()`.
   * Use `isPlanActive(listing)` from the barrel — never inline that
   * comparison at call sites.
   */
  plan?: {
    tier: PlanTier;
    /** ISO timestamp. The plan stops counting as active at this moment. */
    activeUntil: string;
  };
}

export interface ListingsFilters {
  category?: Category;
  sex?: Sex;
  /** Department name. Filters to listings whose city belongs to it (derived). */
  department?: string;
  city?: string;
  /** Locality/zone within the city (matches the listing's `neighborhood`). */
  locality?: string;
  search?: string;
  priceMin?: number;
  priceMax?: number;
  ageMin?: number;
  ageMax?: number;
  verifiedOnly?: boolean;
  withVideo?: boolean;
  withAudio?: boolean;
  withReviews?: boolean;
  faceVisible?: boolean;
  paymentByCard?: boolean;
  attention?: ReadonlyArray<AttentionTarget>;
  contactChannels?: ReadonlyArray<ContactChannel>;
  services?: ReadonlyArray<string>;
  specialServices?: ReadonlyArray<string>;
  meetingContexts?: ReadonlyArray<string>;
  /** Free-form attribute filters: `attributes.country`, `attributes.pubis`, etc. */
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

/**
 * Aggregate counters for the public catalog. Powers the home hero's
 * trust one-liner ("N acompañantes verificadas, activas hoy en M
 * ciudades") and any future surface that needs headline numbers without
 * loading the listings themselves.
 *
 * Both fields are computed provider-side via cheap aggregation (Firestore
 * `count()` per the schema's existing indexes) — never by paging the full
 * catalog into memory at the call site.
 */
export interface CatalogStats {
  /** Listings with `verified: true`. */
  verifiedCount: number;
  /** Distinct cities that currently have at least one verified listing. */
  activeCityCount: number;
}
