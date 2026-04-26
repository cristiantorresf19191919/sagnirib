import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright base config.
 * - default project covers desktop smoke
 * - "responsive" project iterates audit viewports per Addendum 002 §10
 *
 * Tests live under tests/e2e/. webServer is left as a default `pnpm dev`
 * runner; CI can override via PLAYWRIGHT_BASE_URL.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "responsive-360",
      use: { viewport: { width: 360, height: 740 } },
      testMatch: /.*\.responsive\.spec\.ts/,
    },
    {
      name: "responsive-390",
      use: { viewport: { width: 390, height: 844 } },
      testMatch: /.*\.responsive\.spec\.ts/,
    },
    {
      name: "responsive-768",
      use: { viewport: { width: 768, height: 1024 } },
      testMatch: /.*\.responsive\.spec\.ts/,
    },
    {
      name: "responsive-1024",
      use: { viewport: { width: 1024, height: 768 } },
      testMatch: /.*\.responsive\.spec\.ts/,
    },
    {
      name: "responsive-1280",
      use: { viewport: { width: 1280, height: 800 } },
      testMatch: /.*\.responsive\.spec\.ts/,
    },
    {
      name: "responsive-1440",
      use: { viewport: { width: 1440, height: 900 } },
      testMatch: /.*\.responsive\.spec\.ts/,
    },
    {
      name: "responsive",
      use: {},
      testMatch: /never-matches-on-its-own/,
    },
  ],
  webServer: process.env.CI
    ? undefined
    : {
        command: "pnpm dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
