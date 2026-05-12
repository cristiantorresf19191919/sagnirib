import { listAll, type ListingsFilters } from "@/server/biringas";
import { Button } from "@/shared/design-system/components/Button";
import { Container } from "@/shared/design-system/components/Container";
import { Sparkle } from "@/shared/design-system/components/Sparkle";
import { FadeIn } from "@/shared/motion/FadeIn";
import { Reveal, RevealItem } from "@/shared/motion/Reveal";

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
  return qs ? `/explorar?${qs}` : "/explorar?now=1";
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
          <Reveal
            as="ul"
            aria-label="Biringas en el catálogo"
            className={GRID_CLASS[view]}
            whenInView={false}
          >
            {showSpecialTiles && (
              <RevealItem as="li">
                <HistoriasTopTile href="/explorar?reviews=1" />
              </RevealItem>
            )}
            {data.map((listing, index) => (
              <RevealItem key={listing.id} as="li">
                <CatalogCard
                  listing={listing}
                  priority={index === 0}
                  featured={listing.reputation.score >= FEATURED_THRESHOLD}
                  view={view}
                />
              </RevealItem>
            ))}
            {showSpecialTiles && (
              <RevealItem as="li">
                <DisponiblesAhoraTile href={nowFilterHref(filters)} />
              </RevealItem>
            )}
          </Reveal>
        )}
      </Container>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto mt-12 flex max-w-xl flex-col items-center gap-4 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center shadow-[var(--shadow-sm)]">
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
      <Button href="/explorar" variant="primary" size="md" className="mt-2" glow>
        Borrar todos los filtros
      </Button>
    </div>
  );
}
