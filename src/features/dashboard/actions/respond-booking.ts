"use server";

import { respondToBooking as respondToBookingImpl } from "@/server/biringas";

export interface ActionResult<T = void> {
  ok: boolean;
  error?: { kind: string; message: string };
  data?: T;
}

/**
 * Server Action: confirm / decline / cancel / complete a booking.
 *
 * The full security stack (validate → requireAuth → ownership check →
 * adapter → audit → updateTag) lives in
 * `@/server/biringas#respondToBooking`. This file exists ONLY to mark
 * the function as a Server Action and translate thrown errors into a
 * stable `ActionResult` shape that Client Components can render inline.
 */
export async function respondToBooking(
  input: unknown,
): Promise<ActionResult<{ id: string; status: string }>> {
  try {
    const data = await respondToBookingImpl(input);
    return { ok: true, data: { id: data.id, status: data.status } };
  } catch (err) {
    const kind = (err as { kind?: unknown })?.kind;
    const message = (err as Error)?.message ?? "Unknown error";
    if (typeof kind === "string") {
      return { ok: false, error: { kind, message } };
    }
    return { ok: false, error: { kind: "validation", message } };
  }
}
