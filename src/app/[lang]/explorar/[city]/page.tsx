import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { listCities } from "@/server/biringas";
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

interface CityPageProps {
  params: Promise<{ city: string }>;
  searchParams: Promise<RawSearchParams>;
}

/**
 * Per-city copy. Distinct hooks, distinct microcopy — programmatic SEO
 * pages are ranked DOWN by Google when they're templated word-for-word.
 * Each block lives here so the city is unique to crawlers (and to
 * humans).
 */
const CITY_COPY: Record<
  string,
  {
    hook: string;
    body: string;
    faq: ReadonlyArray<{ q: string; a: string }>;
  }
> = {
  Bogotá: {
    hook: "Acompañantes verificadas en Bogotá.",
    body: "Las mejores agendas de Chapinero, Zona Rosa y la T. Reservas para cenas en Andrés Carne, fines de semana en Usaquén y eventos corporativos en el centro internacional.",
    faq: [
      {
        q: "¿Atienden en hoteles del centro internacional?",
        a: "Sí. La mayoría de perfiles destacados en Bogotá ofrecen plan a domicilio en zona G, T, Chicó y centro internacional.",
      },
      {
        q: "¿Hay perfiles disponibles para eventos corporativos?",
        a: "Filtra por 'Cena' o 'Eventos' en la categoría — la mayoría de perfiles de Bogotá indican experiencia en eventos sociales y de negocios.",
      },
    ],
  },
  Medellín: {
    hook: "Encuentros con biringas verificadas en Medellín.",
    body: "El Poblado, Laureles, Provenza — las zonas donde la ciudad vive de noche y donde la oferta verificada es más fuerte. Eventos en Llanogrande, salidas en Parque Lleras.",
    faq: [
      {
        q: "¿Tienen perfiles disponibles fuera del Poblado?",
        a: "Sí. Laureles, Estadio y Envigado también concentran agendas verificadas. Filtra por barrio en el buscador.",
      },
      {
        q: "¿Atienden visitantes extranjeros?",
        a: "Filtra por 'Idiomas' — varios perfiles de Medellín hablan inglés y portugués. El equipo de verificación confirma el dominio antes de publicar.",
      },
    ],
  },
  Cali: {
    hook: "Biringas verificadas en Cali.",
    body: "Granada, San Antonio, el Peñón — la rumba caleña con compañía verificada. Salidas largas para feria, eventos de fin de año y planes a casa de campo en Pance.",
    faq: [
      {
        q: "¿Hay disponibilidad durante feria?",
        a: "Las agendas durante la feria de Cali se llenan rápido. Reserva con dos semanas de anticipación si quieres elegir perfil.",
      },
    ],
  },
  Barranquilla: {
    hook: "Acompañantes verificadas en Barranquilla.",
    body: "Alto Prado, Riomar, el norte. Eventos de carnaval y la temporada alta de mayo a julio concentran la mayor oferta.",
    faq: [
      {
        q: "¿Atienden viajes a Santa Marta o Cartagena?",
        a: "Varios perfiles destacados aceptan planes de fin de semana en la costa. Indícalo en el mensaje al reservar.",
      },
    ],
  },
  Cartagena: {
    hook: "Compañía verificada para Cartagena.",
    body: "Centro histórico, Bocagrande, Castillogrande, Manga. La ciudad turística por excelencia — fines de semana, viajes de negocios y planes en casas privadas en las islas.",
    faq: [
      {
        q: "¿Pueden acompañar a un viaje en isla?",
        a: "Sí. Filtra por 'Plan multi-día' o indícalo directamente en la solicitud de reserva. La mayoría de perfiles cartageneros aceptan planes en las islas con anticipación.",
      },
    ],
  },
};

export async function generateStaticParams() {
  const cities = await listCities();
  return cities.map((city) => ({ city: encodeURIComponent(city) }));
}

export async function generateMetadata({
  params,
}: Readonly<CityPageProps>): Promise<Metadata> {
  const { city: rawCity } = await params;
  const city = decodeURIComponent(rawCity);
  const cities = await listCities();
  if (!cities.includes(city)) {
    return buildPageMetadata({
      title: "Ciudad no encontrada — Biringas",
      description: "La ciudad solicitada no está disponible.",
      path: `/explorar/${rawCity}`,
      indexable: false,
    });
  }
  return buildPageMetadata({
    title: `Biringas en ${city} — Acompañantes verificadas`,
    description: `Catálogo de Biringas verificadas en ${city}. Filtra por categoría, precio, edad y disponibilidad. Sin bots, sin catfish.`,
    path: `/explorar/${rawCity}`,
  });
}

/**
 * `/explorar/[city]` — programmatic SEO landing page per supported city.
 *
 * Reuses the catalog stack (`SearchBar` / `CategoryBar` / `QuickPresets`
 * / `CatalogGrid`) with the city pre-applied to the filters. The
 * city-specific hero + FAQ block at the bottom is what makes each page
 * non-duplicate for crawlers (and useful for buyers landing from a
 * city-name Google search).
 */
export default async function CityPage({
  params,
  searchParams,
}: Readonly<CityPageProps>) {
  const { city: rawCity } = await params;
  const city = decodeURIComponent(rawCity);
  const cities = await listCities();
  if (!cities.includes(city)) notFound();

  const sp = await searchParams;
  // Force city filter regardless of URL — this is a city landing page.
  const filters = parseFilters({ ...sp, city });
  const view = parseView(sp);
  const copy = CITY_COPY[city];

  return (
    <>
      <Header hideCatalogCta />
      <main className="relative flex flex-col overflow-hidden bg-[var(--color-background)]">
        <Container
          width="wide"
          className="relative flex flex-col gap-3 pt-8 sm:gap-4 sm:pt-12 lg:pt-14"
        >
          <span className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-brand-primary)]">
            <span
              aria-hidden
              className="inline-block h-px w-10 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-[var(--color-brand-primary)]/40"
            />
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--color-gold)] shadow-[0_0_0_3px_rgba(200,166,118,0.18)]"
            />
            {city}
          </span>
          <h1 className="font-[var(--font-display)] text-[clamp(32px,4.8vw,52px)] font-[360] leading-[1.02] tracking-[-0.03em] text-[var(--color-foreground)]">
            {copy?.hook ?? `Biringas en ${city}.`}
          </h1>
          {copy?.body && (
            <p className="max-w-2xl font-[var(--font-serif)] text-[15px] leading-[1.55] text-[var(--color-text-muted)] sm:text-base">
              {copy.body}
            </p>
          )}
        </Container>

        <CategoryBar filters={filters} view={view} />
        <SearchBar filters={filters} view={view} />
        <QuickPresets filters={filters} view={view} />
        <CatalogGrid filters={filters} view={view} />

        {copy?.faq && copy.faq.length > 0 && (
          <section className="border-t border-[var(--color-border)]/60 bg-[var(--color-background-elevated)] py-16">
            <Container width="wide">
              <h2 className="mx-auto max-w-2xl text-center font-[var(--font-display)] text-[clamp(22px,2.6vw,32px)] font-[370] leading-[1.05] tracking-[-0.022em] text-[var(--color-foreground)]">
                Preguntas sobre Biringas en {city}.
              </h2>
              <dl className="mx-auto mt-8 flex max-w-3xl flex-col gap-3">
                {copy.faq.map((item) => (
                  <details
                    key={item.q}
                    className="group rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
                  >
                    <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--color-foreground)]">
                      {item.q}
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                      {item.a}
                    </p>
                  </details>
                ))}
              </dl>
            </Container>
          </section>
        )}

        <RecentlyViewedStrip />
      </main>
      <Footer />
    </>
  );
}
