import Link from "next/link";
import { ChevronDown, MapPin } from "lucide-react";

import { SUPPORTED_CITIES, type ListingsFilters } from "@/server/biringas";
import { Container } from "@/shared/design-system/components/Container";

import { withFilter } from "../lib/parse-filters";

interface CityChipsProps {
  filters: ListingsFilters;
}

export function CityChips({ filters }: CityChipsProps) {
  const active = filters.city;

  return (
    <section
      aria-label="Listado de ciudades"
      className="border-b border-[var(--color-border)]/40 bg-[var(--color-background)]"
    >
      <Container
        width="wide"
        className="flex items-start justify-between gap-4 py-3 sm:py-4"
      >
        <details className="group min-w-0 flex-1">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-[var(--color-foreground)] [&::-webkit-details-marker]:hidden">
            <MapPin className="h-3.5 w-3.5 text-[var(--color-brand-primary-strong)]" aria-hidden />
            Listado de ciudades
            <ChevronDown
              className="h-4 w-4 text-[var(--color-text-subtle)] transition-transform duration-200 group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <CityChip
              href={withFilter(filters, "city", undefined)}
              active={active === undefined}
            >
              Toda Colombia
            </CityChip>
            {SUPPORTED_CITIES.map((city) => (
              <CityChip
                key={city}
                href={withFilter(filters, "city", city)}
                active={active === city}
              >
                {city}
              </CityChip>
            ))}
          </div>
        </details>

        <span className="hidden shrink-0 text-xs text-[var(--color-text-subtle)] sm:inline">
          Localización por ciudad — más ciudades pronto.
        </span>
      </Container>
    </section>
  );
}

interface CityChipProps {
  href: string;
  active: boolean;
  children: React.ReactNode;
}

function CityChip({ href, active, children }: CityChipProps) {
  const base =
    "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]";
  const cn = active
    ? "bg-[var(--color-brand-primary)] text-[var(--color-background)] border-[var(--color-brand-primary)]"
    : "bg-[var(--color-surface)]/60 text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-foreground)] hover:border-[var(--color-brand-primary)]/50";
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`${base} ${cn}`}
    >
      {children}
    </Link>
  );
}
