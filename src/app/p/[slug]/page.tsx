import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  Film,
  Mic,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { findBySlug } from "@/server/biringas";
import { CardStackGallery } from "@/features/biringas/components/CardStackGallery";
import { formatPricePerHour } from "@/features/biringas/format";
import { Button } from "@/shared/design-system/components/Button";
import { Container } from "@/shared/design-system/components/Container";
import { VerifiedBadge } from "@/shared/design-system/components/VerifiedBadge";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";
import { Tag } from "@/shared/ui/Tag";

interface ProfilePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: Readonly<ProfilePageProps>): Promise<Metadata> {
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

const NUMBER_FORMAT = new Intl.NumberFormat("es-CO");

function formatViews(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return NUMBER_FORMAT.format(value);
}

export default async function ProfilePage({ params }: Readonly<ProfilePageProps>) {
  const { slug } = await params;
  const listing = await findBySlug(slug);
  if (!listing) notFound();

  const galleryImages =
    listing.gallery.length > 0 ? listing.gallery : [listing.mainImage];
  const ratingLabel = listing.reputation.score.toFixed(1);
  const attributeEntries: Array<[label: string, value: string]> = [
    ["Etnia", listing.attributes.ethnicity ?? "—"],
    ["Cabello", listing.attributes.hair ?? "—"],
    ["Estatura", listing.attributes.height ?? "—"],
    ["Cuerpo", listing.attributes.body ?? "—"],
    ["Senos", listing.attributes.breast ?? "—"],
    ["País", listing.attributes.country ?? "—"],
  ];
  const languages = listing.attributes.languages ?? [];

  return (
    <>
      <Header />
      <main className="relative isolate flex flex-1 flex-col">
        {/* Ambient gradient backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] bg-[radial-gradient(circle_at_20%_0%,rgba(122,43,255,0.18),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(255,43,181,0.16),transparent_60%)]"
        />

        <Container width="wide" className="pt-8 sm:pt-10">
          <Link
            href="/explorar"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.28em] text-[var(--color-text-subtle)] transition-colors hover:text-[var(--color-foreground)]"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden />
            Volver al catálogo
          </Link>
        </Container>

        <Container
          width="wide"
          className="grid grid-cols-1 gap-12 py-10 sm:py-12 lg:grid-cols-12 lg:gap-14 lg:py-16"
        >
          {/* Gallery — naipe stack */}
          <section
            aria-label={`Galería de ${listing.name}`}
            className="lg:col-span-6 xl:col-span-7"
          >
            <CardStackGallery
              images={galleryImages}
              altBase={`${listing.name} en ${listing.city}`}
            />

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-[var(--color-text-muted)]">
              {listing.hasVideo && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-3 py-1.5">
                  <Film
                    className="h-3.5 w-3.5 text-[var(--color-brand-accent-strong)]"
                    aria-hidden
                  />
                  Vídeo disponible
                </span>
              )}
              {listing.hasAudio && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-3 py-1.5">
                  <Mic
                    className="h-3.5 w-3.5 text-[var(--color-brand-secondary-strong)]"
                    aria-hidden
                  />
                  Audio disponible
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-3 py-1.5">
                <Sparkles
                  className="h-3.5 w-3.5 text-[var(--color-brand-primary-strong)]"
                  aria-hidden
                />
                {listing.reputation.storiesRecorded} historias
              </span>
            </div>
          </section>

          {/* Profile dossier */}
          <aside className="lg:col-span-6 xl:col-span-5">
            <div className="lg:sticky lg:top-24 flex flex-col gap-7">
              <div>
                <span className="text-xs uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
                  Perfil
                </span>
                <h1 className="mt-3 text-4xl font-bold leading-[1.05] tracking-tight text-[var(--color-foreground)] sm:text-5xl">
                  {listing.name}
                  <span className="ml-3 align-middle text-2xl font-normal text-[var(--color-text-muted)] sm:text-3xl">
                    {listing.age}
                  </span>
                </h1>
                <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
                  <MapPin className="h-4 w-4" aria-hidden />
                  {listing.city}
                  {listing.neighborhood ? ` · ${listing.neighborhood}` : ""}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {listing.verified && <VerifiedBadge />}
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-brand-warn)]/40 bg-[var(--color-brand-warn)]/10 px-3 py-1 text-xs font-medium text-[var(--color-brand-warn)]">
                    <Star
                      className="h-3 w-3 fill-[var(--color-brand-warn)] text-[var(--color-brand-warn)]"
                      aria-hidden
                    />
                    {ratingLabel}
                  </span>
                  {listing.tags.map((t) => (
                    <Tag key={t} tone="primary">
                      {t}
                    </Tag>
                  ))}
                </div>
              </div>

              <p className="text-base leading-relaxed text-[var(--color-text-muted)]">
                {listing.bio}
              </p>

              {/* Stats grid */}
              <dl className="grid grid-cols-3 gap-3">
                <StatTile
                  label="Vistas"
                  value={formatViews(listing.reputation.totalViews)}
                  icon={<Eye className="h-3.5 w-3.5" aria-hidden />}
                />
                <StatTile
                  label="Días activa"
                  value={NUMBER_FORMAT.format(
                    listing.reputation.daysAdvertised,
                  )}
                />
                <StatTile
                  label="Verificada"
                  value={`hace ${listing.reputation.daysSinceVerification}d`}
                  icon={
                    <ShieldCheck
                      className="h-3.5 w-3.5 text-[var(--color-brand-accent-strong)]"
                      aria-hidden
                    />
                  }
                />
              </dl>

              {/* Price + CTA card */}
              <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-5 backdrop-blur-sm">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-[radial-gradient(closest-side,rgba(255,43,181,0.35),transparent_70%)] blur-2xl"
                />
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
                      Tarifa
                    </span>
                    <p className="mt-1 text-2xl font-bold text-[var(--color-foreground)]">
                      {formatPricePerHour(listing.pricePerHour)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Button
                    href="#contacto"
                    variant="primary"
                    size="lg"
                    glow
                    className="w-full sm:flex-1"
                  >
                    Contactar
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                  <Button
                    href="/explorar"
                    variant="secondary"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    Ver más
                  </Button>
                </div>
                <p className="mt-3 text-xs text-[var(--color-text-subtle)]">
                  El contacto directo se libera tras verificar tu cuenta. La
                  pasarela de contratación llega en la próxima versión.
                </p>
              </div>

              {/* Attributes */}
              <Section title="Características">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {attributeEntries.map(([label, value]) => (
                    <div key={label} className="flex flex-col">
                      <dt className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                        {label}
                      </dt>
                      <dd className="text-[var(--color-foreground)]">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
                {languages.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                      Idiomas
                    </span>
                    {languages.map((lang) => (
                      <Tag key={lang} tone="accent">
                        {lang}
                      </Tag>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Servicios">
                <div className="flex flex-wrap gap-2">
                  {listing.services.map((s) => (
                    <Tag key={s} tone="secondary">
                      {s}
                    </Tag>
                  ))}
                </div>
              </Section>

              <Section title="Lugares de encuentro">
                <div className="flex flex-wrap gap-2">
                  {listing.meetingContexts.map((m) => (
                    <Tag key={m} tone="neutral">
                      {m}
                    </Tag>
                  ))}
                </div>
              </Section>
            </div>
          </aside>
        </Container>
      </main>
      <Footer />
    </>
  );
}

interface StatTileProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

function StatTile({ label, value, icon }: Readonly<StatTileProps>) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)]/70 bg-[var(--color-background-elevated)] px-3 py-3">
      <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-base font-semibold text-[var(--color-foreground)]">
        {value}
      </dd>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: Readonly<SectionProps>) {
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
