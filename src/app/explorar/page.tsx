import type { Metadata } from "next";

import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { RecentlyViewedStrip } from "@/features/biringas/components/RecentlyViewedStrip";
import { CatalogGrid } from "@/features/catalog/components/CatalogGrid";
import { CategoryBar } from "@/features/catalog/components/CategoryBar";
import { CityChips } from "@/features/catalog/components/CityChips";
import { FiltersPanel } from "@/features/catalog/components/FiltersPanel";
import { QuickPresets } from "@/features/catalog/components/QuickPresets";
import { SearchBar } from "@/features/catalog/components/SearchBar";
import {
  parseFilters,
  parseView,
  type RawSearchParams,
} from "@/features/catalog/lib/parse-filters";
import { Container } from "@/shared/design-system/components/Container";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";

interface ExplorarPageProps {
  searchParams: Promise<RawSearchParams>;
}

/**
 * `/explorar` is the catalog surface: filters + grid + pagination.
 * Home (`/`) carries the editorial hero and only links here — keeping the
 * two surfaces separate matches the SEO contract pair (`home.md` →
 * marketing, `explorar.md` → catalog discovery).
 */
export const metadata: Metadata = buildPageMetadata({
  title: "Explorar Biringas — Catálogo de acompañantes",
  description:
    "Catálogo de Biringas verificadas en Colombia. Filtra por ciudad, categoría (prepagos · masajes · videollamadas), precio, edad y disponibilidad.",
  path: "/explorar",
});

export default async function ExplorarPage({
  searchParams,
}: Readonly<ExplorarPageProps>) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const view = parseView(params);

  return (
    <>
      <Header hideCatalogCta />
      <main className="flex flex-col bg-[var(--color-background)]">
        <Container width="wide" className="flex flex-col gap-3 pt-10 sm:pt-12">
          <span className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-primary)]">
            <span
              aria-hidden
              className="inline-block h-px w-8 bg-gradient-to-r from-[var(--color-gold)] to-transparent"
            />
            Catálogo
          </span>
          <h1 className="text-3xl font-bold leading-[1.05] tracking-tight text-[var(--color-foreground)] sm:text-4xl">
            Explorar Biringas
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
            Filtra por ciudad, categoría, precio y disponibilidad. Sólo
            perfiles verificados — sin bots, sin catfish.
          </p>
        </Container>
        <CategoryBar filters={filters} view={view} />
        <SearchBar filters={filters} view={view} />
        <CityChips filters={filters} view={view} />
        <QuickPresets filters={filters} view={view} />
        <FiltersPanel filters={filters} view={view} />
        <CatalogGrid filters={filters} view={view} />
        <RecentlyViewedStrip />
      </main>
      <Footer />
    </>
  );
}
