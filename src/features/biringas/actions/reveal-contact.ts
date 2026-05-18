"use server";

import { getPrivateContact, type PrivateContact } from "@/server/biringas";

/**
 * Server Action: reveal the private contact channels of a listing.
 *
 * Reachable by direct POST. The full security stack (`requireAuth()` +
 * `auditLog("biringa.private_contact.viewed", …)`) lives in
 * `@/server/biringas#getPrivateContact`; this file exists ONLY to mark the
 * function as a Server Action and translate thrown errors into the stable
 * `ActionResult` shape that Client Components already consume (mirrors
 * `submit-review.ts`).
 *
 * Error contract:
 *   - `kind: "no-session"`  → AuthError; the UI should route to /ingresar.
 *   - `kind: "validation"`  → the slug was missing or malformed.
 *   - anything else         → adapter / Firestore error.
 */

export interface ActionResult<T = void> {
  ok: boolean;
  error?: { kind: string; message: string };
  data?: T;
}

export async function revealContact(
  slug: unknown,
): Promise<ActionResult<PrivateContact | null>> {
  if (typeof slug !== "string" || slug.trim().length === 0) {
    return {
      ok: false,
      error: { kind: "validation", message: "slug is required" },
    };
  }
  try {
    const data = await getPrivateContact(slug);
    return { ok: true, data };
  } catch (err) {
    const kind = (err as { kind?: unknown })?.kind;
    const message = (err as Error)?.message ?? "Unknown error";
    if (typeof kind === "string") {
      return { ok: false, error: { kind, message } };
    }
    return { ok: false, error: { kind: "internal", message } };
  }
}
