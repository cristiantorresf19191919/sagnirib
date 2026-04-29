import type { Metadata } from "next";

import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { FeaturedBiringas } from "@/features/biringas/components/FeaturedBiringas";
import { Hero } from "@/features/home/components/Hero";
import { HowItWorks } from "@/features/home/components/HowItWorks";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";

/**
 * Home — `/`. Metadata values come from the approved Route Contract at
 * `docs/seo/routes/home.md`. Indexability still inherits the global
 * switch (`seoConfig.indexingEnabled`), which stays off until release-
 * hardening.
 */
export const metadata: Metadata = buildPageMetadata({
  title: "Biringas — Consigue lo que quieres en el momento que quieres",
  description:
    "Marketplace de Biringas para reservar compañía verificada para eventos, viajes y salidas. Explora perfiles y contrata directo.",
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex flex-col">
        <Hero />
        <HowItWorks />
        <FeaturedBiringas />
      </main>
      <Footer />
    </>
  );
}
