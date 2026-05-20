import type { MetadataRoute } from "next";

import { brandConfig } from "@/core/branding/brand-config";

/**
 * PWA manifest — served as `/manifest.webmanifest` by Next 16's file
 * convention. Combined with the `icon.tsx` + `apple-icon.tsx`
 * adjacent files, this gives the site full "Add to Home Screen"
 * support on iOS and Android without any extra assets or a service
 * worker.
 *
 * `display: "standalone"` strips the browser chrome so when a model
 * installs the dashboard as an app, /mi-cuenta opens like a native
 * surface. `start_url` lands the installed shortcut on the dashboard
 * (signed-in users) or the auth gate (anonymous), exactly as the
 * regular route does — no extra wiring needed.
 *
 * Theme + background colours track the default light theme tokens.
 * The 7 dynamic themes still flip via the in-app toggle once the PWA
 * is open; only the splash screen + status-bar colour are fixed.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brandConfig.name,
    short_name: brandConfig.name,
    description: brandConfig.description,
    start_url: "/mi-cuenta",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F4EFE3",
    theme_color: "#2F5D43",
    lang: brandConfig.defaultLocale,
    categories: ["lifestyle", "social"],
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
