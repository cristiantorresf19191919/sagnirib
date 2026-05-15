"use server";

import { submitReview as submitReviewImpl } from "@/server/biringas";

/**
 * Server Action: submit a review for a listing.
 *
 * Reachable by direct POST. The full security stack (validate / requireAuth
 * / audit / revalidate) lives in `@/server/biringas#submitReview`; this file
 * exists ONLY to mark the function as a Server Action and translate thrown
 * errors into a stable ActionResult shape that Client Components can render.
 *
 * Why duck-type `kind` instead of `instanceof FirebaseAdapterError`? Because
 * the audit forbids features from importing from `@/server/adapters/...`.
 * Both `AuthError` and `FirebaseAdapterError` expose a `kind: string`
 * discriminant — we read that without binding to the concrete class.
 */

export interface ActionResult<T = void> {
  ok: boolean;
  error?: { kind: string; message: string };
  data?: T;
}

export async function submitReview(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const data = await submitReviewImpl(input);
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
