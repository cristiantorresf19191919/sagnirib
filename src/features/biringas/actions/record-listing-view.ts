"use server";

import { recordListingView as recordListingViewImpl } from "@/server/biringas";

/**
 * Server Action: increment the public view counter for a listing.
 *
 * Called once on mount by `RecordListingView` (an invisible client island on
 * `/p/[slug]`). The full mutation contract — validate / cookie dedupe /
 * Firestore increment / cache invalidate — lives in
 * `@/server/biringas#recordListingView`; this file exists ONLY to mark the
 * function as a Server Action.
 *
 * Errors are swallowed: view tracking is best-effort instrumentation, never
 * worth blocking the page. If Firestore is down the visitor still sees the
 * profile; the counter just doesn't budge that one visit.
 */
export async function recordListingView(slug: string): Promise<void> {
  try {
    await recordListingViewImpl(slug);
  } catch {
    // best-effort — see docstring
  }
}
