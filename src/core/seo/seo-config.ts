import { brandConfig } from "@/core/branding/brand-config";
import { site } from "@/core/env/site";

/**
 * Global SEO configuration consumed by metadata helpers, sitemap and robots.
 * Per Addendum 001, no public route may ship without an approved SEO Route
 * Contract. Until the intake closes, the whole site is treated as noindex.
 */
export const seoConfig = {
  siteName: brandConfig.name,
  defaultLocale: brandConfig.defaultLocale,
  supportedLocales: brandConfig.supportedLocales,
  /**
   * Master switch. While intake/handshake is open, every route is
   * noindex. Flipped to true only after release-hardening signs off.
   */
  indexingEnabled: false,
  metadataBase: new URL(site.url),
  twitterHandle: brandConfig.social.twitter || undefined,
} as const;
