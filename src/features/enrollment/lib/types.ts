import type { AddOnId, BillingCycle, PackageId } from "./pricing";

export type StepId = "details" | "description" | "attributes" | "publish";

export interface DetailsValues {
  displayName: string;
  age: string;
  city: string;
  category: "prepagos" | "masajes" | "videollamadas" | "";
  phone: string;
  preferredSlug: string;
  pricePerHour: string;
  attention: ReadonlyArray<"hombres" | "mujeres" | "parejas" | "discapacitados">;
  contactChannels: ReadonlyArray<"llamada" | "whatsapp" | "telegram">;
}

export type GalleryItemStatus =
  | "queued"
  | "compressing"
  | "uploading"
  | "ready"
  | "error";

export interface GalleryItem {
  /** Stable client-side id used as React key. */
  id: string;
  /** Original filename; surfaced in screen-reader labels and error messages. */
  name: string;
  /** Blob URL used to render the local preview. Revoked when the item is removed. */
  previewUrl: string;
  /** The user-selected File. Replaced with the compressed File once compression succeeds. */
  file: File;
  /** Per-photo lifecycle state — drives spinners, progress, and submit-gate logic. */
  status: GalleryItemStatus;
  /** Canonical staging path returned by the storage port once the upload + confirm
   *  round-trip succeeds. `undefined` until `status === "ready"`. */
  uploadedPath?: string;
  /** Friendly error string for this single photo. Surfaced under the thumbnail. */
  errorMessage?: string;
  /** Bytes after client-side compression. Useful for debugging in dev. */
  compressedSize?: number;
}

export type VideoItemStatus =
  | "queued"
  | "validating"
  | "uploading"
  | "ready"
  | "error";

/**
 * Per-video lifecycle entry in the wizard (ADR-015). Mirrors
 * `GalleryItem` but swaps `compressing` for `validating` since videos
 * are not compressed client-side.
 */
export interface VideoItem {
  /** Stable client-side id used as React key. */
  id: string;
  /** Original filename. */
  name: string;
  /** Blob URL for the local `<video>` preview. Revoked when removed. */
  previewUrl: string;
  /** The user-selected File. */
  file: File;
  /** Lifecycle status — drives spinners and submit-gate logic. */
  status: VideoItemStatus;
  /** Canonical staging path returned by the storage port once ready. */
  uploadedPath?: string;
  /** Client-measured duration in seconds. Populated after validation. */
  durationSeconds?: number;
  /** Friendly error message — surfaced under the thumbnail. */
  errorMessage?: string;
}

export interface DescriptionValues {
  shortBio: string;
  bio: string;
  services: ReadonlyArray<string>;
  meetingContexts: ReadonlyArray<string>;
  faceVisible: boolean;
  paymentByCard: boolean;
  gallery: ReadonlyArray<GalleryItem>;
  /** Short-form video clips (ADR-015). Empty by default. Max 2. */
  videos: ReadonlyArray<VideoItem>;
}

export interface PublishValues {
  packageId: PackageId;
  addOnIds: ReadonlyArray<AddOnId>;
  billing: BillingCycle;
  acceptsTerms: boolean;
  acceptsAdult: boolean;
}

/**
 * UI-shaped attribute selections. Each single-choice field is `""` until
 * the modelo picks a value from the catalog; the server schema rejects `""`
 * so wizard validation forces a choice before advancing past the step.
 */
export interface AttributesValues {
  ethnicity: string;
  hair: string;
  height: string;
  body: string;
  breast: string;
  pubis: string;
  country: string;
  languages: ReadonlyArray<string>;
}

export interface EnrollmentDraft {
  details: DetailsValues;
  description: DescriptionValues;
  attributes: AttributesValues;
  publish: PublishValues;
}

export const INITIAL_DRAFT: EnrollmentDraft = {
  details: {
    displayName: "",
    age: "",
    city: "",
    category: "",
    phone: "",
    preferredSlug: "",
    pricePerHour: "",
    attention: [],
    contactChannels: [],
  },
  description: {
    shortBio: "",
    bio: "",
    services: [],
    meetingContexts: [],
    faceVisible: false,
    paymentByCard: false,
    gallery: [],
    videos: [],
  },
  attributes: {
    ethnicity: "",
    hair: "",
    height: "",
    body: "",
    breast: "",
    pubis: "",
    country: "",
    languages: [],
  },
  publish: {
    // MVP launch: default to "esencial" so the cards render with no card
    // selected (PLANS_ENABLED gates the visual selection). When plans turn
    // on, swap back to "destacada" — that's our conversion target.
    packageId: "esencial",
    addOnIds: [],
    billing: "monthly",
    acceptsTerms: false,
    acceptsAdult: false,
  },
};
