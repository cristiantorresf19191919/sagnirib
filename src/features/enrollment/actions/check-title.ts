"use server";

import { checkSlugAvailability } from "@/server/biringas";

/**
 * Server Action: is this profile title (its derived slug) still free?
 *
 * Backs the publish wizard's debounced live check on the single "Título"
 * field. The auth gate + the actual published-catalog / draft-queue lookup
 * live in `@/server/biringas#checkSlugAvailability` (requires a session to
 * stop anonymous slug enumeration); this file only marks it as a Server
 * Action and returns a stable shape the Client Component can render.
 *
 * Returns `{ ok: false }` on any thrown error (e.g. no session) so the hook
 * degrades to a neutral state instead of blocking the wizard.
 */
export async function checkListingTitleAvailability(slug: string): Promise<{
  ok: boolean;
  data?: { available: boolean; reason?: "published" | "draft" };
}> {
  try {
    const data = await checkSlugAvailability(slug);
    return { ok: true, data };
  } catch {
    return { ok: false };
  }
}
