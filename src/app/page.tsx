import type { Metadata } from "next";

import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { CatalogGrid } from "@/features/catalog/components/CatalogGrid";
import { CategoryBar } from "@/features/catalog/components/CategoryBar";
import { CityChips } from "@/features/catalog/components/CityChips";
import { FiltersPanel } from "@/features/catalog/components/FiltersPanel";
import { HeroBand } from "@/features/catalog/components/HeroBand";
import { SearchBar } from "@/features/catalog/components/SearchBar";
import {
  parseFilters,
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

  return (
    <>
      <Header hideCatalogCta />
      <main className="flex flex-col">
        <HeroBand
          location={filters.city ? `${filters.city} · Colombia` : "Toda Colombia"}
        />
        <CategoryBar filters={filters} />
        <SearchBar filters={filters} />
        <CityChips filters={filters} />
        <FiltersPanel filters={filters} />
        <CatalogGrid filters={filters} />
        <HowItWorks />
      </main>
      <Footer />
    </>
  );
}
