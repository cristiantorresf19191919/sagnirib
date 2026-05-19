import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { EditorialHero } from "@/features/catalog/components/EditorialHero";
import { FeaturedStrip } from "@/features/home/components/FeaturedStrip";
import { HowItWorks } from "@/features/home/components/HowItWorks";
import { Container } from "@/shared/design-system/components/Container";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";

/**
 * Home `/` is the marketing surface — editorial hero, featured profiles,
 * "cómo funciona". The catalog itself lives at `/explorar` (split restored
 * 2026-05-12 to match the SEO contract pair). The hero's search form and
 * suggested chips are entry points to the catalog.
 */
export const metadata: Metadata = buildPageMetadata({
  title: "Biringas — Consigue lo que quieres en el momento que quieres",
  description:
    "Marketplace de Biringas verificadas en Colombia. Reserva compañía para eventos, viajes y salidas — perfiles auténticos, sin bots ni catfish.",
  path: "/",
});

export default async function HomePage() {
  return (
    <>
      {/* On / the hero search IS the explore CTA — hide the duplicate
          green Explorar pill from the header so the funnel is singular. */}
      <Header hideCatalogCta />
      <main className="flex flex-col">
        <EditorialHero location="Acompañantes verificadas · Colombia" />
        <FeaturedStrip />
        <Container width="wide" className="flex justify-center py-10 sm:py-12">
          <Link
            href="/explorar"
            className="group inline-flex h-12 items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-7 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,box-shadow] duration-200 ease-[var(--ease-standard)] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          >
            Explorar todo el catálogo
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 ease-[var(--ease-standard)] group-hover:translate-x-px"
              aria-hidden
            />
          </Link>
        </Container>
        <HowItWorks />
      </main>
      <Footer />
    </>
  );
}
