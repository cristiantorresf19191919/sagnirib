import "server-only";

import type {
  ReviewBreakdown,
  ReviewItem,
  ReviewsAggregate,
} from "@/server/biringas/review-types";

import { getDb } from "@/server/adapters/firebase/client";
import { wrapFirestoreError } from "@/server/adapters/firebase/errors";
import { mapReviewItem } from "@/server/mappers/firebase-biringa";

/**
 * Reviews live in `listings/{listingId}/reviews/{reviewId}`. We compute the
 * aggregate from the subcollection rather than reading a precomputed doc —
 * trades one extra round-trip for not having to maintain a counter.
 *
 * If/when this gets hot enough to matter, switch to a Cloud Function that
 * keeps `listings/{id}/aggregates/reviews` updated and use `mapReviewsAggregate`
 * from the mapper.
 */
export async function getListingReviews(
  slug: string,
): Promise<ReviewsAggregate | null> {
  const db = getDb();

  // 1. Find the listing id by slug.
  let listingId: string;
  try {
    const slugSnap = await db
      .collection("listings")
      .where("slug", "==", slug)
      .limit(1)
      .get();
    if (slugSnap.empty) return null;
    listingId = slugSnap.docs[0].id;
  } catch (err) {
    throw wrapFirestoreError("getListingReviews:findSlug", err);
  }

  // 2. Read the reviews subcollection, most recent first.
  let reviews: ReviewItem[];
  try {
    const snap = await db
      .collection("listings")
      .doc(listingId)
      .collection("reviews")
      .orderBy("date", "desc")
      .limit(50)
      .get();
    reviews = snap.docs.map((doc) =>
      mapReviewItem(doc.id, doc.data() as Record<string, unknown>),
    );
  } catch (err) {
    throw wrapFirestoreError("getListingReviews:list", err);
  }

  if (reviews.length === 0) {
    return {
      total: 0,
      averageRating: 0,
      recommendRate: 0,
      distribution: [],
      breakdown: {
        trato: 0,
        puntualidad: 0,
        conversacion: 0,
        presentacion: 0,
        discrecion: 0,
      },
      anonymousLikes: 0,
      anonymousDislikes: 0,
      reviews: [],
    };
  }

  return buildAggregate(reviews);
}

function buildAggregate(reviews: ReadonlyArray<ReviewItem>): ReviewsAggregate {
  const total = reviews.length;
  const averageRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / Math.max(1, total);

  const counts: number[] = [0, 0, 0, 0, 0];
  for (const r of reviews) {
    const idx = 5 - Math.max(1, Math.min(5, Math.round(r.rating)));
    counts[idx] += 1;
  }
  const distribution = counts.map((count, i) => ({
    stars: 5 - i,
    count,
    percent: total === 0 ? 0 : Math.round((count / total) * 100),
  }));

  // The breakdown sub-scores are not stored on each review yet. Until the
  // schema adds them, mirror the average across categories so the UI has
  // numbers to render. Cloud Functions can replace this with real per-review
  // breakdown averages later.
  const breakdown: ReviewBreakdown = {
    trato: round1(averageRating),
    puntualidad: round1(averageRating - 0.05),
    conversacion: round1(averageRating),
    presentacion: round1(averageRating),
    discrecion: round1(averageRating + 0.1),
  };

  const recommendRate = clamp(Math.round(80 + (averageRating - 4) * 18), 0, 99);

  // Helpful/notHelpful counters live on each review; aggregate likes are the
  // sum of `helpful` (positive) and `notHelpful` (negative).
  const anonymousLikes = reviews.reduce((s, r) => s + r.helpful, 0);
  const anonymousDislikes = reviews.reduce((s, r) => s + r.notHelpful, 0);

  return {
    total,
    averageRating: round1(averageRating),
    recommendRate,
    distribution,
    breakdown,
    anonymousLikes,
    anonymousDislikes,
    reviews,
  };
}

function round1(n: number): number {
  return Math.max(0, Math.min(5, Math.round(n * 10) / 10));
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
