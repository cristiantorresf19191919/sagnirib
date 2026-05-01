import Link from "next/link";

import { listAll, type ListingsFilters } from "@/server/biringas";
import { Button } from "@/shared/design-system/components/Button";
import { Container } from "@/shared/design-system/components/Container";
import { Sparkle } from "@/shared/design-system/components/Sparkle";
import { CardReveal } from "@/shared/motion/CardReveal";
import { FadeIn } from "@/shared/motion/FadeIn";

import { encodeFilters, type CatalogView } from "../lib/parse-filters";
import { CatalogCard } from "./CatalogCard";
import { ResultsToolbar } from "./ResultsToolbar";
import { DisponiblesAhoraTile, HistoriasTopTile } from "./SpecialTiles";
import { ViewSwitcher } from "./ViewSwitcher";

interface CatalogGridProps {
  filters: ListingsFilters;
  view?: CatalogView;
}

const FEATURED_THRESHOLD = 4.85;

const GRID_CLASS: Record<CatalogView, string> = {
  spotlight: "mt-8 grid grid-cols-1 gap-5 sm:gap-6",
  grid2: "mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2",
  grid3: "mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  list: "mt-8 grid grid-cols-1 gap-3",
};

function nowFilterHref(filters: ListingsFilters): string {
  const next: ListingsFilters = { ...filters, availableNow: true, page: undefined };
  const qs = encodeFilters(next).toString();
  return qs ? `/?${qs}` : "/?now=1";
}

export async function CatalogGrid({
  filters,
  view = "grid3",
}: CatalogGridProps) {
  const { data, meta } = await listAll(filters);
  // Total in the unfiltered catalog (excludes the city scope so the toolbar
  // can show "X de Y" when filters narrow the result).
  const { meta: cityMeta } = await listAll(
    filters.city ? { city: filters.city } : {},
  );
  const showSpecialTiles = view !== "list";

  return (
    <section
      data-testid="catalog-grid"
      aria-labelledby="catalog-title"
      className="relative pb-12 pt-4 sm:pb-16 sm:pt-6 lg:pb-20"
    >
      <Container width="wide">
        <ResultsToolbar
          filters={filters}
          view={view}
          resultCount={meta.total}
          totalCount={cityMeta.total}
        />
        <FadeIn>
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <div className="relative">
              <Sparkle
                tone="muted"
                size={18}
                className="absolute -left-6 -top-1 hidden sm:block"
              />
              <h2
                id="catalog-title"
                className="max-w-3xl text-2xl font-bold leading-tight tracking-tight text-[var(--color-foreground)] sm:text-3xl"
              >
                Biringas verificadas en {filters.city ?? "Colombia"}
              </h2>
            </div>
            <div className="self-start sm:self-end">
              <ViewSwitcher filters={filters} current={view} />
            </div>
          </header>
        </FadeIn>

        {data.length === 0 ? (
          <EmptyState />
        ) : (
          <ul
            data-testid="catalog-grid-list"
            aria-label="Biringas en el catálogo"
            className={GRID_CLASS[view]}
          >
            {showSpecialTiles && (
              <CardReveal
                index={0}
                data-testid="catalog-tile-stories-top"
              >
                <HistoriasTopTile href="/?reviews=1" />
              </CardReveal>
            )}
            {data.map((listing, index) => {
              // Account for the leading special tile so the staircase keeps
              // its row rhythm even when the catalog renders the tile.
              const cascadeIndex = index + (showSpecialTiles ? 1 : 0);
              return (
                <CardReveal
                  key={listing.id}
                  index={cascadeIndex}
                  data-testid={`catalog-card-${listing.slug}`}
                >
                  <CatalogCard
                    listing={listing}
                    priority={index === 0}
                    featured={listing.reputation.score >= FEATURED_THRESHOLD}
                    view={view}
                  />
                </CardReveal>
              );
            })}
            {showSpecialTiles && (
              <CardReveal
                index={data.length + 1}
                data-testid="catalog-tile-available-now"
              >
                <DisponiblesAhoraTile href={nowFilterHref(filters)} />
              </CardReveal>
            )}
          </ul>
        )}
      </Container>
    </section>
  );
}

const EMPTY_STATE_SHORTCUTS = [
  { label: "Disponibles ahora · Bogotá", href: "/?now=1&city=Bogot%C3%A1" },
  { label: "Verificadas · Medellín", href: "/?verified=1&city=Medell%C3%ADn" },
  { label: "Videollamada", href: "/?category=videollamadas" },
  { label: "Top calificadas", href: "/?sort=rating&reviews=1" },
] as const;

function EmptyState() {
  return (
    <div
      data-testid="catalog-grid-empty"
      className="mx-auto mt-12 flex max-w-xl flex-col items-center gap-4 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center shadow-[var(--shadow-sm)]"
    >
      <Sparkle tone="muted" size={32} />
      <span className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-text-subtle)]">
        Sin resultados
      </span>
      <h3 className="text-xl font-semibold text-[var(--color-foreground)]">
        Ningún perfil coincide con esta combinación
      </h3>
      <p className="max-w-sm text-sm leading-relaxed text-[var(--color-text-muted)]">
        Prueba a ampliar la ciudad, soltar la edad o quitar algún chip de
        servicio. También puedes empezar de cero.
      </p>
      <Button href="/" variant="primary" size="md" className="mt-2" glow>
        Borrar todos los filtros
      </Button>

      {/* Popular search shortcuts — turn the dead end into a discovery
          jump-off so users always have a next step. */}
      <div
        data-testid="catalog-grid-empty-shortcuts"
        className="mt-4 flex w-full flex-col gap-2 border-t border-[var(--color-border)]/70 pt-5"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
          O prueba una búsqueda popular
        </span>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {EMPTY_STATE_SHORTCUTS.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] transition-[border-color,color,background] duration-150 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary-soft)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
