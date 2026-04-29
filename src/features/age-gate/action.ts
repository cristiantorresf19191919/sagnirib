"use server";

import { revalidatePath } from "next/cache";

import { validateActionInput } from "@/server/security/validate-action-input";

import { writeAgeAck } from "./cookie";

/**
 * Trivial schema parser — the age-gate form carries no payload, but the
 * server-actions-policy requires every action to flow through
 * `validateActionInput` so the audit shape stays uniform.
 */
const emptyInputSchema = {
  parse(input: unknown): Record<string, never> {
    if (input !== null && typeof input !== "object") {
      throw new Error("invalid_input");
    }
    return {};
  },
};

/**
 * Records an anonymous "I am 18+" acknowledgment.
 *
 * Policy notes (server-actions-policy.md):
 * 1. Marked 'use server' — yes, file directive.
 * 2. validateActionInput — yes, with empty schema (no payload).
 * 3. requireAuth — INTENTIONALLY skipped: the gate runs before any user
 *    identity exists; gating it on auth would create a chicken-and-egg
 *    loop.
 * 4. requireRole / authorization — N/A for anonymous acknowledgment.
 * 5. Public POST — yes, treated as such.
 * 6. auditLog — N/A (no sensitive data mutated).
 * 7. revalidatePath — yes, root layout must re-render to drop the gate.
 * 8. No secrets returned — yes.
 */
export async function acknowledgeAge(formData: FormData): Promise<void> {
  validateActionInput(emptyInputSchema, Object.fromEntries(formData));
  await writeAgeAck();
  revalidatePath("/", "layout");
}
