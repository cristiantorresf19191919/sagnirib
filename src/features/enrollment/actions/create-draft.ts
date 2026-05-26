"use server";

import { createListingDraft as createListingDraftImpl } from "@/server/biringas";

/**
 * Server Action: persist a wizard submission as a `listing_drafts/{id}` row.
 *
 * Reachable by direct POST. The full security stack (validate / requireAuth
 * / audit / role-grant) lives in `@/server/biringas#createListingDraft`;
 * this file exists ONLY to mark the function as a Server Action and to
 * translate thrown errors into a stable `ActionResult` shape that the
 * wizard's Client Component can render.
 *
 * Why duck-type `kind` instead of `instanceof FirebaseAdapterError`? Because
 * the audit forbids features from importing from `@/server/adapters/...`.
 * Both `AuthError` and `FirebaseAdapterError` expose a `kind: string`
 * discriminant — we read that without binding to the concrete class.
 */

export interface ActionResult<T = void> {
  ok: boolean;
  error?: {
    kind: string;
    message: string;
  };
  data?: T;
}

export async function createListingDraft(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const data = await createListingDraftImpl(input);
    return { ok: true, data };
  } catch (err) {
    const kind = (err as { kind?: unknown })?.kind;
    const message = (err as Error)?.message ?? "Unknown error";
    if (typeof kind === "string") {
      return { ok: false, error: { kind, message } };
    }
    return { ok: false, error: { kind: "validation", message } };
  }
}
