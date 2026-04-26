/**
 * Environment-aware site config.
 *
 * Production domain has not been decided (see docs/seo/seo-strategy.md
 * § "Pending decisions"). NEXT_PUBLIC_SITE_URL must be set per environment.
 * In dev it falls back to http://localhost:3000.
 */
const fallbackDevUrl = "http://localhost:3000";

function readSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  return fallbackDevUrl;
}

export const site = {
  url: readSiteUrl(),
  env: (process.env.NEXT_PUBLIC_APP_ENV ?? "development") as
    | "development"
    | "staging"
    | "production",
  isProduction:
    (process.env.NEXT_PUBLIC_APP_ENV ?? "development") === "production",
} as const;

export const metadataBase = new URL(site.url);
