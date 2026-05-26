import "server-only";

import type { ActionInputSchema } from "@/server/security/validate-action-input";

import {
  ACCOUNT_TYPE_COMMENTATOR,
  ACCOUNT_TYPE_PUBLISHER,
  type AccountTypeChosenVia,
  type SetAccountTypeOnceInput,
} from "./types";

/**
 * Validators for the users port (ADR-019).
 *
 * Manual parsers — same style as `src/server/persons/schemas.ts`. The
 * barrel runs these through `validateActionInput` before the adapter
 * sees anything.
 */

const VALID_VIAS = new Set<AccountTypeChosenVia>([
  "pre-oauth",
  "post-oauth-modal",
  "lazy-migration",
]);

function isAccountTypeChosenVia(value: unknown): value is AccountTypeChosenVia {
  return typeof value === "string"
    && VALID_VIAS.has(value as AccountTypeChosenVia);
}

export const setAccountTypeOnceSchema: ActionInputSchema<SetAccountTypeOnceInput> =
  {
    parse(input: unknown): SetAccountTypeOnceInput {
      if (!input || typeof input !== "object") {
        throw new Error("setAccountTypeOnce: input must be an object");
      }
      const r = input as Record<string, unknown>;

      if (
        r.accountType !== ACCOUNT_TYPE_PUBLISHER &&
        r.accountType !== ACCOUNT_TYPE_COMMENTATOR
      ) {
        throw new Error(
          "setAccountTypeOnce: accountType must be 'publisher' or 'commentator'",
        );
      }
      if (!isAccountTypeChosenVia(r.via)) {
        throw new Error(
          "setAccountTypeOnce: via must be 'pre-oauth' | 'post-oauth-modal' | 'lazy-migration'",
        );
      }
      return {
        accountType: r.accountType,
        via: r.via,
      };
    },
  };
