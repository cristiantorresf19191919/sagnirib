import Link from "next/link";

import { listAll, type ListingsFilters } from "@/server/biringas";
import { Container } from "@/shared/design-system/components/Container";
import { Reveal, RevealItem } from "@/shared/motion/Reveal";

import { encodeFilters } from "../lib/parse-filters";
import { CatalogCard } from "./CatalogCard";
import { DisponiblesAhoraTile, HistoriasTopTile } from "./SpecialTiles";

interface CatalogGridProps {
  filters: ListingsFilters;
}

const FEATURED_THRESHOLD = 4.85;

function nowFilterHref(filters: ListingsFilters): string {
  const next: ListingsFilters = { ...filters, availableNow: true, page: undefined };
  const qs = encodeFilters(next).toString();
  return qs ? `/?${qs}` : "/?now=1";
}

export async function CatalogGrid({ filters }: CatalogGridProps) {
  const { data, meta } = await listAll(filters);

  return (
    <section
      aria-labelledby="catalog-title"
      className="relative pb-12 pt-6 sm:pb-16 sm:pt-8 lg:pb-20"
    >
      <Container width="wide">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div>
            <h2
              id="catalog-title"
              className="max-w-3xl text-2xl font-bold leading-tight tracking-tight text-[var(--color-foreground)] sm:text-3xl"
            >
              Biringas verificadas en {filters.city ?? "Colombia"}
              <span className="ml-3 align-middle text-base font-medium text-[var(--color-text-subtle)] sm:text-lg">
                ({meta.total})
              </span>
            </h2>
            <p className="mt-1.5 text-xs uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
              Ordenadas por actividad reciente
            </p>
          </div>
        </header>

        {data.length === 0 ? (
          <EmptyState />
        ) : (
          <Reveal
            as="ul"
            aria-label="Biringas en el catálogo"
            className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            whenInView={false}
          >
            <RevealItem as="li">
              <HistoriasTopTile href="/?reviews=1" />
            </RevealItem>
            {data.map((listing, index) => (
              <RevealItem key={listing.id} as="li">
                <CatalogCard
                  listing={listing}
                  priority={index === 0}
                  featured={listing.reputation.score >= FEATURED_THRESHOLD}
                />
              </RevealItem>
            ))}
            <RevealItem as="li">
              <DisponiblesAhoraTile href={nowFilterHref(filters)} />
            </RevealItem>
          </Reveal>
        )}
      </Container>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 flex flex-col items-start gap-3 rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-background-elevated)]/40 p-8">
      <span className="text-xs uppercase tracking-[0.28em] text-[var(--color-text-subtle)]">
        Sin resultados
      </span>
      <p className="text-base text-[var(--color-foreground)]">
        Ningún perfil coincide con esta combinación de filtros.
      </p>
      <p className="text-sm text-[var(--color-text-muted)]">
        Prueba a ampliar la ciudad, soltar la edad o quitar algún chip de servicio.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex h-10 items-center rounded-[var(--radius-md)] bg-[var(--color-brand-primary)] px-4 text-sm font-semibold text-[var(--color-background)] hover:bg-[var(--color-brand-primary-strong)]"
      >
        Borrar filtros
      </Link>
    </div>
  );
}
