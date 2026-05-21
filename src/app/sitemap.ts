import type { MetadataRoute } from "next";

import { brandConfig } from "@/core/branding/brand-config";
import { localizedHref } from "@/core/i18n/href";
import { seoConfig } from "@/core/seo/seo-config";
import { seoRoutes } from "@/core/seo/seo-routes";
import { SUPPORTED_CITIES } from "@/server/biringas";

/**
 * Sitemap is built from the approved-route registry plus dynamic
 * enumerations for templated routes that are indexable per-instance.
 *
 * Per ADR-017 every indexable static route emits one entry per
 * supported locale (`/es/foo`, `/en/foo`) with an `alternates.languages`
 * map so search engines route users to their preferred translation.
 *
 * While the global indexing switch is off (foundation phase), the
 * sitemap is intentionally empty so search engines don't index any
 * URL we haven't approved.
 *
 * Dynamic enumerations covered today:
 *   - `/explorar/[city]` — one entry per `SUPPORTED_CITIES` per locale
 *
 * Future:
 *   - `/p/[slug]` per published listing flagged `indexable === true`
 *     (TODO: append once a real listings repository ships)
 */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!seoConfig.indexingEnabled) return [];

  const base = new Date();
  const locales = brandConfig.supportedLocales;

  function alternatesFor(pathname: string): Record<string, string> {
    const langs: Record<string, string> = {};
    for (const loc of locales) {
      langs[loc] = new URL(
        localizedHref(loc, pathname),
        seoConfig.metadataBase,
      ).toString();
    }
    langs["x-default"] = new URL(
      localizedHref(brandConfig.defaultLocale, pathname),
      seoConfig.metadataBase,
    ).toString();
    return langs;
  }

  const staticEntries = seoRoutes
    .filter((route) => route.indexable && route.inSitemap && !route.isDynamic)
    .flatMap((route) =>
      locales.map((loc) => ({
        url: new URL(
          localizedHref(loc, route.path),
          seoConfig.metadataBase,
        ).toString(),
        lastModified: base,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: { languages: alternatesFor(route.path) },
      })),
    );

  // City landing pages — enumerated from the supported cities list.
  // Each city is encoded so accented characters survive the URL safely.
  const cityRoute = seoRoutes.find((r) => r.path === "/explorar/[city]");
  const cityEntries = cityRoute
    ? SUPPORTED_CITIES.flatMap((city) =>
        locales.map((loc) => {
          const localePath = `/explorar/${encodeURIComponent(city)}`;
          return {
            url: new URL(
              localizedHref(loc, localePath),
              seoConfig.metadataBase,
            ).toString(),
            lastModified: base,
            changeFrequency: cityRoute.changeFrequency,
            priority: cityRoute.priority,
            alternates: { languages: alternatesFor(localePath) },
          };
        }),
      )
    : [];

  return [...staticEntries, ...cityEntries];
}
