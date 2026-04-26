import type { MetadataRoute } from "next";

import { seoConfig } from "@/core/seo/seo-config";

export default function robots(): MetadataRoute.Robots {
  if (!seoConfig.indexingEnabled) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/"],
    },
    sitemap: new URL("/sitemap.xml", seoConfig.metadataBase).toString(),
  };
}
