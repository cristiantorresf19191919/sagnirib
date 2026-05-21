import Link from "next/link";
import { Eraser, Sparkles } from "lucide-react";

import { localizedHref } from "@/core/i18n/href";
import { readLocale } from "@/core/i18n/locale";
import { t } from "@/core/i18n/messages";
import type { ListingsFilters } from "@/server/biringas";

import type { CatalogView } from "../lib/parse-filters";
import { ActiveFilterChips } from "./ActiveFilterChips";
import { FiltersPanel } from "./FiltersPanel";
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
export async function ResultsToolbar({
  filters,
  view,
  resultCount,
  totalCount,
}: ResultsToolbarProps) {
  const locale = await readLocale();
  const activeCount = activeFilterCount(filters);
  const cityLabel = filters.city ?? t(locale, "explorar.toolbar.cityAll");
  const totalLabel =
    totalCount !== undefined && totalCount !== resultCount
      ? ` ${t(locale, "explorar.toolbar.totalSuffix", { total: FORMAT_NUMBER.format(totalCount) })}`
      : "";
  const clearLabel = t(
    locale,
    activeCount === 1
      ? "explorar.toolbar.clear.singular"
      : "explorar.toolbar.clear.plural",
    { count: activeCount },
  );

  return (
    <div className="sticky top-16 z-20 -mx-4 mb-4 sm:-mx-6 lg:-mx-8">
      {/* Pill-card surface — the reference treats this band as a discrete
          rounded card rather than a sticky border. A subtle backdrop blur
          + soft shadow lifts it visually from the catalog grid below. */}
      <div className="mx-4 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-3 py-2.5 shadow-[0_8px_24px_-16px_rgba(20,28,24,0.25)] backdrop-blur-md supports-[backdrop-filter]:bg-[var(--color-surface)]/75 sm:mx-6 sm:px-4 sm:py-3 lg:mx-8 lg:px-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-3">
              <span
                aria-hidden
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-gold)]/20 via-[var(--color-gold)]/10 to-[var(--color-cream)] text-[var(--color-gold-deep)] ring-1 ring-[var(--color-gold)]/30"
              >
                <Sparkles className="h-4 w-4" aria-hidden />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                  {cityLabel}
                </span>
                <span className="font-[var(--font-display)] text-[17px] font-[480] tracking-tight text-[var(--color-foreground)]">
                  {FORMAT_NUMBER.format(resultCount)}
                  {totalLabel}{" "}
                  <span className="text-[var(--color-text-muted)]">
                    {t(locale, "explorar.toolbar.entityLabel")}
                  </span>
                </span>
              </span>
            </span>

            {activeCount > 0 && (
              <span
                aria-hidden
                className="hidden h-7 w-px bg-[var(--color-border)] sm:inline-block"
              />
            )}

            {activeCount > 0 && (
              <Link
                href={localizedHref(locale, "/explorar")}
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 text-[12px] font-semibold text-[var(--color-text-muted)] transition-[border-color,color,background] duration-150 hover:border-[var(--color-brand-highlight)]/45 hover:bg-[var(--color-brand-highlight)]/8 hover:text-[var(--color-brand-highlight)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-highlight)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
              >
                <Eraser className="h-3 w-3" aria-hidden />
                {clearLabel}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2">
            <FiltersPanel filters={filters} view={view} />
            <SortMenu filters={filters} view={view} />
          </div>
        </div>

        {activeCount > 0 && (
          <div className="mt-3 flex items-start gap-2.5 border-t border-[var(--color-border)]/60 pt-3">
            <span className="hidden items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)] sm:inline-flex sm:shrink-0 sm:pt-1.5">
              <span
                aria-hidden
                className="inline-block h-px w-6 bg-gradient-to-r from-[var(--color-gold)] to-transparent"
              />
              {t(locale, "explorar.toolbar.activeLabel")}
            </span>
            <ActiveFilterChips filters={filters} />
          </div>
        )}
      </div>
    </div>
  );
}
