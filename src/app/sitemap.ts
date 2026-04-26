import type { MetadataRoute } from "next";

import { seoConfig } from "@/core/seo/seo-config";
import { seoRoutes } from "@/core/seo/seo-routes";

/**
 * Sitemap is built from the approved-route registry. While the global
 * indexing switch is off (foundation phase), the sitemap is intentionally
 * empty.
 *
 * Dynamic templates (`/p/[slug]`) are skipped here — their concrete entries
 * must be enumerated by the listings repository when that feature lands
 * (TODO F5: append profile entries flagged `indexable === true`).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!seoConfig.indexingEnabled) return [];

  return seoRoutes
    .filter((route) => route.indexable && route.inSitemap && !route.isDynamic)
    .map((route) => ({
      url: new URL(route.path, seoConfig.metadataBase).toString(),
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }));
}
