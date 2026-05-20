import "server-only";

import { updateTag } from "next/cache";

import { isFirebaseConfigured } from "@/core/config/firebase";
import { grantRole } from "@/server/auth";
import { auditLog } from "@/server/security/audit-log";
import { requireAuth } from "@/server/security/require-auth";
import { validateActionInput } from "@/server/security/validate-action-input";

import { copyStagedToDraftForOwner } from "@/server/storage";

import { CACHE_TAGS } from "./cache-tags";
import { createListingDraftSchema } from "./create-draft-schema";
import type { CreateListingDraftInput } from "./draft-types";
import type {
  BookingRequestInput,
} from "./booking-types";
import type { PrivateContact } from "./private-contact-types";
import { reportListingSchema } from "./report-listing-schema";
import type { ReportListingInput } from "./report-types";
import { requestBookingSchema } from "./request-booking-schema";
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
  LANGUAGE_CATALOG,
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
export const requestBookingRaw = adapter.requestBookingRaw;
export const reportListingRaw = adapter.reportListingRaw;
const listBookingsForListingsRaw = adapter.listBookingsForListingsRaw;
const updateBookingStatusRaw = adapter.updateBookingStatusRaw;
const attachBuyerReviewRaw = adapter.attachBuyerReviewRaw;
const listDraftsByOwnerRaw = adapter.listDraftsByOwnerRaw;
const getReferralStatsRaw = adapter.getReferralStatsRaw;
const redeemReferralRaw = adapter.redeemReferralRaw;
const createCheckoutSessionRaw = adapter.createCheckoutSessionRaw;
const completeCheckoutMockRaw = adapter.completeCheckoutMockRaw;
const findCheckoutSessionRaw = adapter.findCheckoutSessionRaw;
export type {
  ReferralStats,
  ReferralRedemption,
} from "./referral-types";
export type {
  BillingCadence,
  CheckoutProvider,
  CheckoutSessionInput,
  CheckoutSessionRecord,
  CheckoutStatus,
  PlanTier,
} from "./checkout-types";
export {
  BILLING_LABELS,
  PLAN_LABELS,
  PLAN_PRICING,
} from "./checkout-types";
export {
  REFERRAL_REWARD_COP,
  REFERRAL_CODE_LENGTH,
  codeForUid as referralCodeForUid,
} from "./referral-types";
export type { DraftSummary } from "@/server/mocks/biringas/create-draft";
/** Internal: probes whether a slug is already claimed by a non-rejected
 *  draft. Wrapped by `createListingDraft` — features should not call it. */
const findActiveDraftBySlug = adapter.findActiveDraftBySlug;

/**
 * Curated marketing testimonials for the home page.
 *
 * NOT adapter-routed: testimonials are curated marketing copy (same
 * category as `BIRINGA_LISTINGS` seed data and `CATEGORIES` constants),
 * not user-generated content. Always served from the mock today; when
 * a Firestore `testimonials` collection ships, swap this export to
 * route through the adapter the same way `getListingReviews` does.
 */
export { listTestimonials } from "@/server/mocks/biringas/testimonials";

export type { PrivateContact } from "./private-contact-types";
export type { SubmitReviewInput } from "./review-types";
export { REVIEW_LIMITS } from "./review-types";
export type {
  Testimonial,
  TestimonialListingRef,
} from "./testimonial-types";
export type {
  BookingContactPreference,
  BookingMeetingType,
  BookingRequestInput,
  BookingRequestRecord,
} from "./booking-types";
export { BOOKING_DURATIONS, BOOKING_LIMITS } from "./booking-types";
export type {
  ReportListingInput,
  ReportListingRecord,
  ReportReason,
} from "./report-types";
export { REPORT_LIMITS, REPORT_REASONS } from "./report-types";
export { CACHE_TAGS } from "./cache-tags";
export type {
  CreateListingDraftInput,
  ListingDraftPayload,
  ListingDraftPayloadAttributes,
  ListingDraftPayloadDetails,
  ListingDraftPayloadDescription,
  ListingDraftPayloadPublish,
  ListingDraftPhoto,
  ListingDraftStatus,
} from "./draft-types";
export { DRAFT_LIMITS } from "./draft-types";

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

/**
 * Files a booking request against a listing.
 *
 * Standard mutation contract (ADR-010 §5):
 *
 *   1. Validate via `requestBookingSchema`.
 *   2. Authenticate — anonymous bookings are refused.
 *   3. Adapter call — appends to the mock store today; will write a
 *      `bookings/{auto-id}` document under Firestore when implemented.
 *   4. Audit — `biringa.booking.requested` with proposed date + duration.
 *   5. Revalidate — the per-listing bookings tag so the listing owner's
 *      future inbox surface sees the new request without a full refetch.
 */
export async function requestBooking(
  rawInput: unknown,
): Promise<{ id: string }> {
  const input: BookingRequestInput = validateActionInput(
    requestBookingSchema,
    rawInput,
  );
  const user = await requireAuth();

  const result = await adapter.requestBookingRaw({
    input,
    requesterUid: user.uid,
  });

  await auditLog({
    event: "biringa.booking.requested",
    actorId: user.uid,
    resource: `listing:${input.listingSlug}`,
    metadata: {
      proposedAt: input.proposedAt,
      durationHours: input.durationHours,
      meetingType: input.meetingType,
    },
  });

  updateTag(CACHE_TAGS.bookingsForListing(input.listingSlug));

  return result;
}

/**
 * Files a report against a listing (fake photos, scam, harassment, etc.).
 *
 * Anonymous reports ARE permitted (for `minor_concern` / `underage`
 * especially, the reporter may not have an account). When `requireAuth`
 * throws we still file the report with `reporterUid: null`. All other
 * steps of the mutation contract (validate / adapter / audit) run
 * unchanged so trust&safety has a complete trail.
 */
export async function reportListing(
  rawInput: unknown,
): Promise<{ id: string }> {
  const input: ReportListingInput = validateActionInput(
    reportListingSchema,
    rawInput,
  );

  let reporterUid: string | null = null;
  try {
    const user = await requireAuth();
    reporterUid = user.uid;
  } catch {
    // Anonymous reports allowed — see docstring.
  }

  const result = await adapter.reportListingRaw({
    input,
    reporterUid,
  });

  await auditLog({
    event: "biringa.listing.reported",
    actorId: reporterUid ?? "anonymous",
    resource: `listing:${input.listingSlug}`,
    metadata: { reason: input.reason },
  });

  return result;
}

/**
 * Persists a `listing_drafts/{id}` row submitted from the `/publicar` wizard.
 *
 * Standard mutation contract (ADR-010 §5) extended for asset attachment
 * (ADR-012):
 *
 *   1. Validate input via `createListingDraftSchema` (shape + staging-path
 *      regex on every gallery entry).
 *   2. Authenticate — anonymous submissions are refused.
 *   3. **Slug uniqueness** — refuse if `preferredSlug` is already claimed
 *      by a published listing or by a non-rejected draft. The wizard will
 *      surface this as a friendly banner via the action wrapper.
 *   4. **Cross-check gallery ownership** — every staging path must start
 *      with `users/<caller.uid>/staging/<input.sessionId>/`. The schema
 *      already verified the regex shape; this layer is what binds it to
 *      the authenticated identity. The Storage adapter does a third check
 *      at copy time (defense in depth).
 *   5. Server-mint `draftId` (UUID v4). Used by both the Storage copy and
 *      the Firestore write so they address the same id without two
 *      sequential writes.
 *   6. **Copy staging → draft** via `copyStagedToDraftForOwner`. Issues
 *      audit `biringa.draft.assets_attached`. If the copy throws, no
 *      Firestore row is created and the modelo can retry with the same
 *      staged files (still alive in `users/<uid>/staging/`).
 *   7. Adapter call — writes `listing_drafts/{draftId}` with the final
 *      draft-prefixed paths.
 *   8. Audit `biringa.draft.submitted` with the draft id + slug + city
 *      + category + photo count.
 *   9. Role grant — first draft promotes the user to `roles: ['model']`
 *      via additive custom claims. Subsequent drafts are a no-op at the
 *      claims layer; the audit event still fires.
 *  10. Revalidate — none today; admin / "mis publicaciones" surfaces are
 *      Fase 2.
 *
 * Returns the new draft id so the action layer can surface a confirmation
 * code in the UI if desired.
 */
export async function createListingDraft(
  rawInput: unknown,
): Promise<{ id: string }> {
  const input: CreateListingDraftInput = validateActionInput(
    createListingDraftSchema,
    rawInput,
  );
  const user = await requireAuth();

  // Slug uniqueness — published catalog first, then the draft queue.
  const slug = input.payload.details.preferredSlug;
  const slugTakenByListing = await adapter.findBySlug(slug);
  if (slugTakenByListing) {
    const err = new Error(
      `createListingDraft: slug "${slug}" is already taken by a published profile`,
    );
    (err as { kind?: string }).kind = "invalid-argument";
    throw err;
  }
  const slugTakenByDraft = await findActiveDraftBySlug(slug);
  if (slugTakenByDraft) {
    const err = new Error(
      `createListingDraft: slug "${slug}" is already in another draft awaiting review`,
    );
    (err as { kind?: string }).kind = "invalid-argument";
    throw err;
  }

  // Gallery cross-ownership. The schema enforced the staging-path shape; we
  // bind it to the authenticated identity HERE so a malicious client cannot
  // submit a draft whose photos belong to a different user's session.
  const stagingPrefix = `users/${user.uid}/staging/${input.sessionId}/`;
  for (const photo of input.payload.description.gallery) {
    if (!photo.path.startsWith(stagingPrefix)) {
      const err = new Error(
        "createListingDraft: gallery contains a photo not owned by the caller",
      );
      (err as { kind?: string }).kind = "permission-denied";
      throw err;
    }
  }

  const draftId = globalThis.crypto.randomUUID();

  // Copy staging → draft. Empty gallery is a no-op.
  const stagingPaths = input.payload.description.gallery.map((p) => p.path);
  const { draftPaths } = await copyStagedToDraftForOwner(user.uid, {
    sessionId: input.sessionId,
    draftId,
    paths: stagingPaths,
  });

  // Rewrite payload with the post-copy draft paths.
  const finalPayload = {
    ...input.payload,
    description: {
      ...input.payload.description,
      gallery: draftPaths.map((path) => ({ path })),
    },
  };

  const result = await adapter.createListingDraftRaw({
    ownerUid: user.uid,
    draftId,
    payload: finalPayload,
  });

  await auditLog({
    event: "biringa.draft.submitted",
    actorId: user.uid,
    resource: `draft:${result.id}`,
    metadata: {
      preferredSlug: slug,
      city: input.payload.details.city,
      category: input.payload.details.category,
      photoCount: draftPaths.length,
      packageId: input.payload.publish.packageId,
      addOnIds: [...input.payload.publish.addOnIds],
    },
  });

  if (!result.hasOtherDrafts) {
    // First-publish role grant. `grantRole` is idempotent at the claims
    // level — if the user already has `model` for any reason, the merge is
    // a no-op. The audit event still fires; that is intentional.
    await grantRole(user.uid, "model", user.uid);
  }

  return { id: result.id };
}

/**
 * SELLER DASHBOARD — owner-side queries.
 *
 * These three barrel functions back the `/mi-cuenta` surface. Auth is
 * required for all of them (anonymous → AuthError thrown); the booking
 * mutation also enforces that the responder owns the listing the
 * booking was filed against.
 */

import type { DraftSummary as _DraftSummary } from "@/server/mocks/biringas/create-draft";
import type { BookingRequestRecord } from "./booking-types";

/**
 * Drafts owned by the current user, newest-first. Used by the "Mi
 * perfil" tab in the dashboard and to compute the listing slugs the
 * inbox should filter against.
 */
export async function listMyDrafts(): Promise<
  ReadonlyArray<_DraftSummary>
> {
  const user = await requireAuth();
  return listDraftsByOwnerRaw(user.uid);
}

/**
 * Incoming booking requests for any listing the current user owns.
 * Returns an empty list when the user has no drafts yet (the dashboard
 * renders a friendly "publica tu perfil" CTA in that case).
 */
export async function listMyIncomingBookings(): Promise<
  ReadonlyArray<BookingRequestRecord>
> {
  const user = await requireAuth();
  const drafts = await listDraftsByOwnerRaw(user.uid);
  if (drafts.length === 0) return [];
  const slugs = drafts.map((d) => d.preferredSlug);
  return listBookingsForListingsRaw(slugs);
}

/**
 * Action taken by a listing owner on an incoming booking. Mutation
 * contract: validate input → requireAuth → ownership check → adapter
 * → audit → revalidate the per-listing bookings tag.
 *
 * The ownership check is the safety boundary — without it any
 * authenticated user could flip any booking's status. We re-derive the
 * caller's owned slugs from drafts (the source of truth) and compare
 * against the booking's listingSlug.
 */
export async function respondToBooking(
  rawInput: unknown,
): Promise<BookingRequestRecord> {
  if (!rawInput || typeof rawInput !== "object") {
    throw new Error("respondToBooking: input must be an object");
  }
  const r = rawInput as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id : null;
  const action =
    r.action === "confirmed" ||
    r.action === "declined" ||
    r.action === "cancelled" ||
    r.action === "completed"
      ? r.action
      : null;
  if (!id || !action) {
    throw new Error(
      "respondToBooking: id (string) and action ('confirmed'|'declined'|'cancelled'|'completed') are required",
    );
  }

  const user = await requireAuth();

  // Ownership: the responder must own the listing the booking was
  // filed against. Pulling the full inbox is acceptable here because
  // dashboard inboxes are short; switch to a per-id lookup when this
  // becomes hot.
  const ownedSlugs = new Set(
    (await listDraftsByOwnerRaw(user.uid)).map((d) => d.preferredSlug),
  );
  const inbox = await listBookingsForListingsRaw([...ownedSlugs]);
  const target = inbox.find((b) => b.id === id);
  if (!target) {
    throw new Error("respondToBooking: booking not found or not yours");
  }

  const updated = await updateBookingStatusRaw(id, action);
  if (!updated) {
    throw new Error("respondToBooking: booking no longer exists");
  }

  await auditLog({
    event: "biringa.booking.responded",
    actorId: user.uid,
    resource: `booking:${id}`,
    metadata: { action, listingSlug: target.listingSlug },
  });

  updateTag(CACHE_TAGS.bookingsForListing(target.listingSlug));

  return updated;
}

import type {
  BookingRequestRecord as _BookingRequestRecord,
  SubmitBuyerReviewInput,
} from "./booking-types";
import { BUYER_REVIEW_LIMITS } from "./booking-types";

/**
 * Mutual reviews — seller-side. Attaches a 1-5 rating + optional
 * private comment to a `completed` booking. Standard mutation
 * contract: validate → requireAuth → ownership check (booking belongs
 * to a listing the caller owns) → status guard (booking must be
 * `completed`) → adapter → audit → updateTag.
 *
 * The review is currently used only to compute internal trust scores.
 * Surfacing buyer ratings on a future buyer-profile page is a v2
 * decision; for now the seller dashboard renders "Calificado X★" as
 * an inline badge on the booking card.
 */
export async function submitBuyerReview(
  rawInput: unknown,
): Promise<_BookingRequestRecord> {
  if (!rawInput || typeof rawInput !== "object") {
    throw new Error("submitBuyerReview: input must be an object");
  }
  const r = rawInput as Record<string, unknown>;
  const bookingId = typeof r.bookingId === "string" ? r.bookingId : null;
  const ratingNum = typeof r.rating === "number" ? r.rating : null;
  const rating: SubmitBuyerReviewInput["rating"] | null =
    ratingNum !== null &&
    Number.isInteger(ratingNum) &&
    ratingNum >= 1 &&
    ratingNum <= 5
      ? (ratingNum as SubmitBuyerReviewInput["rating"])
      : null;
  if (!bookingId || !rating) {
    throw new Error(
      "submitBuyerReview: bookingId (string) and rating (1-5 integer) are required",
    );
  }
  let comment: string | undefined;
  if (r.comment !== undefined && r.comment !== null && r.comment !== "") {
    if (typeof r.comment !== "string") {
      throw new Error("submitBuyerReview: comment must be a string");
    }
    const trimmed = r.comment.trim();
    if (trimmed.length > BUYER_REVIEW_LIMITS.commentMax) {
      throw new Error(
        `submitBuyerReview: comment must be at most ${BUYER_REVIEW_LIMITS.commentMax} characters`,
      );
    }
    comment = trimmed || undefined;
  }

  const user = await requireAuth();

  const ownedSlugs = new Set(
    (await listDraftsByOwnerRaw(user.uid)).map((d) => d.preferredSlug),
  );
  const inbox = await listBookingsForListingsRaw([...ownedSlugs]);
  const target = inbox.find((b) => b.id === bookingId);
  if (!target) {
    throw new Error("submitBuyerReview: booking not found or not yours");
  }
  if (target.status !== "completed") {
    throw new Error(
      "submitBuyerReview: only completed bookings can be rated",
    );
  }

  const updated = await attachBuyerReviewRaw(bookingId, {
    rating,
    comment,
    submittedAt: new Date().toISOString(),
  });
  if (!updated) {
    throw new Error("submitBuyerReview: booking no longer exists");
  }

  await auditLog({
    event: "biringa.buyer_review.submitted",
    actorId: user.uid,
    resource: `booking:${bookingId}`,
    metadata: { rating, listingSlug: target.listingSlug },
  });

  updateTag(CACHE_TAGS.bookingsForListing(target.listingSlug));

  return updated;
}

import type {
  ReferralStats as _ReferralStats,
} from "./referral-types";

/**
 * Returns the current user's referral stats (code + redemption count
 * + credit + has-already-redeemed flag). Auth-gated — anonymous users
 * see the dashboard sign-in nudge instead.
 */
export async function getMyReferralStats(): Promise<_ReferralStats> {
  const user = await requireAuth();
  return getReferralStatsRaw(user.uid);
}

/**
 * Redeems someone else's referral code on behalf of the current user.
 * Auth-gated. Each user can redeem at most ONE code lifetime (first
 * redemption wins; subsequent attempts return a typed reason the
 * client surfaces inline).
 */
export async function redeemReferralCode(
  rawInput: unknown,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!rawInput || typeof rawInput !== "object") {
    throw new Error("redeemReferralCode: input must be an object");
  }
  const r = rawInput as Record<string, unknown>;
  const code = typeof r.code === "string" ? r.code.trim().toUpperCase() : "";
  if (code.length < 4 || code.length > 16) {
    throw new Error("redeemReferralCode: code length must be 4–16 chars");
  }

  const user = await requireAuth();
  const outcome = await redeemReferralRaw({ code, redeemerUid: user.uid });

  if (outcome.ok) {
    await auditLog({
      event: "biringa.referral.redeemed",
      actorId: user.uid,
      resource: `referral:${code}`,
      metadata: { referrerUid: outcome.redemption.referrerUid },
    });
    return { ok: true };
  }
  return { ok: false, reason: outcome.reason };
}

import {
  PLAN_PRICING as _PLAN_PRICING,
  type CheckoutSessionInput as _CheckoutSessionInput,
  type CheckoutSessionRecord as _CheckoutSessionRecord,
} from "./checkout-types";

/**
 * Mints a checkout session for a paid plan. Server recomputes the
 * total from `PLAN_PRICING` — the client never picks a price.
 *
 * Mock mode (default in dev) returns a session in `awaiting_payment`
 * state; the UI calls `completeMockCheckout(id)` to flip it to
 * `succeeded` after the user clicks the simulated "Pay" button. Real
 * providers (Stripe / MercadoPago) will skip the manual completion
 * and rely on webhooks.
 */
export async function createCheckoutSession(
  rawInput: unknown,
): Promise<_CheckoutSessionRecord> {
  if (!rawInput || typeof rawInput !== "object") {
    throw new Error("createCheckoutSession: input must be an object");
  }
  const r = rawInput as Record<string, unknown>;
  const tier =
    r.tier === "boost" || r.tier === "elite" ? r.tier : null;
  const billing =
    r.billing === "monthly" || r.billing === "quarterly" ? r.billing : null;
  if (!tier || !billing) {
    throw new Error(
      "createCheckoutSession: tier ('boost'|'elite') and billing ('monthly'|'quarterly') are required",
    );
  }

  const user = await requireAuth();
  const totalCop = _PLAN_PRICING[tier][billing];

  const input: _CheckoutSessionInput = { tier, billing, provider: "mock" };
  const record = await createCheckoutSessionRaw({
    input,
    ownerUid: user.uid,
    totalCop,
  });

  await auditLog({
    event: "biringa.checkout.created",
    actorId: user.uid,
    resource: `checkout:${record.id}`,
    metadata: { tier, billing, totalCop },
  });

  return record;
}

/**
 * Mock-only completion path. Throws when running against the
 * Firestore adapter (real flows complete via webhook). Ownership
 * check ensures only the session's owner can flip it.
 */
export async function completeMockCheckout(
  rawInput: unknown,
): Promise<_CheckoutSessionRecord> {
  if (!rawInput || typeof rawInput !== "object") {
    throw new Error("completeMockCheckout: input must be an object");
  }
  const r = rawInput as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id : null;
  if (!id) throw new Error("completeMockCheckout: id is required");

  const user = await requireAuth();
  const session = await findCheckoutSessionRaw(id);
  if (!session) throw new Error("completeMockCheckout: session not found");
  if (session.ownerUid !== user.uid) {
    throw new Error("completeMockCheckout: not your session");
  }

  const updated = await completeCheckoutMockRaw(id);
  if (!updated) throw new Error("completeMockCheckout: session not found");

  await auditLog({
    event: "biringa.checkout.completed",
    actorId: user.uid,
    resource: `checkout:${id}`,
    metadata: { tier: updated.tier, totalCop: updated.totalCop },
  });

  return updated;
}

/** Server-side read for the checkout success page. Owner-gated. */
export async function getCheckoutSession(
  id: string,
): Promise<_CheckoutSessionRecord | null> {
  const user = await requireAuth();
  const session = await findCheckoutSessionRaw(id);
  if (!session) return null;
  if (session.ownerUid !== user.uid) return null;
  return session;
}
