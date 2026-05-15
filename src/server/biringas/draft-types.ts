import "server-only";

/**
 * Domain types for the `listing_drafts` collection (ADR-011).
 *
 * `payload` mirrors the wizard's `EnrollmentDraft` but is independent of it:
 * the wizard can change UI-only fields without forcing a schema migration.
 * Add a new top-level field here when the persisted shape changes, not when
 * the form UI shifts.
 */

export type ListingDraftStatus = "pending_review" | "approved" | "rejected";

export interface ListingDraftPayloadDetails {
  displayName: string;
  age: number;
  city: string;
  category: "prepagos" | "masajes" | "videollamadas";
  phone: string;
  preferredSlug: string;
  pricePerHour: number;
  attention: ReadonlyArray<string>;
  contactChannels: ReadonlyArray<string>;
}

export interface ListingDraftPayloadDescription {
  shortBio: string;
  bio: string;
  services: ReadonlyArray<string>;
  meetingContexts: ReadonlyArray<string>;
  faceVisible: boolean;
  paymentByCard: boolean;
  availableNow: boolean;
  /**
   * Placeholder gallery — names / labels supplied by the wizard. Replaced
   * with Firebase Storage URLs once PR2b lands.
   */
  gallery: ReadonlyArray<string>;
}

export interface ListingDraftPayloadPublish {
  packageId: string;
  addOnIds: ReadonlyArray<string>;
  billing: "monthly" | "quarterly";
  acceptsTerms: boolean;
  acceptsAdult: boolean;
}

export interface ListingDraftPayload {
  details: ListingDraftPayloadDetails;
  description: ListingDraftPayloadDescription;
  publish: ListingDraftPayloadPublish;
}

/**
 * Input accepted by the public Server Action / barrel function. The wizard
 * sends UI-friendly string-typed fields; the schema (`create-draft-schema.ts`)
 * trims and coerces them into this shape.
 */
export interface CreateListingDraftInput {
  payload: ListingDraftPayload;
}

/**
 * Adapter-facing input. The barrel injects `ownerUid` from `requireAuth`,
 * so adapters never trust an `ownerUid` from the wire.
 */
export interface CreateListingDraftRawInput {
  ownerUid: string;
  payload: ListingDraftPayload;
}

/**
 * Wizard-side validation limits, mirrored on the server for friendly errors.
 * Server is the source of truth.
 */
export const DRAFT_LIMITS = {
  displayNameMax: 80,
  shortBioMax: 240,
  bioMax: 2000,
  preferredSlugMax: 80,
  phoneMax: 32,
  cityMax: 80,
  ageMin: 18,
  ageMax: 99,
  pricePerHourMin: 1,
  pricePerHourMax: 100_000_000,
  servicesMax: 30,
  meetingContextsMax: 30,
  attentionMax: 10,
  contactChannelsMax: 10,
  galleryMax: 24,
  addOnsMax: 20,
} as const;
