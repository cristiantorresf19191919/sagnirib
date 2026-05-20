import { brandConfig } from "@/core/branding/brand-config";

import { seoConfig } from "./seo-config";

/**
 * JSON-LD builders. Per Addendum 001 §6 schemas are not decorative —
 * each call site must justify the schema in its SEO Route Contract,
 * and only emit one when the visible content backs it up.
 */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brandConfig.legalName,
    url: seoConfig.metadataBase.toString(),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brandConfig.name,
    url: seoConfig.metadataBase.toString(),
  };
}

interface PersonJsonLdInput {
  name: string;
  /** Profile slug, used to build the canonical URL. */
  slug: string;
  city: string;
  description: string;
  /** Public hero image — appears as the `image` in rich results. */
  imageUrl: string;
  /** Optional: aggregate rating from `reputation.score` + `reviewCount`.
   *  Pass `null` to skip the property entirely (Google rejects schemas
   *  with `aggregateRating.reviewCount === 0`). */
  rating: { score: number; reviewCount: number } | null;
}

/**
 * Person schema for `/p/[slug]`. Backed by VISIBLE content on the
 * profile page (name + avatar + city + bio + reviews), per Addendum
 * 001 §6 — never emit a schema the page doesn't actually display.
 *
 * `aggregateRating` is only included when there is at least one review;
 * Google's rich-result validator flags schemas that claim a rating
 * without any reviews to back it.
 */
export function personJsonLd(input: PersonJsonLdInput) {
  const canonical = new URL(
    `/p/${input.slug}`,
    seoConfig.metadataBase,
  ).toString();
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.name,
    url: canonical,
    image: input.imageUrl,
    description: input.description,
    address: {
      "@type": "PostalAddress",
      addressLocality: input.city,
      addressCountry: "CO",
    },
  };
  if (input.rating && input.rating.reviewCount > 0) {
    base.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: input.rating.score.toFixed(1),
      reviewCount: input.rating.reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }
  return base;
}
