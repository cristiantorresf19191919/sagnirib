import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { findBySlug } from "@/server/biringas";
import { Button } from "@/shared/design-system/components/Button";
import { Container } from "@/shared/design-system/components/Container";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";

interface ProfilePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await findBySlug(slug);
  if (!listing) {
    return buildPageMetadata({
      title: "Perfil no encontrado",
      description: "El perfil solicitado no existe o fue retirado.",
      path: `/p/${slug}`,
      indexable: false,
    });
  }
  return buildPageMetadata({
    title: `${listing.name} en Biringas`,
    description: listing.bio,
    path: `/p/${slug}`,
    // Per p-slug.md: per-profile gate. Until the verification flow lands
    // every profile renders noindex regardless of the listing flag.
    indexable: false,
  });
}

export default async function ProfilePlaceholder({ params }: ProfilePageProps) {
  const { slug } = await params;
  const listing = await findBySlug(slug);
  if (!listing) notFound();

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <Container
          width="narrow"
          className="flex flex-col items-start gap-6 py-24 sm:py-32"
        >
          <Link
            href="/"
            className="text-xs uppercase tracking-[0.28em] text-[var(--color-text-subtle)] hover:text-[var(--color-foreground)]"
          >
            ← Inicio
          </Link>
          <span className="text-xs uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
            Perfil
          </span>
          <h1 className="text-4xl font-semibold leading-tight text-[var(--color-foreground)] sm:text-5xl">
            {listing.name} · {listing.city}
          </h1>
          <p className="text-base leading-relaxed text-[var(--color-text-muted)]">
            La página completa del perfil — galería, servicios, tarifas y CTA
            de contratación — entra en la próxima versión. Mientras tanto,
            aquí queda confirmado que el slug existe en el catálogo.
          </p>
          <Button href="/" variant="primary" size="lg">
            Ver más destacadas
          </Button>
        </Container>
      </main>
      <Footer />
    </>
  );
}
