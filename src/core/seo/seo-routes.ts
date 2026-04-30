/**
 * Registry of public routes and their SEO contract status.
 *
 * Each entry MUST be backed by an approved contract under
 * `docs/seo/routes/<file>.md`. Adding a route here without one is an
 * audit failure (`pnpm seo:audit`).
 *
 * Sitemap and robots read from this list, but the global switch
 * `seoConfig.indexingEnabled` still gates everything until release-hardening.
 */
export type SeoRouteStatus = "draft" | "approved" | "implemented" | "audited";

export interface SeoRouteEntry {
  /** Static path or template (e.g. `/p/[slug]`). */
  path: string;
  /** Path to the approved contract relative to repo root. */
  contractPath: string;
  status: SeoRouteStatus;
  indexable: boolean;
  inSitemap: boolean;
  changeFrequency?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
  /**
   * True when path contains dynamic segments (`[slug]`). Sitemap generation
   * for dynamic routes must enumerate the entries from a repository — not
   * emit the template literal.
   */
  isDynamic?: boolean;
}

export const seoRoutes: ReadonlyArray<SeoRouteEntry> = [
  {
    path: "/",
    contractPath: "docs/seo/routes/home.md",
    status: "approved",
    indexable: true,
    inSitemap: true,
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    path: "/explorar",
    contractPath: "docs/seo/routes/explorar.md",
    status: "approved",
    indexable: true,
    inSitemap: true,
    changeFrequency: "daily",
    priority: 0.8,
  },
  {
    path: "/p/[slug]",
    contractPath: "docs/seo/routes/p-slug.md",
    status: "approved",
    // Per-profile gate is enforced when listing entries are emitted into the
    // sitemap — the template itself is NOT indexable as a literal.
    indexable: false,
    inSitemap: false,
    isDynamic: true,
    changeFrequency: "weekly",
    priority: 0.6,
  },
  {
    path: "/publicar",
    contractPath: "docs/seo/routes/publicar.md",
    // Funnel page — never indexable, never in sitemap. Lives here so audits
    // know it exists and is accounted for.
    status: "approved",
    indexable: false,
    inSitemap: false,
  },
];
