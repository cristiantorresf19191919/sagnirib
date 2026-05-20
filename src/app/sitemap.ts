import type { MetadataRoute } from "next";

import { seoConfig } from "@/core/seo/seo-config";
import { seoRoutes } from "@/core/seo/seo-routes";
import { SUPPORTED_CITIES } from "@/server/biringas";

/**
 * Sitemap is built from the approved-route registry plus dynamic
 * enumerations for templated routes that are indexable per-instance.
 *
 * While the global indexing switch is off (foundation phase), the
 * sitemap is intentionally empty so search engines don't index any
 * URL we haven't approved.
 *
 * Dynamic enumerations covered today:
 *   - `/explorar/[city]` — one entry per `SUPPORTED_CITIES`
 *
 * Future:
 *   - `/p/[slug]` per published listing flagged `indexable === true`
 *     (TODO: append once a real listings repository ships)
 */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!seoConfig.indexingEnabled) return [];

  const base = new Date();

  const staticEntries = seoRoutes
    .filter((route) => route.indexable && route.inSitemap && !route.isDynamic)
    .map((route) => ({
      url: new URL(route.path, seoConfig.metadataBase).toString(),
      lastModified: base,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }));

  // City landing pages — enumerated from the supported cities list.
  // Each city is encoded so accented characters survive the URL safely.
  const cityRoute = seoRoutes.find((r) => r.path === "/explorar/[city]");
  const cityEntries = cityRoute
    ? SUPPORTED_CITIES.map((city) => ({
        url: new URL(
          `/explorar/${encodeURIComponent(city)}`,
          seoConfig.metadataBase,
        ).toString(),
        lastModified: base,
        changeFrequency: cityRoute.changeFrequency,
        priority: cityRoute.priority,
      }))
    : [];

  return [...staticEntries, ...cityEntries];
}
