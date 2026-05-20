"use server";

import {
  addFavorite as addFavoriteImpl,
  removeFavorite as removeFavoriteImpl,
  syncFavoritesFromAnonymous as syncFavoritesImpl,
} from "@/server/favorites";

export interface ActionResult<T = void> {
  ok: boolean;
  error?: { kind: string; message: string };
  data?: T;
}

/**
 * Server Action thin wrappers for the favorites port (ADR-013).
 *
 * The full security stack (validate → requireAuth → adapter → audit
 * → updateTag) lives in `@/server/favorites`. These files exist only
 * to mark the functions as `"use server"` boundaries and translate
 * thrown errors into the stable `ActionResult` shape Client Components
 * can render inline.
 */

export async function addFavoriteAction(
  input: unknown,
): Promise<ActionResult<{ listingId: string }>> {
  try {
    const data = await addFavoriteImpl(input);
    return { ok: true, data: { listingId: data.listingId } };
  } catch (err) {
    return toResult(err);
  }
}

export async function removeFavoriteAction(
  input: unknown,
): Promise<ActionResult<{ removed: boolean }>> {
  try {
    const data = await removeFavoriteImpl(input);
    return { ok: true, data };
  } catch (err) {
    return toResult(err);
  }
}

export async function syncAnonymousFavoritesAction(
  input: unknown,
): Promise<ActionResult<{ written: number; skipped: number }>> {
  try {
    const data = await syncFavoritesImpl(input);
    return { ok: true, data };
  } catch (err) {
    return toResult(err);
  }
}

function toResult(err: unknown): ActionResult<never> {
  const kind = (err as { kind?: unknown })?.kind;
  const message = (err as Error)?.message ?? "Unknown error";
  if (typeof kind === "string") {
    return { ok: false, error: { kind, message } };
  }
  return { ok: false, error: { kind: "validation", message } };
}
