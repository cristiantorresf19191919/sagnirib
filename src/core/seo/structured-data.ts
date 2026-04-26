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
