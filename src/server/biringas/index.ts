import "server-only";

import { updateTag } from "next/cache";

import { isFirebaseConfigured } from "@/core/config/firebase";
import { auditLog } from "@/server/security/audit-log";
import { requireAuth } from "@/server/security/require-auth";
import { validateActionInput } from "@/server/security/validate-action-input";

import { CACHE_TAGS } from "./cache-tags";
import type { PrivateContact } from "./private-contact-types";
import type { SubmitReviewInput } from "./review-types";
import { submitReviewSchema } from "./submit-review-schema";

/**
 * Public barrel for the Biringa listings port.
 *
 * Features import from here ONLY — never from `@/server/mocks/...` or
 * `@/server/adapters/...` directly. The barrel routes dynamic data access
 * to the configured provider:
 *
 *   - `FIREBASE_*` env vars set  → Firestore adapter
 *   - otherwise                  → in-memory mock (dev-friendly fallback)
 *
 * Static catalogs (CATEGORIES, SERVICE_CATALOG, etc.) and types are part of
 * the domain — they are NOT provider-routed and always come from the
 * canonical source (`src/server/biringas/types.ts` + `mocks/biringas/data`).
 *
 * Why top-level `await import`: it ensures `firebase-admin` is only loaded
 * when actually configured. Server Components + React 19 support TLA.
 */

// Static domain types — always from the canonical contract.
export type {
  AttentionTarget,
  BiringaAttributes,
  BiringaListing,
  BiringaReputation,
  Category,
  ContactChannel,
  ListingsFilters,
  PaginatedListings,
  Sex,
} from "./types";

export type {
  ReviewBreakdown,
  ReviewItem,
  ReviewsAggregate,
} from "./review-types";

// Static catalogs — domain config that does not live in any data store.
export {
  APPEARANCE_CATALOG,
  ATTENTION_CATALOG,
  BIRINGA_LISTINGS,
  CATEGORIES,
  CONTACT_CATALOG,
  MEETING_CONTEXT_CATALOG,
  SERVICE_CATALOG,
  SPECIAL_SERVICE_CATALOG,
  SUPPORTED_CITIES,
} from "@/server/mocks/biringas/data";

// Dynamic data access — routed to Firestore or mock at module load.
const adapter = isFirebaseConfigured()
  ? await import("@/server/adapters/firebase/biringas")
  : await import("@/server/mocks/biringas");

export const listAll = adapter.listAll;
export const listFeatured = adapter.listFeatured;
export const listHeroMosaic = adapter.listHeroMosaic;
export const findBySlug = adapter.findBySlug;
export const listCities = adapter.listCities;
export const listServiceCatalog = adapter.listServiceCatalog;
export const listMeetingContextCatalog = adapter.listMeetingContextCatalog;
export const getListingReviews = adapter.getListingReviews;
export const listSimilar = adapter.listSimilar;

export type { PrivateContact } from "./private-contact-types";
export type { SubmitReviewInput } from "./review-types";
export { REVIEW_LIMITS } from "./review-types";
export { CACHE_TAGS } from "./cache-tags";

/**
 * Returns the private contact channel of a listing.
 *
 * Auth-gated and audited at this layer so adapters cannot be reached without
 * authentication. Features that need the value (e.g. a "Contactar" button)
 * call this from a Server Action, never inline during render.
 */
export async function getPrivateContact(
  slug: string,
): Promise<PrivateContact | null> {
  const user = await requireAuth();
  await auditLog({
    event: "biringa.private_contact.viewed",
    actorId: user.uid,
    resource: `listing:${slug}`,
  });
  return adapter.getPrivateContactRaw(slug);
}

/**
 * Writes a review for a listing. The full mutation contract (ADR-010 §5) in
 * five steps: validate → authenticate → adapter call → audit → revalidate.
 *
 * Returns the newly written review id (== authorUid by construction). The
 * adapter throws `invalid-argument` if the user already reviewed the
 * listing — that error bubbles up unchanged so the Server Action wrapper
 * can map it to a friendly UI message.
 */
export async function submitReview(
  rawInput: unknown,
): Promise<{ id: string }> {
  const input: SubmitReviewInput = validateActionInput(
    submitReviewSchema,
    rawInput,
  );
  const user = await requireAuth();

  const result = await adapter.submitReviewRaw({
    listingSlug: input.listingSlug,
    authorUid: user.uid,
    alias: input.alias ?? user.email ?? "Cliente verificado",
    city: input.city,
    rating: input.rating,
    body: input.body,
  });

  await auditLog({
    event: "biringa.review.submitted",
    actorId: user.uid,
    resource: `listing:${input.listingSlug}`,
    metadata: { rating: input.rating },
  });

  // Next 16: `updateTag` is the Server-Action-scoped invalidator with
  // read-your-own-writes semantics. Use it instead of `revalidateTag`
  // (which now requires a CacheLife profile and is for non-action paths).
  updateTag(CACHE_TAGS.listing(input.listingSlug));
  updateTag(CACHE_TAGS.listings);

  return result;
}
