import type { Metadata } from "next";

import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { RecentlyViewedStrip } from "@/features/biringas/components/RecentlyViewedStrip";
import { CatalogGrid } from "@/features/catalog/components/CatalogGrid";
import { CategoryBar } from "@/features/catalog/components/CategoryBar";
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
        <Container width="wide" className="flex flex-col gap-4 pt-10 sm:pt-14">
          <span className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-brand-primary)]">
            <span
              aria-hidden
              className="inline-block h-px w-10 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-[var(--color-brand-primary)]/40"
            />
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--color-gold)] shadow-[0_0_0_3px_rgba(200,166,118,0.18)]"
            />
            Catálogo
          </span>
          <h1 className="font-[var(--font-display)] text-[clamp(34px,5vw,56px)] font-[360] leading-[1.02] tracking-[-0.03em] text-[var(--color-foreground)]">
            Explorar{" "}
            <span className="italic font-[340] text-[var(--color-brand-primary)]">
              Biringas
            </span>
          </h1>
          <p className="max-w-2xl font-[var(--font-serif)] text-[15px] leading-[1.55] text-[var(--color-text-muted)] sm:text-base">
            Filtra por ciudad, categoría y disponibilidad. Sólo perfiles
            verificados — <em>sin bots, sin catfish.</em>
          </p>
        </Container>
        <CategoryBar filters={filters} view={view} />
        <SearchBar filters={filters} view={view} />
        <QuickPresets filters={filters} view={view} />
        <CatalogGrid filters={filters} view={view} />
        <RecentlyViewedStrip />
      </main>
      <Footer />
    </>
  );
}
