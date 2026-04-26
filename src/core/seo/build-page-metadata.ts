import type { Metadata } from "next";

import { seoConfig } from "./seo-config";

export interface PageMetadataInput {
  title: string;
  description: string;
  /** Path relative to siteUrl, e.g. "/about" or "/listings/[id]". */
  path: string;
  /** Per-page override of the global indexing switch. */
  indexable?: boolean;
  ogImage?: string;
  alternates?: {
    languages?: Record<string, string>;
  };
}

/**
 * Builds a Metadata object from a route's SEO contract values.
 * Centralised so titles, canonicals and OG defaults stay consistent.
 * Drives the Factory pattern called out in Addendum 002 §4.
 */
export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const indexable = input.indexable ?? seoConfig.indexingEnabled;
  const canonicalUrl = new URL(input.path, seoConfig.metadataBase).toString();

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: canonicalUrl,
      languages: input.alternates?.languages,
    },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonicalUrl,
      siteName: seoConfig.siteName,
      images: input.ogImage ? [{ url: input.ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: input.ogImage ? [input.ogImage] : undefined,
    },
  };
}
