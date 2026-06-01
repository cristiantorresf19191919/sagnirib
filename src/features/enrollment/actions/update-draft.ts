"use server";

import { updateListingDraft as updateListingDraftImpl } from "@/server/biringas";

import type { ActionResult } from "./create-draft";

/**
 * Server Action: persist owner edits to a `pending_review` draft.
 *
 * Reachable by direct POST. The full security stack (validate /
 * requirePublisher / ownership + status gate / slug uniqueness / audit /
 * revalidate) lives in `@/server/biringas#updateListingDraft`; this file only
 * marks it as a Server Action and translates thrown errors into the stable
 * `ActionResult` shape the edit form's Client Component can render. Mirrors
 * `create-draft.ts` so the wizard's `humanizeDraftError` maps both flows.
 */
export async function updateListingDraft(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const data = await updateListingDraftImpl(input);
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
