import path from "node:path";

import type { NextConfig } from "next";

// Bucket name from server env. next.config.ts runs at build time on the
// server, so process.env is fully populated (no NEXT_PUBLIC_ prefix needed).
// Fallback string keeps prod builds from breaking if the var is somehow
// missing — image hosts pinned to *this* bucket, not a wildcard.
const STORAGE_BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET?.trim() ??
  "biringas-v2.firebasestorage.app";

// Locale fallback for hosts where `proxy.ts` is not yet recognised
// (current Netlify Next.js runtime still keys on the legacy
// `middleware.ts` filename). Each `/` redirect + each unprefixed deep
// path is evaluated against the cookie set by the header switcher, then
// against Accept-Language, then falls back to the brand default (`es`).
//
// Mirrors `LOCALE_COOKIE` in src/core/i18n/constants.ts and the
// detection precedence in proxy.ts — hardcoded here because
// next.config.ts must stay free of `@/` aliases.
const LOCALE_COOKIE = "biringas:locale";
const ACCEPT_LANGUAGE_IS_EN = "^en(?:[-,;]|$)";

// First-segment guard: anything that ISN'T already a locale and isn't
// one of the file-convention routes Next serves from `app/` root.
// Mirrors `ROOT_FILE_ROUTES` in proxy.ts.
const UNPREFIXED_SOURCE =
  "/:rest((?!es$|es/|en$|en/|api$|api/|_next$|_next/|sitemap\\.xml$|robots\\.txt$|manifest\\.webmanifest$|icon$|icon/|apple-icon$|apple-icon/|favicon\\.ico$).*)";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    return [
      // Root `/` — three-tier detection, first match wins.
      {
        source: "/",
        has: [{ type: "cookie", key: LOCALE_COOKIE, value: "en" }],
        destination: "/en",
        permanent: false,
      },
      {
        source: "/",
        has: [
          {
            type: "header",
            key: "accept-language",
            value: ACCEPT_LANGUAGE_IS_EN,
          },
        ],
        destination: "/en",
        permanent: false,
      },
      { source: "/", destination: "/es", permanent: false },

      // Deep unprefixed paths (e.g. /explorar, /p/foo) — same chain.
      {
        source: UNPREFIXED_SOURCE,
        has: [{ type: "cookie", key: LOCALE_COOKIE, value: "en" }],
        destination: "/en/:rest",
        permanent: false,
      },
      {
        source: UNPREFIXED_SOURCE,
        has: [
          {
            type: "header",
            key: "accept-language",
            value: ACCEPT_LANGUAGE_IS_EN,
          },
        ],
        destination: "/en/:rest",
        permanent: false,
      },
      { source: UNPREFIXED_SOURCE, destination: "/es/:rest", permanent: false },
    ];
  },
  images: {
    // Next 16 enforces an explicit allowlist of quality values; default is
    // [75] only. The catalog uses 55 for tight thumbnails (faster scroll on
    // mobile) — keep both.
    qualities: [55, 75],
    remotePatterns: [
      // Seed-data mock photos. Will be removed once the catalog runs on
      // real listings only.
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "static1.mileroticos.com",
        pathname: "/**",
      },
      // Real photos from approved listings. ADR-012: the admin promotes
      // assets to `listings/{slug}/photos/*` and makes them public via
      // `makePublic()`, which produces `storage.googleapis.com/<bucket>/...`
      // URLs. Pin the pathname to OUR bucket so `next/image` does not
      // unintentionally accept other GCS buckets.
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: `/${STORAGE_BUCKET}/**`,
      },
    ],
  },
};

export default nextConfig;
