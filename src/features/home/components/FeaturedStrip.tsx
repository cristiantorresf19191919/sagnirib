import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
  const featured = await listFeatured(4).catch((err) => {
    console.error("[home] listFeatured failed", err);
    return [] as Awaited<ReturnType<typeof listFeatured>>;
  });
  if (featured.length === 0) return null;

  return (
    <section
      aria-labelledby="featured-title"
      className="border-b border-[var(--color-border)] bg-[var(--color-background)] py-14 sm:py-18"
    >
      <Container width="wide" className="flex flex-col gap-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-primary)]">
              Destacadas
            </span>
            <h2
              id="featured-title"
              className="text-2xl font-bold leading-tight tracking-tight text-[var(--color-foreground)] sm:text-3xl"
            >
              Perfiles verificados que están convirtiendo esta semana
            </h2>
          </div>
          <Link
            href="/explorar"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary-strong)]"
          >
            Ver todo el catálogo
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 ease-[var(--ease-standard)] group-hover:translate-x-px"
              aria-hidden
            />
          </Link>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((listing, idx) => (
            <CatalogCard
              key={listing.id}
              listing={listing}
              featured
              priority={idx === 0}
              view="grid3"
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
