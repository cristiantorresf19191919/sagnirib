import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next does not pick up an unrelated lockfile
  // higher up in the user profile. Next 16 + Turbopack convention.
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    // Mock-only catalog points at Unsplash hot-links during F3. Production
    // catalog will replace this with an asset provider that documents
    // consent per-image (project-intake.md "Pendientes" + ADR-009).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
