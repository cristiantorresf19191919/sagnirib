import type { Metadata } from "next";

import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { RecentlyViewedStrip } from "@/features/biringas/components/RecentlyViewedStrip";
import { CatalogGrid } from "@/features/catalog/components/CatalogGrid";
import { CategoryBar } from "@/features/catalog/components/CategoryBar";
import { CityChips } from "@/features/catalog/components/CityChips";
import { EditorialHero } from "@/features/catalog/components/EditorialHero";
import { FiltersPanel } from "@/features/catalog/components/FiltersPanel";
import { QuickPresets } from "@/features/catalog/components/QuickPresets";
import { SearchBar } from "@/features/catalog/components/SearchBar";
import {
  parseFilters,
  parseView,
  type RawSearchParams,
} from "@/features/catalog/lib/parse-filters";
import { HowItWorks } from "@/features/home/components/HowItWorks";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";

interface HomePageProps {
  searchParams: Promise<RawSearchParams>;
}

/**
 * Home `/` is the catalog itself (per founder direction 2026-04-29).
 * Header / Footer / CardStackGallery / HowItWorks were rebuilt in commit
 * 5f085bf and stay untouched. HowItWorks lives below the catalog so the
 * Header `#como-funciona` anchor still resolves on home.
 */
export const metadata: Metadata = buildPageMetadata({
  title: "Biringas — Catálogo de acompañantes en Colombia",
  description:
    "Biringas verificadas en Colombia. Filtra por ciudad, categoría (prepagos · masajes · videollamadas), precio, edad y disponibilidad.",
  path: "/",
});

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const view = parseView(params);

  return (
    <>
      <Header hideCatalogCta />
      <main className="flex flex-col">
        <EditorialHero
          location={filters.city ? `${filters.city} · Colombia` : "Toda Colombia"}
        />
        <CategoryBar filters={filters} view={view} />
        <SearchBar filters={filters} view={view} />
        <CityChips filters={filters} view={view} />
        <QuickPresets filters={filters} view={view} />
        <FiltersPanel filters={filters} view={view} />
        <CatalogGrid filters={filters} view={view} />
        <RecentlyViewedStrip />
        <HowItWorks />
      </main>
      <Footer />
    </>
  );
}
