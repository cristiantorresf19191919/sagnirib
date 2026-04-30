import Link from "next/link";
import { Eraser, Sparkles } from "lucide-react";

import type { ListingsFilters } from "@/server/biringas";

import type { CatalogView } from "../lib/parse-filters";
import { ActiveFilterChips } from "./ActiveFilterChips";
import { SortMenu } from "./SortMenu";

interface ResultsToolbarProps {
  filters: ListingsFilters;
  view?: CatalogView;
  resultCount: number;
  /** Total before filters — drives the "X of Y" label. */
  totalCount?: number;
}

const FORMAT_NUMBER = new Intl.NumberFormat("es-CO");

function activeFilterCount(filters: ListingsFilters): number {
  let n = 0;
  if (filters.priceMin !== undefined) n += 1;
  if (filters.priceMax !== undefined) n += 1;
  if (filters.ageMin !== undefined) n += 1;
  if (filters.ageMax !== undefined) n += 1;
  if (filters.verifiedOnly) n += 1;
  if (filters.withVideo) n += 1;
  if (filters.withAudio) n += 1;
  if (filters.withReviews) n += 1;
  if (filters.faceVisible) n += 1;
  if (filters.paymentByCard) n += 1;
  if (filters.availableNow) n += 1;
  n += filters.attention?.length ?? 0;
  n += filters.contactChannels?.length ?? 0;
  n += filters.services?.length ?? 0;
  n += filters.specialServices?.length ?? 0;
  n += filters.meetingContexts?.length ?? 0;
  if (filters.attributes) {
    for (const v of Object.values(filters.attributes)) n += v.length;
  }
  return n;
}

/**
 * Sticky toolbar that sits between the filters and the catalog grid. Shows
 * the live result count, the active sort, a clear-all link, and renders
 * `ActiveFilterChips` directly inline so users can see and remove every
 * active filter without having to open the modal.
 *
 * Sticky on lg+ so it stays in reach during long scrolls. Server Component —
 * the only interactive child is the sort dropdown.
 */
export function ResultsToolbar({
  filters,
  view,
  resultCount,
  totalCount,
}: ResultsToolbarProps) {
  const activeCount = activeFilterCount(filters);
  const cityLabel = filters.city ?? "Toda Colombia";
  const totalLabel =
    totalCount !== undefined && totalCount !== resultCount
      ? ` de ${FORMAT_NUMBER.format(totalCount)}`
      : "";

  return (
    <div className="sticky top-16 z-20 -mx-4 mb-3 border-y border-[var(--color-border)]/60 bg-[var(--color-background)]/85 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--color-background)]/65 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2.5">
            <span
              aria-hidden
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary)]"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                {cityLabel}
              </span>
              <span className="text-sm font-semibold text-[var(--color-foreground)]">
                {FORMAT_NUMBER.format(resultCount)}
                {totalLabel} biringas
              </span>
            </span>
          </span>

          {activeCount > 0 && (
            <span
              aria-hidden
              className="hidden h-5 w-px bg-[var(--color-border)] sm:inline-block"
            />
          )}

          {activeCount > 0 && (
            <Link
              href="/"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[12px] font-semibold text-[var(--color-text-muted)] transition-[border-color,color,background] duration-150 hover:border-[var(--color-brand-highlight)]/45 hover:bg-[var(--color-brand-highlight)]/8 hover:text-[var(--color-brand-highlight)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-highlight)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
            >
              <Eraser className="h-3 w-3" aria-hidden />
              Limpiar {activeCount} {activeCount === 1 ? "filtro" : "filtros"}
            </Link>
          )}
        </div>

        <SortMenu filters={filters} view={view} />
      </div>

      {activeCount > 0 && (
        <div className="mt-2.5 flex items-start gap-2.5 border-t border-[var(--color-border)]/60 pt-2.5">
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)] sm:inline-flex sm:shrink-0 sm:pt-1.5">
            Activos
          </span>
          <ActiveFilterChips filters={filters} />
        </div>
      )}
    </div>
  );
}
