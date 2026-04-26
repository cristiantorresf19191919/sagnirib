import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next does not pick up an unrelated lockfile
  // higher up in the user profile. Next 16 + Turbopack convention.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
