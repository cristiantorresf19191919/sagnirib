import type { Metadata } from "next";

import { brandConfig } from "@/core/branding/brand-config";

import { seoConfig } from "./seo-config";

/**
 * Defaults shared across every route. Per Addendum 001 §4 these defaults
 * MUST be reused via build-page-metadata, never duplicated per page.
 */
export const defaultMetadata: Metadata = {
  metadataBase: seoConfig.metadataBase,
  title: {
    default: brandConfig.name,
    template: `%s · ${brandConfig.name}`,
  },
  description: brandConfig.description,
  applicationName: brandConfig.name,
  // RTA ("Restricted To Adults") label — the industry-standard signal that
  // parental-control filters read to block age-restricted sites. Set once at
  // the site level so every route inherits it; pages built via
  // build-page-metadata never override `other`, so the tag survives. See
  // /legal/control-parental for the full parental-control policy.
  other: {
    rating: "RTA-5042-1996-1400-1577-RTA",
  },
  robots: seoConfig.indexingEnabled
    ? { index: true, follow: true }
    : { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: brandConfig.name,
    locale: brandConfig.defaultLocale,
  },
  twitter: {
    card: "summary_large_image",
  },
};
