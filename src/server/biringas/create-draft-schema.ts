import "server-only";

import type { ActionInputSchema } from "@/server/security/validate-action-input";

import {
  type CreateListingDraftInput,
  DRAFT_LIMITS,
  type ListingDraftPayload,
  type ListingDraftPayloadDescription,
  type ListingDraftPayloadDetails,
  type ListingDraftPayloadPublish,
} from "./draft-types";

/**
 * Manual validator for `createListingDraft`. Trims, coerces, and bounds every
 * field. The wizard already validates on the client for UX, but the server
 * is the only source of truth — the action is reachable by direct POST.
 *
 * Errors are intentionally generic ("field X must be …") so the client
 * surface can map them once. Field-level surfacing happens UI-side from the
 * wizard's `validateCurrent`; this layer is the safety net.
 */
export const createListingDraftSchema: ActionInputSchema<CreateListingDraftInput> = {
  parse(input: unknown): CreateListingDraftInput {
    if (!input || typeof input !== "object") {
      throw new Error("createListingDraft: input must be an object");
    }
    const r = input as Record<string, unknown>;
    if (!r.payload || typeof r.payload !== "object") {
      throw new Error("createListingDraft: payload must be an object");
    }
    const payload = r.payload as Record<string, unknown>;

    return {
      payload: {
        details: parseDetails(payload.details),
        description: parseDescription(payload.description),
        publish: parsePublish(payload.publish),
      } satisfies ListingDraftPayload,
    };
  },
};

function parseDetails(raw: unknown): ListingDraftPayloadDetails {
  if (!raw || typeof raw !== "object") {
    throw new Error("createListingDraft: payload.details must be an object");
  }
  const d = raw as Record<string, unknown>;

  const displayName = expectString(
    d.displayName,
    "details.displayName",
    1,
    DRAFT_LIMITS.displayNameMax,
  );
  const age = expectInt(
    d.age,
    "details.age",
    DRAFT_LIMITS.ageMin,
    DRAFT_LIMITS.ageMax,
  );
  const city = expectString(d.city, "details.city", 1, DRAFT_LIMITS.cityMax);
  const category = expectEnum(d.category, "details.category", [
    "prepagos",
    "masajes",
    "videollamadas",
  ] as const);
  const phone = expectString(d.phone, "details.phone", 1, DRAFT_LIMITS.phoneMax);
  const preferredSlug = expectString(
    d.preferredSlug,
    "details.preferredSlug",
    1,
    DRAFT_LIMITS.preferredSlugMax,
  );
  const pricePerHour = expectInt(
    d.pricePerHour,
    "details.pricePerHour",
    DRAFT_LIMITS.pricePerHourMin,
    DRAFT_LIMITS.pricePerHourMax,
  );
  const attention = expectStringArray(
    d.attention,
    "details.attention",
    0,
    DRAFT_LIMITS.attentionMax,
  );
  const contactChannels = expectStringArray(
    d.contactChannels,
    "details.contactChannels",
    1,
    DRAFT_LIMITS.contactChannelsMax,
  );

  return {
    displayName,
    age,
    city,
    category,
    phone,
    preferredSlug,
    pricePerHour,
    attention,
    contactChannels,
  };
}

function parseDescription(raw: unknown): ListingDraftPayloadDescription {
  if (!raw || typeof raw !== "object") {
    throw new Error("createListingDraft: payload.description must be an object");
  }
  const d = raw as Record<string, unknown>;

  return {
    shortBio: expectString(
      d.shortBio,
      "description.shortBio",
      1,
      DRAFT_LIMITS.shortBioMax,
    ),
    bio: expectString(d.bio, "description.bio", 60, DRAFT_LIMITS.bioMax),
    services: expectStringArray(
      d.services,
      "description.services",
      1,
      DRAFT_LIMITS.servicesMax,
    ),
    meetingContexts: expectStringArray(
      d.meetingContexts,
      "description.meetingContexts",
      0,
      DRAFT_LIMITS.meetingContextsMax,
    ),
    faceVisible: expectBool(d.faceVisible, "description.faceVisible"),
    paymentByCard: expectBool(d.paymentByCard, "description.paymentByCard"),
    availableNow: expectBool(d.availableNow, "description.availableNow"),
    gallery: expectStringArray(
      d.gallery,
      "description.gallery",
      0,
      DRAFT_LIMITS.galleryMax,
    ),
  };
}

function parsePublish(raw: unknown): ListingDraftPayloadPublish {
  if (!raw || typeof raw !== "object") {
    throw new Error("createListingDraft: payload.publish must be an object");
  }
  const d = raw as Record<string, unknown>;

  const acceptsTerms = expectBool(d.acceptsTerms, "publish.acceptsTerms");
  const acceptsAdult = expectBool(d.acceptsAdult, "publish.acceptsAdult");
  if (!acceptsTerms || !acceptsAdult) {
    throw new Error(
      "createListingDraft: must accept terms and confirm adult age",
    );
  }

  return {
    packageId: expectString(d.packageId, "publish.packageId", 1, 64),
    addOnIds: expectStringArray(
      d.addOnIds,
      "publish.addOnIds",
      0,
      DRAFT_LIMITS.addOnsMax,
    ),
    billing: expectEnum(d.billing, "publish.billing", [
      "monthly",
      "quarterly",
    ] as const),
    acceptsTerms,
    acceptsAdult,
  };
}

// ---------- primitive expecters --------------------------------------------

function expectString(
  value: unknown,
  field: string,
  min: number,
  max: number,
): string {
  if (typeof value !== "string") {
    throw new Error(`createListingDraft: ${field} must be a string`);
  }
  const trimmed = value.trim();
  if (trimmed.length < min) {
    throw new Error(
      `createListingDraft: ${field} must be at least ${min} character(s)`,
    );
  }
  if (trimmed.length > max) {
    throw new Error(
      `createListingDraft: ${field} must be at most ${max} character(s)`,
    );
  }
  return trimmed;
}

function expectInt(
  value: unknown,
  field: string,
  min: number,
  max: number,
): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`createListingDraft: ${field} must be an integer`);
  }
  if (value < min || value > max) {
    throw new Error(
      `createListingDraft: ${field} must be between ${min} and ${max}`,
    );
  }
  return value;
}

function expectBool(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`createListingDraft: ${field} must be a boolean`);
  }
  return value;
}

function expectEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: ReadonlyArray<T>,
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(
      `createListingDraft: ${field} must be one of ${allowed.join(", ")}`,
    );
  }
  return value as T;
}

function expectStringArray(
  value: unknown,
  field: string,
  min: number,
  max: number,
): ReadonlyArray<string> {
  if (!Array.isArray(value)) {
    throw new Error(`createListingDraft: ${field} must be an array`);
  }
  if (value.length < min) {
    throw new Error(
      `createListingDraft: ${field} must have at least ${min} item(s)`,
    );
  }
  if (value.length > max) {
    throw new Error(
      `createListingDraft: ${field} must have at most ${max} item(s)`,
    );
  }
  for (const item of value) {
    if (typeof item !== "string") {
      throw new Error(`createListingDraft: ${field} items must be strings`);
    }
  }
  return value.map((s: string) => s.trim()).filter((s) => s.length > 0);
}
