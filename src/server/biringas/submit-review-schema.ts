import "server-only";

import type { ActionInputSchema } from "@/server/security/validate-action-input";

import {
  REVIEW_LIMITS,
  type SubmitReviewInput,
} from "./review-types";

/**
 * Manual validator for `submitReview`. Throws on any invalid field with a
 * message that names the failing field, so the action layer can surface
 * field-level errors to the UI.
 *
 * Server is the source of truth — UI mirrors with REVIEW_LIMITS for UX, but
 * never trust the client.
 */
export const submitReviewSchema: ActionInputSchema<SubmitReviewInput> = {
  parse(input: unknown): SubmitReviewInput {
    if (!input || typeof input !== "object") {
      throw new Error("submitReview: input must be an object");
    }
    const r = input as Record<string, unknown>;

    const listingSlug = expectString(r.listingSlug, "listingSlug", 1, 200);
    const rating = expectInt(r.rating, "rating", 1, 5);
    const body = expectString(
      r.body,
      "body",
      REVIEW_LIMITS.bodyMin,
      REVIEW_LIMITS.bodyMax,
    );
    const city = expectString(r.city, "city", 1, REVIEW_LIMITS.cityMax);

    let alias: string | undefined;
    if (r.alias !== undefined && r.alias !== null && r.alias !== "") {
      alias = expectString(r.alias, "alias", 1, REVIEW_LIMITS.aliasMax);
    }

    return {
      listingSlug,
      rating: rating as 1 | 2 | 3 | 4 | 5,
      body: body.trim(),
      city: city.trim(),
      alias: alias?.trim(),
    };
  },
};

function expectString(
  value: unknown,
  field: string,
  min: number,
  max: number,
): string {
  if (typeof value !== "string") {
    throw new Error(`submitReview: ${field} must be a string`);
  }
  const trimmed = value.trim();
  if (trimmed.length < min) {
    throw new Error(
      `submitReview: ${field} must be at least ${min} character(s)`,
    );
  }
  if (trimmed.length > max) {
    throw new Error(
      `submitReview: ${field} must be at most ${max} character(s)`,
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
    throw new Error(`submitReview: ${field} must be an integer`);
  }
  if (value < min || value > max) {
    throw new Error(
      `submitReview: ${field} must be between ${min} and ${max}`,
    );
  }
  return value;
}
