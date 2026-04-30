import { ChevronDown, MapPin } from "lucide-react";

import { SUPPORTED_CITIES, type ListingsFilters } from "@/server/biringas";
import { Container } from "@/shared/design-system/components/Container";
import { Disclosure } from "@/shared/motion/Disclosure";
import { Chip } from "@/shared/ui/Chip";

import { type CatalogView, withFilter } from "../lib/parse-filters";

interface CityChipsProps {
  filters: ListingsFilters;
  view?: CatalogView;
}

export function CityChips({ filters, view }: CityChipsProps) {
  const active = filters.city;
  const activeLabel = active ?? "Toda Colombia";

  return (
    <section
      aria-label="Listado de ciudades"
      className="bg-[var(--color-background)]"
    >
      <Container width="wide" className="py-2.5 sm:py-3">
        <Disclosure
          ariaLabel="Listado de ciudades"
          triggerClassName="group inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          summary={
            <>
              <MapPin
                className="h-3.5 w-3.5 text-[var(--color-brand-primary)]"
                aria-hidden
              />
              <span>Ciudad:</span>
              <span className="font-bold normal-case tracking-tight text-[var(--color-foreground)]">
                {activeLabel}
              </span>
              <ChevronDown
                className="h-4 w-4 text-[var(--color-text-subtle)] transition-transform duration-300 ease-[var(--ease-standard)] group-aria-expanded:rotate-180"
                aria-hidden
              />
            </>
          }
        >
          <div className="mt-3 flex flex-wrap items-center gap-1.5 pl-1">
            <Chip
              href={withFilter(filters, "city", undefined, view)}
              active={active === undefined}
              size="sm"
              variant="solid"
            >
              Toda Colombia
            </Chip>
            {SUPPORTED_CITIES.map((city) => (
              <Chip
                key={city}
                href={withFilter(filters, "city", city, view)}
                active={active === city}
                size="sm"
                variant="solid"
              >
                {city}
              </Chip>
            ))}
          </div>
        </Disclosure>
      </Container>
    </section>
  );
}
