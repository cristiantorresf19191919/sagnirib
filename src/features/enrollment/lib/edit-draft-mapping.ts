import type {
  ListingDraftPayload,
  UpdateListingDraftInput,
} from "@/server/biringas";

import type { AttributesValues, DetailsValues } from "./types";

/**
 * UI-shaped editable slice of a draft. Mirrors the wizard's value shapes
 * (string-typed numeric fields, mutable selections) but covers ONLY the
 * fields the owner may edit post-submit. Photos/videos/bios/publish are not
 * here — they're locked and preserved server-side.
 */
export interface EditDraftValues {
  details: DetailsValues;
  attributes: AttributesValues;
  services: ReadonlyArray<string>;
  meetingContexts: ReadonlyArray<string>;
  faceVisible: boolean;
  paymentByCard: boolean;
}

/**
 * Firestore draft payload → editable UI values (the reverse of
 * `editValuesToUpdateInput`). Numbers become strings to match the wizard's
 * input fields; the locked description text + gallery are dropped.
 */
export function draftPayloadToEditValues(
  payload: ListingDraftPayload,
): EditDraftValues {
  const d = payload.details;
  const a = payload.attributes;
  return {
    details: {
      displayName: d.displayName,
      age: d.age ? String(d.age) : "",
      city: d.city,
      locality: d.locality ?? "",
      category: d.category,
      phone: d.phone,
      preferredSlug: d.preferredSlug,
      pricePerHour: d.pricePerHour ? String(d.pricePerHour) : "",
      attention: [...d.attention] as DetailsValues["attention"],
      contactChannels: [
        ...d.contactChannels,
      ] as DetailsValues["contactChannels"],
    },
    attributes: {
      ethnicity: a.ethnicity,
      hair: a.hair,
      height: a.height,
      body: a.body,
      breastSize: a.breastSize,
      breastType: a.breastType,
      pubis: a.pubis ?? "",
      country: a.country,
      languages: [...a.languages],
    },
    services: [...payload.description.services],
    meetingContexts: [...payload.description.meetingContexts],
    faceVisible: payload.description.faceVisible,
    paymentByCard: payload.description.paymentByCard,
  };
}

/**
 * Editable UI values → `updateListingDraft` Server Action input. Coerces the
 * string-typed numeric fields back to numbers and drops the empty `pubis`
 * sentinel; the server schema re-validates everything.
 */
export function editValuesToUpdateInput(
  draftId: string,
  v: EditDraftValues,
): UpdateListingDraftInput {
  return {
    draftId,
    details: {
      displayName: v.details.displayName.trim(),
      age: Number(v.details.age),
      city: v.details.city.trim(),
      category: v.details.category as Exclude<
        DetailsValues["category"],
        ""
      >,
      phone: v.details.phone.trim(),
      preferredSlug: v.details.preferredSlug.trim(),
      pricePerHour: Number(v.details.pricePerHour),
      attention: [...v.details.attention],
      contactChannels: [...v.details.contactChannels],
    },
    services: [...v.services],
    meetingContexts: [...v.meetingContexts],
    faceVisible: v.faceVisible,
    paymentByCard: v.paymentByCard,
    attributes: {
      ethnicity: v.attributes.ethnicity.trim(),
      hair: v.attributes.hair.trim(),
      height: v.attributes.height.trim(),
      body: v.attributes.body.trim(),
      breastSize: v.attributes.breastSize.trim(),
      breastType: v.attributes.breastType.trim(),
      country: v.attributes.country.trim(),
      pubis: v.attributes.pubis.trim() || undefined,
      languages: [...v.attributes.languages],
    },
  };
}
