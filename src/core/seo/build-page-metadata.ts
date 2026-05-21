import type { Metadata } from "next";

import { brandConfig, type SupportedLocale } from "@/core/branding/brand-config";
import { localizedHref } from "@/core/i18n/href";

import { seoConfig } from "./seo-config";

export interface PageMetadataInput {
  title: string;
  description: string;
  /**
   * Locale-less canonical path. Examples: `/`, `/explorar`, `/p/[slug]`,
   * `/legal/terminos`. The builder prepends the active locale to compose
   * the canonical URL and emits one `<link rel="alternate" hreflang="…">`
   * per supported locale automatically (plus an `x-default` pointing at
   * the default locale).
   *
   * Pass an absolute path (`/foo`) — never a locale-prefixed one (no
   * `/es/foo`). Locale prefixing happens here.
   *
   * Backwards compat: the deprecated `path` field is still accepted and
   * forwarded into `pathname` for pages that have not been migrated yet.
   * Per ADR-017 every caller should move to `pathname + locale` so its
   * `<link rel="alternate" hreflang>` set is correct.
   */
  pathname?: string;
  /** @deprecated Use `pathname` together with `locale`. */
  path?: string;
  /**
   * The locale currently being rendered. Drives the canonical URL.
   * Falls back to `brandConfig.defaultLocale` when omitted — the page
   * will still emit a canonical, just one anchored to the default
   * locale. Migrating to pass `locale` explicitly unlocks per-locale
   * hreflang alternates.
   */
  locale?: SupportedLocale;
  /** Per-page override of the global indexing switch. */
  indexable?: boolean;
  ogImage?: string;
  /**
   * Optional manual override for `alternates.languages`. When provided
   * the builder skips the auto-generated map.
   */
  alternates?: {
    languages?: Record<string, string>;
  };
}

/**
 * Builds a Metadata object from a route's SEO contract values.
 *
 * Centralised so titles, canonicals, OG defaults and hreflang
 * alternates stay consistent across the site. Per ADR-017 this helper
 * is locale-aware: every public route emits both a canonical URL for
 * the active locale AND one alternate per supported locale so crawlers
 * can route users to their preferred translation.
 *
 * Drives the Factory pattern called out in Addendum 002 §4.
 */
export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const indexable = input.indexable ?? seoConfig.indexingEnabled;
  const locale = input.locale ?? brandConfig.defaultLocale;
  const pathname = input.pathname ?? input.path ?? "/";

  const canonicalPath = localizedHref(locale, pathname);
  const canonicalUrl = new URL(canonicalPath, seoConfig.metadataBase).toString();

  const languages: Record<string, string> =
    input.alternates?.languages ?? buildLanguageAlternates(pathname);

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonicalUrl,
      siteName: seoConfig.siteName,
      locale,
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

function buildLanguageAlternates(pathname: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const loc of brandConfig.supportedLocales) {
    out[loc] = new URL(
      localizedHref(loc, pathname),
      seoConfig.metadataBase,
    ).toString();
  }
  out["x-default"] = new URL(
    localizedHref(brandConfig.defaultLocale, pathname),
    seoConfig.metadataBase,
  ).toString();
  return out;
}
