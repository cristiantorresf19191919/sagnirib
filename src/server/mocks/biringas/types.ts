import "server-only";

/**
 * Domain types for the Biringa listings catalog.
 *
 * This is the contract that features import — the same shape the eventual
 * Firebase adapter (src/server/adapters/firebase/biringas/) will return.
 * Provider types must NOT leak through here (Addendum 001 §15 + ADR-009).
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

export interface BiringaAttributes {
  ethnicity?: string;
  hair?: string;
  height?: string;
  body?: string;
  breast?: string;
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
  hasVideo: boolean;
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
  /** True when the listing flagged immediate availability. */
  availableNow: boolean;
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
}

export interface ListingsFilters {
  category?: Category;
  sex?: Sex;
  city?: string;
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
  availableNow?: boolean;
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
