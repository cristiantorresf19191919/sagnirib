import "server-only";

import type { ActionInputSchema } from "@/server/security/validate-action-input";

import {
  expectBool,
  expectString,
  expectStringArray,
  parseAttributes,
  parseDetails,
} from "./create-draft-schema";
import {
  DRAFT_LIMITS,
  type ListingDraftPayloadAttributes,
  type ListingDraftPayloadDetails,
} from "./draft-types";

/**
 * Editable subset of a `pending_review` draft (owner-side edit flow).
 *
 * Deliberately NARROWER than `CreateListingDraftInput`: the photos/videos
 * (`gallery`/`videos`) and the free-text descriptions (`shortBio`/`bio`)
 * are LOCKED once submitted — changing them means starting a fresh publish.
 * The publish/billing block is also immutable here. The barrel merges this
 * subset onto the stored payload, preserving every locked field.
 */
export interface UpdateListingDraftInput {
  draftId: string;
  details: ListingDraftPayloadDetails;
  services: ReadonlyArray<string>;
  meetingContexts: ReadonlyArray<string>;
  faceVisible: boolean;
  paymentByCard: boolean;
  attributes: ListingDraftPayloadAttributes;
}

/**
 * Manual validator for `updateListingDraft`. Reuses the create-flow field
 * validators (`parseDetails` / `parseAttributes` / the primitive expecters)
 * so the bounds + enum constraints stay identical to the create path — a
 * single source of truth for what a valid draft looks like.
 *
 * Reachable by direct POST, so this is the only authority on the shape: the
 * client form validates for UX, this layer is the safety net.
 */
export const updateListingDraftSchema: ActionInputSchema<UpdateListingDraftInput> =
  {
    parse(input: unknown): UpdateListingDraftInput {
      if (!input || typeof input !== "object") {
        throw new Error("updateListingDraft: input must be an object");
      }
      const r = input as Record<string, unknown>;
      const draftId = expectString(r.draftId, "draftId", 8, 128);
      if (!/^[A-Za-z0-9_-]+$/.test(draftId)) {
        throw new Error(
          "updateListingDraft: draftId must be alphanumeric / dash / underscore",
        );
      }
      return {
        draftId,
        details: parseDetails(r.details),
        services: expectStringArray(
          r.services,
          "services",
          1,
          DRAFT_LIMITS.servicesMax,
        ),
        meetingContexts: expectStringArray(
          r.meetingContexts,
          "meetingContexts",
          0,
          DRAFT_LIMITS.meetingContextsMax,
        ),
        faceVisible: expectBool(r.faceVisible, "faceVisible"),
        paymentByCard: expectBool(r.paymentByCard, "paymentByCard"),
        attributes: parseAttributes(r.attributes),
      };
    },
  };
