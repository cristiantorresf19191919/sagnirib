"use server";

import { setMyListingAvailability as setMyListingAvailabilityImpl } from "@/server/biringas";

export interface ActionResult<T = void> {
  ok: boolean;
  error?: { kind: string; message: string };
  data?: T;
}

/**
 * Server Action: owner toggles `availableNow` for their published listing.
 *
 * Full security stack (validate → requireAuth → ownership check →
 * adapter → audit → updateTag) lives in
 * `@/server/biringas#setMyListingAvailability`. This file marks the
 * function as a Server Action boundary and maps thrown errors into the
 * stable `ActionResult` shape.
 */
export async function setListingAvailability(
  input: unknown,
): Promise<ActionResult<{ available: boolean }>> {
  try {
    const data = await setMyListingAvailabilityImpl(input);
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
