import "server-only";

import type { ActionInputSchema } from "@/server/security/validate-action-input";
import { APPEARANCE_CATALOG } from "@/server/mocks/biringas/data";
import { STORAGE_LIMITS } from "@/server/storage/types";

import {
  type CreateListingDraftInput,
  DRAFT_LIMITS,
  type ListingDraftPayload,
  type ListingDraftPayloadAttributes,
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
    const sessionId = expectString(r.sessionId, "sessionId", 8, 64);
    if (!/^[a-zA-Z0-9_-]+$/.test(sessionId)) {
      throw new Error(
        "createListingDraft: sessionId must be alphanumeric / dash / underscore",
      );
    }
    const payload = r.payload as Record<string, unknown>;

    return {
      sessionId,
      payload: {
        details: parseDetails(payload.details),
        description: parseDescription(payload.description),
        attributes: parseAttributes(payload.attributes),
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
    gallery: expectStagingPhotoArray(
      d.gallery,
      "description.gallery",
      0,
      DRAFT_LIMITS.galleryMax,
    ),
    videos: expectStagingVideoArray(
      d.videos,
      "description.videos",
      0,
      STORAGE_LIMITS.videoMaxPerListing,
    ),
  };
}

/**
 * Strict shape of a staging video path (ADR-015). Mirrors the photo
 * regex with the video sub-prefix + extensions.
 */
const STAGING_VIDEO_PATH_REGEX =
  /^users\/([A-Za-z0-9_-]{6,128})\/staging\/([A-Za-z0-9_-]{8,64})\/videos\/([0-9a-f]{8,64})\.(mp4|webm)$/;

function expectStagingVideoArray(
  value: unknown,
  field: string,
  min: number,
  max: number,
): ReadonlyArray<{ path: string; durationSeconds: number }> {
  if (value === undefined || value === null) {
    // Backwards-compat: drafts created before ADR-015 omitted `videos`.
    // Treat absent as empty array.
    if (min > 0) {
      throw new Error(
        `createListingDraft: ${field} must have at least ${min} item(s)`,
      );
    }
    return [];
  }
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
  const seen = new Set<string>();
  const out: { path: string; durationSeconds: number }[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") {
      throw new Error(`createListingDraft: ${field} items must be objects`);
    }
    const rec = item as Record<string, unknown>;
    if (typeof rec.path !== "string") {
      throw new Error(
        `createListingDraft: ${field}[].path must be a string`,
      );
    }
    const path = rec.path.trim();
    if (!STAGING_VIDEO_PATH_REGEX.test(path)) {
      throw new Error(
        `createListingDraft: ${field}[].path is not a valid staging video path`,
      );
    }
    if (seen.has(path)) {
      throw new Error(
        `createListingDraft: ${field} has duplicate path ${path}`,
      );
    }
    seen.add(path);

    if (
      typeof rec.durationSeconds !== "number" ||
      !Number.isFinite(rec.durationSeconds)
    ) {
      throw new Error(
        `createListingDraft: ${field}[].durationSeconds must be a finite number`,
      );
    }
    if (
      rec.durationSeconds < STORAGE_LIMITS.videoMinDurationSeconds ||
      rec.durationSeconds > STORAGE_LIMITS.videoMaxDurationSeconds
    ) {
      throw new Error(
        `createListingDraft: ${field}[].durationSeconds must be between ${STORAGE_LIMITS.videoMinDurationSeconds} and ${STORAGE_LIMITS.videoMaxDurationSeconds}`,
      );
    }

    out.push({ path, durationSeconds: rec.durationSeconds });
  }
  return out;
}

/**
 * Strict shape of a staging photo path the wizard is allowed to submit.
 *
 * The barrel does an ADDITIONAL check later that the `users/{uid}` segment
 * equals the authenticated caller's uid — schema-time we only know the
 * shape is well-formed. This double-check is intentional: a malformed path
 * at schema time short-circuits before any auth call, and a forged uid at
 * the barrel layer fails after `requireAuth`. Both layers cooperate.
 */
const STAGING_PHOTO_PATH_REGEX =
  /^users\/([A-Za-z0-9_-]{6,128})\/staging\/([A-Za-z0-9_-]{8,64})\/photos\/([0-9a-f]{8,64})\.(jpg|webp)$/;

function expectStagingPhotoArray(
  value: unknown,
  field: string,
  min: number,
  max: number,
): ReadonlyArray<{ path: string }> {
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
  const seen = new Set<string>();
  const out: { path: string }[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") {
      throw new Error(`createListingDraft: ${field} items must be objects`);
    }
    const rec = item as Record<string, unknown>;
    if (typeof rec.path !== "string") {
      throw new Error(
        `createListingDraft: ${field}[].path must be a string`,
      );
    }
    const path = rec.path.trim();
    if (!STAGING_PHOTO_PATH_REGEX.test(path)) {
      throw new Error(
        `createListingDraft: ${field}[].path is not a valid staging photo path`,
      );
    }
    if (seen.has(path)) {
      throw new Error(
        `createListingDraft: ${field} has duplicate path ${path}`,
      );
    }
    seen.add(path);
    out.push({ path });
  }
  return out;
}

function parseAttributes(raw: unknown): ListingDraftPayloadAttributes {
  if (!raw || typeof raw !== "object") {
    throw new Error("createListingDraft: payload.attributes must be an object");
  }
  const d = raw as Record<string, unknown>;

  // Required appearance fields — values constrained to APPEARANCE_CATALOG so a
  // hand-crafted POST cannot land arbitrary strings in the published profile's
  // Characteristics block.
  const country = expectEnum(
    d.country,
    "attributes.country",
    APPEARANCE_CATALOG.country,
  );
  const ethnicity = expectEnum(
    d.ethnicity,
    "attributes.ethnicity",
    APPEARANCE_CATALOG.ethnicity,
  );
  const hair = expectEnum(d.hair, "attributes.hair", APPEARANCE_CATALOG.hair);
  const height = expectEnum(
    d.height,
    "attributes.height",
    APPEARANCE_CATALOG.height,
  );
  const body = expectEnum(d.body, "attributes.body", APPEARANCE_CATALOG.body);
  const breast = expectEnum(
    d.breast,
    "attributes.breast",
    APPEARANCE_CATALOG.breast,
  );

  // `pubis` is optional. The wizard collapses "" → undefined before sending,
  // but accept either shape (undefined OR omitted key) here.
  let pubis: string | undefined;
  if (d.pubis !== undefined && d.pubis !== null && d.pubis !== "") {
    pubis = expectEnum(d.pubis, "attributes.pubis", APPEARANCE_CATALOG.pubis);
  }

  // Languages are open-ended (no enum) but trimmed + bounded so a forged
  // submission cannot stuff arbitrary blobs into the listing.
  const languages = expectStringArray(
    d.languages ?? [],
    "attributes.languages",
    0,
    DRAFT_LIMITS.languagesMax,
  );

  return {
    country,
    ethnicity,
    hair,
    height,
    body,
    breast,
    pubis,
    languages,
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
