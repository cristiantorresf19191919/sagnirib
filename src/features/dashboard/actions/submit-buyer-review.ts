"use server";

import { submitBuyerReview as submitBuyerReviewImpl } from "@/server/biringas";

export interface ActionResult<T = void> {
  ok: boolean;
  error?: { kind: string; message: string };
  data?: T;
}

/**
 * Server Action: seller rates a buyer on a completed booking. The full
 * stack (validate → requireAuth → ownership → status guard → adapter →
 * audit → updateTag) lives in `@/server/biringas#submitBuyerReview`;
 * this file only marks it as a Server Action and shapes errors for
 * the client form.
 */
export async function submitBuyerReview(
  input: unknown,
): Promise<
  ActionResult<{ bookingId: string; rating: number; submittedAt: string }>
> {
  try {
    const data = await submitBuyerReviewImpl(input);
    return {
      ok: true,
      data: {
        bookingId: data.id,
        rating: data.buyerReview?.rating ?? 0,
        submittedAt: data.buyerReview?.submittedAt ?? new Date().toISOString(),
      },
    };
  } catch (err) {
    const kind = (err as { kind?: unknown })?.kind;
    const message = (err as Error)?.message ?? "Unknown error";
    if (typeof kind === "string") {
      return { ok: false, error: { kind, message } };
    }
    return { ok: false, error: { kind: "validation", message } };
  }
}
