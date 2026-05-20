"use server";

import {
  createCheckoutSession as createCheckoutSessionImpl,
  completeMockCheckout as completeMockCheckoutImpl,
} from "@/server/biringas";

export interface ActionResult<T = void> {
  ok: boolean;
  error?: { kind: string; message: string };
  data?: T;
}

/**
 * Server Action wrappers for the checkout flow. The full security
 * stack lives in `@/server/biringas#{createCheckoutSession,completeMockCheckout}`;
 * these wrappers shape errors for the client surface.
 */
export async function createCheckoutSession(
  input: unknown,
): Promise<ActionResult<{ id: string; status: string }>> {
  try {
    const data = await createCheckoutSessionImpl(input);
    return { ok: true, data: { id: data.id, status: data.status } };
  } catch (err) {
    const kind = (err as { kind?: unknown })?.kind;
    const message = (err as Error)?.message ?? "Unknown error";
    return {
      ok: false,
      error: {
        kind: typeof kind === "string" ? kind : "validation",
        message,
      },
    };
  }
}

export async function completeMockCheckout(
  input: unknown,
): Promise<ActionResult<{ id: string; status: string }>> {
  try {
    const data = await completeMockCheckoutImpl(input);
    return { ok: true, data: { id: data.id, status: data.status } };
  } catch (err) {
    const kind = (err as { kind?: unknown })?.kind;
    const message = (err as Error)?.message ?? "Unknown error";
    return {
      ok: false,
      error: {
        kind: typeof kind === "string" ? kind : "validation",
        message,
      },
    };
  }
}
