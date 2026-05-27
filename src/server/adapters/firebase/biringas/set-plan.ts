import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import type { PlanTier } from "@/server/biringas/checkout-types";
import { getDb } from "@/server/adapters/firebase/client";
import { wrapFirestoreError } from "@/server/adapters/firebase/errors";

/**
 * Writes a listing's `plan` field (ADR-013 + ADR-015 plan extension).
 *
 * Lookup is by slug — same pattern as `recordListingViewRaw`. Bumps
 * `updatedAt` so the catalog's default sort floats the listing when
 * a plan is freshly purchased.
 *
 * `null` clears the field via `FieldValue.delete()` so the mapper
 * falls back to `plan: undefined` (free tier) on the next read.
 *
 * Ownership is enforced by the barrel (the caller must hold the
 * checkout session for this listing's owner). This adapter trusts
 * the wrapper.
 */
export async function setListingPlanRaw(
  slug: string,
  plan: { tier: PlanTier; activeUntil: string } | null,
): Promise<boolean> {
  const db = getDb();
  try {
    const snap = await db
      .collection("listings")
      .where("slug", "==", slug)
      .limit(1)
      .get();
    if (snap.empty) return false;
    if (plan === null) {
      await snap.docs[0].ref.update({
        plan: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      await snap.docs[0].ref.update({
        plan: {
          tier: plan.tier,
          activeUntil: Timestamp.fromDate(new Date(plan.activeUntil)),
        },
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    return true;
  } catch (err) {
    throw wrapFirestoreError("setListingPlan", err);
  }
}
