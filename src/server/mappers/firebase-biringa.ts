import "server-only";

import { Timestamp } from "firebase-admin/firestore";

import type {
  AttentionTarget,
  BiringaAttributes,
  BiringaListing,
  BiringaReputation,
  BiringaVideo,
  Category,
  ContactChannel,
  Sex,
} from "@/server/biringas/types";
import type { PlanTier } from "@/server/biringas/checkout-types";
import type {
  ReviewBreakdown,
  ReviewItem,
  ReviewsAggregate,
} from "@/server/biringas/review-types";

import { FirebaseAdapterError } from "@/server/adapters/firebase/errors";

/**
 * Mapper: Firestore DocumentData -> internal BiringaListing.
 *
 * Provider types must NOT leak past this file (ADR-009). Anything coming out
 * of here is the canonical internal shape that features consume.
 *
 * Expected Firestore schema (see docs/architecture/firebase-schema.md):
 *   listings/{listingId}            -- BiringaListing fields, ts as Timestamp
 *   listings/{listingId}/reviews/*  -- ReviewItem fields, ts as Timestamp
 */

type Raw = Record<string, unknown>;

function toIso(value: unknown, field: string): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  throw new FirebaseAdapterError(
    "internal",
    `mapper: expected Timestamp/Date/string at "${field}", got ${typeof value}`,
  );
}

function toIsoOptional(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return undefined;
}

function asString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new FirebaseAdapterError(
      "internal",
      `mapper: expected string at "${field}"`,
    );
  }
  return value;
}

function asNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new FirebaseAdapterError(
      "internal",
      `mapper: expected number at "${field}"`,
    );
  }
  return value;
}

function asBool(value: unknown): boolean {
  return value === true;
}

function asStringArray(value: unknown): ReadonlyArray<string> {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function asAttributes(value: unknown): BiringaAttributes {
  if (!value || typeof value !== "object") return {};
  const r = value as Raw;
  return {
    ethnicity: typeof r.ethnicity === "string" ? r.ethnicity : undefined,
    hair: typeof r.hair === "string" ? r.hair : undefined,
    height: typeof r.height === "string" ? r.height : undefined,
    body: typeof r.body === "string" ? r.body : undefined,
    breast: typeof r.breast === "string" ? r.breast : undefined,
    pubis: typeof r.pubis === "string" ? r.pubis : undefined,
    country: typeof r.country === "string" ? r.country : undefined,
    languages: Array.isArray(r.languages)
      ? r.languages.filter((v): v is string => typeof v === "string")
      : undefined,
  };
}

const MS_PER_DAY = 86_400_000;

function daysSince(iso: string | undefined): number {
  if (!iso) return 0;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return 0;
  return Math.max(0, Math.floor((Date.now() - then) / MS_PER_DAY));
}

/**
 * `daysAdvertised` / `daysSinceVerification` are derived at read time from
 * `createdAt` / `verifiedAt`. The stored counters in the doc are ignored —
 * they were never wired to a writer and stayed at 0, which made the profile
 * page render "0 días activa" for freshly approved listings. `totalViews`
 * is still a stored counter (incremented by `recordListingViewRaw`).
 */
function asReputation(
  value: unknown,
  derived: { createdAtIso: string; verifiedAtIso: string | undefined },
): BiringaReputation {
  const r = (value ?? {}) as Raw;
  return {
    daysAdvertised: daysSince(derived.createdAtIso),
    daysSinceVerification: daysSince(
      derived.verifiedAtIso ?? derived.createdAtIso,
    ),
    storiesRecorded: asNumber(
      r.storiesRecorded ?? 0,
      "reputation.storiesRecorded",
    ),
    score: asNumber(r.score ?? 0, "reputation.score"),
    totalViews: asNumber(r.totalViews ?? 0, "reputation.totalViews"),
    daysFeatured: asNumber(r.daysFeatured ?? 0, "reputation.daysFeatured"),
    reviewCount: asNumber(r.reviewCount ?? 0, "reputation.reviewCount"),
    replyMedianMinutes:
      typeof r.replyMedianMinutes === "number" &&
      Number.isFinite(r.replyMedianMinutes)
        ? r.replyMedianMinutes
        : undefined,
  };
}

/**
 * Maps the optional `videos` array on a listing (ADR-015). Each entry
 * must have a non-empty path and a finite duration in [3, 30]; malformed
 * entries are silently dropped so a single bad row never poisons the
 * whole listing render.
 */
function asVideos(value: unknown): ReadonlyArray<BiringaVideo> | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: BiringaVideo[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Raw;
    const path = typeof r.path === "string" ? r.path : null;
    const duration =
      typeof r.durationSeconds === "number" &&
      Number.isFinite(r.durationSeconds)
        ? r.durationSeconds
        : null;
    if (!path || duration === null) continue;
    if (duration < 1 || duration > 60) continue;
    out.push({ path, durationSeconds: duration });
  }
  return out.length > 0 ? out : undefined;
}

/**
 * Maps the optional `plan` subdocument on a listing. Anything malformed
 * (missing tier, unparseable timestamp) collapses to `undefined` so the
 * UI defaults to "no active plan" rather than rendering broken state.
 */
function asPlan(value: unknown): BiringaListing["plan"] {
  if (!value || typeof value !== "object") return undefined;
  const r = value as Raw;
  const tier =
    r.tier === "boost" || r.tier === "elite"
      ? (r.tier as PlanTier)
      : null;
  const activeUntil = toIsoOptional(r.activeUntil);
  if (!tier || !activeUntil) return undefined;
  return { tier, activeUntil };
}

function asCoords(value: unknown): { lat: number; lng: number } {
  const r = (value ?? {}) as Raw;
  return {
    lat: asNumber(r.lat ?? 0, "coords.lat"),
    lng: asNumber(r.lng ?? 0, "coords.lng"),
  };
}

/**
 * Sensitive fields (`privatePhone`, `privateWhatsapp`) are NEVER mapped here.
 * They live behind a separate authenticated path in the adapter to ensure
 * they cannot accidentally end up in HTML.
 */
export function mapListing(id: string, data: Raw): BiringaListing {
  const createdAt = toIso(data.createdAt, "createdAt");
  const verified = asBool(data.verified);
  // Fall back to createdAt when the listing is verified but pre-dates the
  // verifiedAt field. Unverified listings keep verifiedAt undefined so the
  // mapper computes 0 days, not "hace Xd desde que la subiste".
  const verifiedAt =
    toIsoOptional(data.verifiedAt) ?? (verified ? createdAt : undefined);
  return {
    id,
    slug: asString(data.slug, "slug"),
    name: asString(data.name, "name"),
    age: asNumber(data.age, "age"),
    city: asString(data.city, "city"),
    neighborhood:
      typeof data.neighborhood === "string" ? data.neighborhood : undefined,
    pricePerHour: asNumber(data.pricePerHour, "pricePerHour"),
    mainImage: asString(data.mainImage, "mainImage"),
    gallery: asStringArray(data.gallery),
    verified,
    hasVideo: asBool(data.hasVideo),
    hasAudio: asBool(data.hasAudio),
    tags: asStringArray(data.tags),
    bio: asString(data.bio, "bio"),
    shortBio: asString(data.shortBio, "shortBio"),

    category: asString(data.category, "category") as Category,
    sex: asString(data.sex, "sex") as Sex,
    attention: asStringArray(data.attention) as ReadonlyArray<AttentionTarget>,
    contactChannels: asStringArray(
      data.contactChannels,
    ) as ReadonlyArray<ContactChannel>,
    paymentByCard: asBool(data.paymentByCard),
    faceVisible: asBool(data.faceVisible),
    storyAt: toIsoOptional(data.storyAt),

    reputation: asReputation(data.reputation, {
      createdAtIso: createdAt,
      verifiedAtIso: verifiedAt,
    }),
    attributes: asAttributes(data.attributes),

    services: asStringArray(data.services),
    specialServices: asStringArray(data.specialServices),
    meetingContexts: asStringArray(data.meetingContexts),

    coords: asCoords(data.coords),
    createdAt,
    updatedAt: toIso(data.updatedAt, "updatedAt"),
    verifiedAt,
    plan: asPlan(data.plan),
    videos: asVideos(data.videos),
  };
}

export function mapReviewItem(id: string, data: Raw): ReviewItem {
  return {
    id,
    alias: asString(data.alias, "alias"),
    city: asString(data.city, "city"),
    date: toIso(data.date, "date"),
    rating: asNumber(data.rating, "rating"),
    body: asString(data.body, "body"),
    helpful: asNumber(data.helpful ?? 0, "helpful"),
    notHelpful: asNumber(data.notHelpful ?? 0, "notHelpful"),
    verified: asBool(data.verified),
  };
}

/**
 * Aggregate builder when the listing exposes precomputed aggregates as a
 * subdocument (`listings/{id}/aggregates/reviews`). Callers that want
 * on-the-fly aggregates can rebuild from the reviews subcollection.
 */
export function mapReviewsAggregate(
  data: Raw,
  reviews: ReadonlyArray<ReviewItem>,
): ReviewsAggregate {
  const breakdownRaw = (data.breakdown ?? {}) as Raw;
  const breakdown: ReviewBreakdown = {
    trato: asNumber(breakdownRaw.trato ?? 0, "breakdown.trato"),
    puntualidad: asNumber(
      breakdownRaw.puntualidad ?? 0,
      "breakdown.puntualidad",
    ),
    conversacion: asNumber(
      breakdownRaw.conversacion ?? 0,
      "breakdown.conversacion",
    ),
    presentacion: asNumber(
      breakdownRaw.presentacion ?? 0,
      "breakdown.presentacion",
    ),
    discrecion: asNumber(breakdownRaw.discrecion ?? 0, "breakdown.discrecion"),
  };

  const distribution = Array.isArray(data.distribution)
    ? data.distribution
        .filter((v): v is Raw => typeof v === "object" && v !== null)
        .map((v) => ({
          stars: asNumber(v.stars, "distribution.stars"),
          count: asNumber(v.count, "distribution.count"),
          percent: asNumber(v.percent, "distribution.percent"),
        }))
    : [];

  return {
    total: asNumber(data.total ?? reviews.length, "total"),
    averageRating: asNumber(data.averageRating ?? 0, "averageRating"),
    recommendRate: asNumber(data.recommendRate ?? 0, "recommendRate"),
    distribution,
    breakdown,
    anonymousLikes: asNumber(data.anonymousLikes ?? 0, "anonymousLikes"),
    anonymousDislikes: asNumber(
      data.anonymousDislikes ?? 0,
      "anonymousDislikes",
    ),
    reviews,
  };
}
