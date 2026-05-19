"use server";

import { requestBooking as requestBookingImpl } from "@/server/biringas";

/**
 * Server Action: file a booking request against a listing.
 *
 * The full security stack (validate / requireAuth / adapter / audit /
 * updateTag) lives in `@/server/biringas#requestBooking`; this file
 * exists ONLY to mark the function as a Server Action and translate
 * thrown errors into a stable `ActionResult` shape that Client
 * Components can render inline.
 */

export interface ActionResult<T = void> {
  ok: boolean;
  error?: { kind: string; message: string };
  data?: T;
}

export async function requestBooking(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const data = await requestBookingImpl(input);
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
