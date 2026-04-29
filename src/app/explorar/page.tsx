import type { Metadata } from "next";
import Link from "next/link";

import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { Button } from "@/shared/design-system/components/Button";
import { Container } from "@/shared/design-system/components/Container";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";

/**
 * Stub for `/explorar`. The approved SEO Route Contract describes the final
 * shape (filters + grid + paginación SSR), but the implementation lands in
 * a later PR. Until then we serve a noindex placeholder so the home CTA
 * does not 404.
 */
export const metadata: Metadata = buildPageMetadata({
  title: "Explorar Biringas — Catálogo de acompañantes",
  description:
    "Encuentra y contrata acompañantes verificados para eventos, viajes y salidas.",
  path: "/explorar",
  indexable: false,
});

export default function ExplorarPlaceholder() {
  return (
    <>
      <Header hideCatalogCta />
      <main className="flex flex-1 flex-col">
        <Container
          width="narrow"
          className="flex flex-col items-start gap-6 py-24 sm:py-32"
        >
          <span className="text-xs uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
            Catálogo
          </span>
          <h1 className="text-4xl font-semibold leading-tight text-[var(--color-foreground)] sm:text-5xl">
            Explorar Biringas
          </h1>
          <p className="text-base leading-relaxed text-[var(--color-text-muted)]">
            Estamos terminando los filtros y la grilla del catálogo. En la
            próxima entrega vas a poder filtrar por ciudad, tipo de evento y
            disponibilidad. Por ahora puedes volver a la portada para ver
            algunas acompañantes destacadas.
          </p>
          <Button href="/" variant="primary" size="lg">
            Ver destacadas
          </Button>
          <Link
            href="/"
            className="text-sm text-[var(--color-text-muted)] underline-offset-4 hover:text-[var(--color-foreground)] hover:underline"
          >
            ← Volver a la portada
          </Link>
        </Container>
      </main>
      <Footer />
    </>
  );
}
