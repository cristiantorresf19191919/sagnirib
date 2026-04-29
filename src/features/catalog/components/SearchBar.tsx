import { Search } from "lucide-react";

import { SUPPORTED_CITIES, type ListingsFilters } from "@/server/biringas";
import { Container } from "@/shared/design-system/components/Container";

interface SearchBarProps {
  filters: ListingsFilters;
}

/**
 * Catalog search bar — `<form method="GET">` against `/`. Submitting builds
 * the new URL with the current filters preserved as hidden inputs (only the
 * fields *this* form does not own).
 */
export function SearchBar({ filters }: SearchBarProps) {
  return (
    <section
      aria-label="Buscador del catálogo"
      className="border-b border-[var(--color-border)]/40 bg-[var(--color-background)]"
    >
      <Container width="wide" className="py-5 sm:py-6">
        <form
          action="/"
          method="get"
          className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3"
        >
          {/* Preserve filters this form does not own. */}
          <PreservedFilters filters={filters} omit={["q", "city"]} />

          <label className="relative flex-1">
            <span className="sr-only">¿Dónde estás?</span>
            <select
              name="city"
              defaultValue={filters.city ?? ""}
              className="h-12 w-full appearance-none rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-4 pr-10 text-sm text-[var(--color-foreground)] focus:border-[var(--color-brand-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]/50"
            >
              <option value="">¿Dónde estás? · Toda Colombia</option>
              {SUPPORTED_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <ChevronTrailing />
          </label>

          <label className="relative flex-[1.5]">
            <span className="sr-only">¿Qué buscas?</span>
            <input
              name="q"
              defaultValue={filters.search ?? ""}
              type="search"
              inputMode="search"
              placeholder="¿Qué buscas? — nombre, ciudad, plan…"
              className="h-12 w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-4 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]/50"
            />
          </label>

          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-[var(--color-brand-primary)] px-6 text-sm font-semibold text-[var(--color-background)] shadow-[0_0_0_1px_rgba(255,93,203,0.45),0_10px_28px_-12px_rgba(255,43,181,0.7)] transition-colors hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          >
            <Search className="h-4 w-4" aria-hidden />
            Buscar
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
      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)]"
    >
      ▾
    </span>
  );
}

interface PreservedFiltersProps {
  filters: ListingsFilters;
  omit: ReadonlyArray<string>;
}

/**
 * Renders hidden inputs for any active filter keys the parent form does not
 * own. Without this, submitting any form on the catalog would drop the rest
 * of the active filters.
 */
function PreservedFilters({ filters, omit }: PreservedFiltersProps) {
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

  return <>{inputs}</>;
}

export { PreservedFilters };
