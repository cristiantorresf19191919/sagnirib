import path from "node:path";

import type { NextConfig } from "next";

// Bucket name from server env. next.config.ts runs at build time on the
// server, so process.env is fully populated (no NEXT_PUBLIC_ prefix needed).
// Fallback string keeps prod builds from breaking if the var is somehow
// missing — image hosts pinned to *this* bucket, not a wildcard.
const STORAGE_BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET?.trim() ??
  "biringas-v2.firebasestorage.app";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
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
