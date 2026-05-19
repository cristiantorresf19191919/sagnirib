"use server";

import { reportListing as reportListingImpl } from "@/server/biringas";

export interface ActionResult<T = void> {
  ok: boolean;
  error?: { kind: string; message: string };
  data?: T;
}

/**
 * Server Action: file a report against a listing. Anonymous reports are
 * permitted (the barrel's `reportListing` falls back to `reporterUid:
 * null` when `requireAuth` throws); the action layer just shapes errors
 * for the client modal.
 */
export async function reportListing(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const data = await reportListingImpl(input);
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
