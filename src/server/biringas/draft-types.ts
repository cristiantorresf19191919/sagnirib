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

/**
 * One photo attached to the draft. `path` is the canonical bucket path the
 * Storage adapter copied into `listing_drafts/{draftId}/photos/...`
 * (post-copy from staging — ADR-012). Features must NOT treat the path as a
 * public URL; previews go through short-lived signed READ URLs minted
 * server-side on demand.
 */
export interface ListingDraftPhoto {
  path: string;
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
   * Photos attached to this draft. Empty array is allowed (modelo can still
   * submit a draft for human review without photos — admin attaches the
   * KYC-verified ones at approval time). When non-empty, each entry holds
   * the canonical draft path (e.g. `listing_drafts/<draftId>/photos/<id>.jpg`).
   */
  gallery: ReadonlyArray<ListingDraftPhoto>;
}

export interface ListingDraftPayloadPublish {
  packageId: string;
  addOnIds: ReadonlyArray<string>;
  billing: "monthly" | "quarterly";
  acceptsTerms: boolean;
  acceptsAdult: boolean;
}

/**
 * Appearance attributes captured by the wizard. Mirrors `BiringaAttributes`
 * on the public listing side so that approving a draft → listing is a 1:1
 * field copy. `pubis` and `languages` are optional (the public profile's
 * Characteristics block does not require them); the other six are required
 * so the profile never renders "—" for a freshly-published listing.
 */
export interface ListingDraftPayloadAttributes {
  ethnicity: string;
  hair: string;
  height: string;
  body: string;
  breast: string;
  country: string;
  pubis?: string;
  languages: ReadonlyArray<string>;
}

export interface ListingDraftPayload {
  details: ListingDraftPayloadDetails;
  description: ListingDraftPayloadDescription;
  attributes: ListingDraftPayloadAttributes;
  publish: ListingDraftPayloadPublish;
}

/**
 * Full read shape of a stored draft. Distinct from `DraftSummary` (the
 * lightweight projection used in the dashboard list) — this carries the
 * full `payload` so the owner-side detail view can render every field
 * the modelo submitted.
 *
 * `rejectionReason` is only present when `status === "rejected"`.
 */
export interface ListingDraftRecord {
  id: string;
  ownerUid: string;
  status: ListingDraftStatus;
  payload: ListingDraftPayload;
  submittedAt: string;
  rejectionReason?: string;
}

/**
 * Input accepted by the public Server Action / barrel function. The wizard
 * sends UI-friendly string-typed fields; the schema (`create-draft-schema.ts`)
 * trims and coerces them into this shape.
 *
 * `sessionId` ties the submit back to the wizard's upload session, so the
 * barrel can call `copyStagedToDraftForOwner(uid, { sessionId, draftId, paths })`
 * with the correct scope. The schema validates the format; ownership of the
 * staged blobs is verified at copy time by the storage adapter.
 */
export interface CreateListingDraftInput {
  sessionId: string;
  payload: ListingDraftPayload;
}

/**
 * Adapter-facing input. The barrel injects `ownerUid` (from `requireAuth`)
 * and `draftId` (server-minted via UUID v4) so adapters never trust those
 * values from the wire. The `payload.description.gallery` paths at this
 * stage are the FINAL draft paths (post-copy), never staging paths.
 */
export interface CreateListingDraftRawInput {
  ownerUid: string;
  draftId: string;
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
  languagesMax: 12,
} as const;
