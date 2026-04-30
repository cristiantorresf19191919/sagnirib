import type { AddOnId, BillingCycle, PackageId } from "./pricing";

export type StepId = "details" | "description" | "publish";

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

export interface DescriptionValues {
  shortBio: string;
  bio: string;
  services: ReadonlyArray<string>;
  meetingContexts: ReadonlyArray<string>;
  faceVisible: boolean;
  paymentByCard: boolean;
  availableNow: boolean;
  /** Mocked file names — real upload lands behind a server adapter. */
  galleryFileNames: ReadonlyArray<string>;
}

export interface PublishValues {
  packageId: PackageId;
  addOnIds: ReadonlyArray<AddOnId>;
  billing: BillingCycle;
  acceptsTerms: boolean;
  acceptsAdult: boolean;
}

export interface EnrollmentDraft {
  details: DetailsValues;
  description: DescriptionValues;
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
    availableNow: false,
    galleryFileNames: [],
  },
  publish: {
    packageId: "destacada",
    addOnIds: [],
    billing: "monthly",
    acceptsTerms: false,
    acceptsAdult: false,
  },
};
