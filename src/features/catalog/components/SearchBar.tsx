import { Search, Sparkles } from "lucide-react";

import { SUPPORTED_CITIES, type ListingsFilters } from "@/server/biringas";
import { Container } from "@/shared/design-system/components/Container";

import { DEFAULT_CATALOG_VIEW, type CatalogView } from "../lib/parse-filters";

interface SearchBarProps {
  filters: ListingsFilters;
  view?: CatalogView;
}

/**
 * Catalog search bar — `<form method="GET">` against `/`. Submitting builds
 * the new URL with the current filters preserved as hidden inputs (only the
 * fields *this* form does not own).
 */
export function SearchBar({ filters, view }: SearchBarProps) {
  return (
    <section
      data-testid="search-bar"
      aria-label="Buscador del catálogo"
      className="bg-[var(--color-background)]"
    >
      <Container width="wide" className="py-4 sm:py-5">
        <form
          data-testid="search-bar-form"
          action="/explorar"
          method="get"
          className="flex flex-col gap-2 md:flex-row md:items-stretch md:gap-2"
        >
          {/* Preserve filters this form does not own. */}
          <PreservedFilters filters={filters} view={view} omit={["q", "city"]} />

          <label className="group relative md:w-[260px] md:shrink-0">
            <span className="sr-only">¿Dónde estás?</span>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full ring-0 ring-[var(--color-brand-primary)]/0 transition-[box-shadow] duration-300 ease-[var(--ease-standard)] group-focus-within:ring-4 group-focus-within:ring-[var(--color-brand-primary)]/15"
            />
            <select
              data-testid="search-bar-city"
              name="city"
              defaultValue={filters.city ?? ""}
              className="relative h-12 w-full appearance-none rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] pl-5 pr-10 text-sm text-[var(--color-foreground)] transition-colors duration-200 hover:border-[var(--color-brand-primary-soft)] focus:border-[var(--color-brand-primary)] focus:outline-none"
            >
              <option value="">Toda Colombia</option>
              {SUPPORTED_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <ChevronTrailing />
          </label>

          <label className="group relative flex-1">
            <span className="sr-only">¿Qué buscas?</span>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full ring-0 ring-[var(--color-brand-primary)]/0 transition-[box-shadow] duration-300 ease-[var(--ease-standard)] group-focus-within:ring-4 group-focus-within:ring-[var(--color-brand-primary)]/15"
            />
            <Search
              className="pointer-events-none absolute left-5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--color-text-subtle)] transition-colors duration-200 group-focus-within:text-[var(--color-brand-primary)]"
              aria-hidden
            />
            <input
              data-testid="search-bar-query"
              name="q"
              defaultValue={filters.search ?? ""}
              type="search"
              inputMode="search"
              placeholder="Buscar por nombre, plan o servicio…"
              className="relative h-12 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] pl-12 pr-5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] transition-colors duration-200 hover:border-[var(--color-brand-primary-soft)] focus:border-[var(--color-brand-primary)] focus:outline-none"
            />
          </label>

          <button
            data-testid="search-bar-submit"
            type="submit"
            className="btn-pulse group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full bg-[var(--color-brand-primary)] px-7 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] hover:-translate-y-0.5 hover:bg-[var(--color-brand-primary-strong)] hover:shadow-[var(--shadow-lg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-1/3 hidden w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent motion-safe:group-hover:motion-shimmer-sweep sm:block"
            />
            <span className="relative">Buscar</span>
            {/* Gold sparkle ornament — sits inside the button on the right
                edge, mirroring the reference's punctuation detail. */}
            <Sparkles
              aria-hidden
              className="relative h-3.5 w-3.5 text-[var(--color-gold)] opacity-90 transition-transform duration-300 ease-[var(--ease-standard)] group-hover:rotate-12"
            />
          </button>
        </form>
      </Container>
    </section>
  );
}

function ChevronTrailing() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)]"
    >
      ▾
    </span>
  );
}

interface PreservedFiltersProps {
  filters: ListingsFilters;
  omit: ReadonlyArray<string>;
  /** Optional catalog view to keep on the URL after submit. */
  view?: CatalogView;
}

/**
 * Renders hidden inputs for any active filter keys the parent form does not
 * own. Without this, submitting any form on the catalog would drop the rest
 * of the active filters.
 */
function PreservedFilters({ filters, omit, view }: PreservedFiltersProps) {
  const skip = new Set(omit);
  const inputs: React.ReactNode[] = [];

  const single: Array<[string, string | number | undefined]> = [
    ["category", filters.category],
    ["sex", filters.sex],
    ["city", filters.city],
    ["q", filters.search],
    ["priceMin", filters.priceMin],
    ["priceMax", filters.priceMax],
    ["ageMin", filters.ageMin],
    ["ageMax", filters.ageMax],
    ["sort", filters.sortBy],
  ];
  for (const [key, value] of single) {
    if (skip.has(key)) continue;
    if (value === undefined || value === "") continue;
    inputs.push(
      <input key={key} type="hidden" name={key} value={String(value)} />,
    );
  }

  const flag = (key: string, on: boolean | undefined) => {
    if (skip.has(key) || !on) return;
    inputs.push(<input key={key} type="hidden" name={key} value="1" />);
  };
  flag("verified", filters.verifiedOnly);
  flag("video", filters.withVideo);
  flag("audio", filters.withAudio);
  flag("reviews", filters.withReviews);
  flag("face", filters.faceVisible);
  flag("card", filters.paymentByCard);
  flag("now", filters.availableNow);

  const multi = (key: string, values: ReadonlyArray<string> | undefined) => {
    if (skip.has(key) || !values) return;
    values.forEach((v, i) =>
      inputs.push(
        <input key={`${key}-${i}`} type="hidden" name={key} value={v} />,
      ),
    );
  };
  multi("attention", filters.attention);
  multi("contact", filters.contactChannels);
  multi("service", filters.services);
  multi("special", filters.specialServices);
  multi("place", filters.meetingContexts);

  if (filters.attributes) {
    for (const [key, values] of Object.entries(filters.attributes)) {
      if (skip.has(`attr_${key}`)) continue;
      values.forEach((v, i) =>
        inputs.push(
          <input
            key={`attr-${key}-${i}`}
            type="hidden"
            name={`attr_${key}`}
            value={v}
          />,
        ),
      );
    }
  }

  if (view && view !== DEFAULT_CATALOG_VIEW && !skip.has("view")) {
    inputs.push(<input key="view" type="hidden" name="view" value={view} />);
  }

  return <>{inputs}</>;
}

export { PreservedFilters };
