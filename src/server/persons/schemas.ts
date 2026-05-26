import "server-only";

import type { ActionInputSchema } from "@/server/security/validate-action-input";

import { PERSON_LIMITS } from "@/shared/persons/limits";

import type { CreatePersonInput } from "./types";

/**
 * Validators for the persons port (ADR-018).
 *
 * Manual parsers — matches the rest of the codebase style (see
 * `src/server/verification/schemas.ts`). The barrel applies these
 * with `validateActionInput` before the adapter sees anything.
 */

export const createPersonSchema: ActionInputSchema<CreatePersonInput> = {
  parse(input: unknown): CreatePersonInput {
    if (!input || typeof input !== "object") {
      throw new Error("createMyPerson: input must be an object");
    }
    const r = input as Record<string, unknown>;

    if (typeof r.displayName !== "string") {
      throw new Error("createMyPerson: displayName must be a string");
    }
    const displayName = r.displayName.trim();
    if (displayName.length < PERSON_LIMITS.displayNameMin) {
      throw new Error(
        `createMyPerson: displayName must be at least ${PERSON_LIMITS.displayNameMin} characters`,
      );
    }
    if (displayName.length > PERSON_LIMITS.displayNameMax) {
      throw new Error(
        `createMyPerson: displayName must be at most ${PERSON_LIMITS.displayNameMax} characters`,
      );
    }

    return { displayName };
  },
};

/** Standalone personId guard (used by routes / nested action schemas). */
export function parsePersonId(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("persons: personId must be a string");
  }
  const trimmed = value.trim();
  if (!PERSON_LIMITS.personIdRegex.test(trimmed)) {
    throw new Error("persons: personId has invalid shape");
  }
  return trimmed;
}
