import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { readLocale } from "@/core/i18n/locale";
import { t } from "@/core/i18n/messages";
import { CatalogCard } from "@/features/catalog/components/CatalogCard";
import { listFeatured } from "@/server/biringas";
import { Container } from "@/shared/design-system/components/Container";

/**
 * Home's "Destacadas" surface — a curated 4-card strip pulled from
 * `listFeatured()` (verified + high-score). Satisfies the home SEO
 * contract requirement of "featured listings" and gives the user a
 * concrete entry into the catalog without scrolling the full grid.
 *
 * Why not a horizontal carousel? Plain CSS grid keeps the surface
 * SSR-stable, accessible, and trivially responsive (1 col mobile → 4 col
 * desktop). When we have enough listings to justify horizontal scrolling
 * with snap-points, lift this into a client component.
 */
export async function FeaturedStrip() {
  // Auxiliary content — degrade to null on failure so the home page still
  // renders. See note in EditorialHero re: missing Firestore indexes on
  // first production read.
  const [featured, locale] = await Promise.all([
    listFeatured(4).catch((err) => {
      console.error("[home] listFeatured failed", err);
      return [] as Awaited<ReturnType<typeof listFeatured>>;
    }),
    readLocale(),
  ]);
  if (featured.length === 0) return null;

  return (
    <section
      aria-labelledby="featured-title"
      className="relative isolate overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-background)] py-14 sm:py-18"
    >
      {/* Ambient gradient mesh — same vocabulary as the hero so the page
          reads as one continuous editorial spread. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 motion-safe:motion-aurora opacity-60"
        style={{
          background:
            "radial-gradient(40% 35% at 90% 10%, rgba(200,166,118,0.10), transparent 70%), radial-gradient(45% 40% at 5% 90%, rgba(31,61,46,0.07), transparent 70%)",
        }}
      />

      <Container width="wide" className="flex flex-col gap-7">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="flex flex-col gap-3">
            {/* Editorial flourish — gold gradient rule + rotated diamond +
                small caps eyebrow. Reads as a magazine chapter header. */}
            <span className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-brand-primary)]">
              <span
                aria-hidden
                className="inline-block h-px w-10 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-[var(--color-brand-primary)]/40"
              />
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--color-gold)] shadow-[0_0_0_3px_rgba(200,166,118,0.18)]"
              />
              {t(locale, "featured.eyebrow")}
              <span
                aria-hidden
                className="inline-block h-px w-10 bg-gradient-to-l from-transparent via-[var(--color-gold)] to-[var(--color-brand-primary)]/40"
              />
            </span>
            <h2
              id="featured-title"
              className="font-[var(--font-display)] text-[clamp(28px,3.8vw,44px)] leading-[1.02] tracking-[-0.025em] text-[var(--color-foreground)]"
            >
              {t(locale, "featured.title.before")}{" "}
              <span className="italic font-[360] text-[var(--color-brand-primary)]">
                {t(locale, "featured.title.italic")}
              </span>{" "}
              {t(locale, "featured.title.after")}
            </h2>
            <p className="max-w-xl font-[var(--font-serif)] text-[15px] leading-[1.55] text-[var(--color-text-muted)]">
              {t(locale, "featured.subtitlePrefix")}{" "}
              <em>{t(locale, "featured.subtitleItalic")}</em>
            </p>
          </div>
          <Link
            href="/explorar"
            className="group/seeall inline-flex items-center gap-1.5 self-start rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-brand-primary)] transition-[border-color,background,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:border-[var(--color-brand-primary)]/40 hover:bg-[var(--color-background-elevated)] sm:self-auto"
          >
            <span className="relative">
              {t(locale, "featured.cta")}
              <span
                aria-hidden
                className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-[var(--color-brand-primary-strong)] transition-transform duration-300 ease-[var(--ease-standard)] group-hover/seeall:scale-x-100"
              />
            </span>
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 ease-[var(--ease-standard)] group-hover/seeall:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </header>

        {/* Thin double-rule divider, magazine-style. The top hairline is
            full-width; the bottom is short and offset right with a diamond
            mark — an old print typographer's trick that adds a tactile sense
            of structure. */}
        <div aria-hidden className="relative h-3">
          <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent" />
          <span className="absolute right-[30%] top-1.5 h-px w-24 bg-[var(--color-gold)]/40" />
          <span className="absolute right-[30%] top-1 inline-block h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-[var(--color-gold)]" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((listing, idx) => (
            <div
              key={listing.id}
              data-rise
              className="motion-safe:motion-view-rise"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <CatalogCard
                listing={listing}
                featured
                priority={idx === 0}
                view="grid3"
              />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
