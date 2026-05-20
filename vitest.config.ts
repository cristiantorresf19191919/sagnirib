import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // `server-only` throws at module load to fence client bundles in
      // production. Tests need access to pure helpers under src/server/...
      // (schemas, mappers) — stub the import to a no-op for vitest only.
      // The Next.js compiler still gets the real package in dev / build.
      "server-only": path.resolve(__dirname, "tests/setup/server-only-stub.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/integration/**/*.test.{ts,tsx}"],
  },
});
