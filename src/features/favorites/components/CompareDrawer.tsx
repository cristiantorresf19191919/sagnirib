"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Crown,
  GitCompareArrows,
  Plus,
  Sparkles,
  Star,
  X,
} from "lucide-react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";
import type { BiringaListing } from "@/server/biringas";
import { formatPricePerHour } from "@/features/biringas/format";

import {
  COMPARE_LIMIT,
  useFavorites,
} from "../store/use-favorites";

interface CompareDrawerProps {
  /** Listings already in the comparison tray, in selection order. */
  listings: ReadonlyArray<BiringaListing>;
  /**
   * Other favorites the user hasn't added yet. Surfaced as a quick-add
   * strip at the top of the drawer so the user can fill the tray without
   * scrolling back to the grid.
   */
  remaining: ReadonlyArray<BiringaListing>;
}

type Verdict = "win" | "neutral";

interface RowDef {
  key: string;
  label: string;
  icon?: React.ReactNode;
  cell: (listing: BiringaListing) => {
    content: React.ReactNode;
    verdict: Verdict;
  };
}

export function CompareDrawer({
  listings,
  remaining,
}: Readonly<CompareDrawerProps>) {
  const locale = useActiveLocale();
  const { clearCompare, toggleCompare } = useFavorites();
  const open = listings.length > 0;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") clearCompare();
    }
    globalThis.addEventListener("keydown", onKey);
    return () => globalThis.removeEventListener("keydown", onKey);
  }, [open, clearCompare]);

  const rows = useMemo(() => buildRows(listings, locale), [listings, locale]);

  // Pad with placeholder slots so the layout always shows the path to fill
  // out the versus. We never render more than COMPARE_LIMIT total slots.
  const slotCount = Math.min(
    COMPARE_LIMIT,
    Math.max(listings.length + (remaining.length > 0 ? 1 : 0), listings.length),
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — fades alongside the drawer, dismisses on click.
              Lives at a lower z-index than the drawer so the drawer's
              chrome stays clickable. */}
          <motion.button
            key="compare-backdrop"
            type="button"
            aria-label={t(locale, "compareDrawer.backdrop.aria")}
            onClick={() => clearCompare()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            className="fixed inset-0 z-30 cursor-default bg-[rgba(27,26,23,0.45)] backdrop-blur-[2px]"
          />
          <motion.aside
            key="compare-drawer"
            role="dialog"
            aria-label={t(locale, "compareDrawer.dialog.aria")}
            initial={reduced ? { opacity: 0 } : { y: "110%" }}
            animate={reduced ? { opacity: 1 } : { y: 0 }}
            exit={reduced ? { opacity: 0 } : { y: "110%" }}
            transition={
              reduced
                ? { duration: 0 }
                : { type: "spring", stiffness: 260, damping: 28, mass: 0.7 }
            }
            className="fixed inset-x-0 bottom-0 z-40"
          >
          <div className="pointer-events-none absolute -top-6 inset-x-0 h-6 bg-gradient-to-t from-[var(--color-background)]/80 to-transparent" />

          <div className="relative mx-auto w-full max-w-[1200px] px-2 pb-2 sm:px-4 sm:pb-4">
            <div className="overflow-hidden rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]">
              {/* Drag handle visual */}
              <div className="flex justify-center pt-2">
                <span
                  aria-hidden
                  className="h-1 w-10 rounded-full bg-[var(--color-border)]"
                />
              </div>

              {/* Top bar */}
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary-strong)]">
                    <GitCompareArrows className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <div className="leading-tight">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-subtle)]">
                      {t(locale, "compareDrawer.eyebrow")}
                    </p>
                    <p className="text-xs font-semibold text-[var(--color-foreground)] sm:text-sm">
                      {t(locale, "compareDrawer.count", {
                        current: listings.length,
                        total: COMPARE_LIMIT,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={clearCompare}
                    className="hidden h-8 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[11px] font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-foreground)] sm:inline-flex"
                  >
                    {t(locale, "compareDrawer.clear")}
                  </button>
                  <button
                    type="button"
                    aria-label={t(locale, "compareDrawer.close.aria")}
                    onClick={clearCompare}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>

              {/* Quick-add strip */}
              {remaining.length > 0 && listings.length < COMPARE_LIMIT && (
                <QuickAddStrip
                  remaining={remaining}
                  onAdd={toggleCompare}
                  locale={locale}
                />
              )}

              {/* Body — column headers, rows, and footer CTAs */}
              <div className="max-h-[55vh] overflow-y-auto border-t border-[var(--color-border)]/60 sm:max-h-[60vh]">
                <ColumnHeaders
                  listings={listings}
                  slotCount={slotCount}
                  onRemove={toggleCompare}
                  locale={locale}
                />

                <div className="divide-y divide-[var(--color-border)]/60">
                  {rows.map((row) => (
                    <RowLine
                      key={row.key}
                      row={row}
                      listings={listings}
                      slotCount={slotCount}
                      locale={locale}
                    />
                  ))}
                </div>

                <ColumnFooters
                  listings={listings}
                  slotCount={slotCount}
                  locale={locale}
                />
              </div>
            </div>
          </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ----------------------------------------------------------------------- */
/* Quick-add strip                                                         */
/* ----------------------------------------------------------------------- */

interface QuickAddStripProps {
  remaining: ReadonlyArray<BiringaListing>;
  onAdd: (id: string) => void;
  locale: SupportedLocale;
}

function QuickAddStrip({
  remaining,
  onAdd,
  locale,
}: Readonly<QuickAddStripProps>) {
  return (
    <div className="flex items-center gap-2 border-t border-[var(--color-border)]/60 bg-[var(--color-background-elevated)] px-4 py-2 sm:px-5">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
        {t(locale, "compareDrawer.quickAdd.label")}
      </span>
      <ul className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
        {remaining.map((l) => (
          <li key={l.id} className="shrink-0">
            <button
              type="button"
              onClick={() => onAdd(l.id)}
              className="group inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-1 pl-1 pr-3 text-[11px] font-medium text-[var(--color-foreground)] transition-[border-color,background] duration-150 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary)]/60 hover:bg-[var(--color-background-elevated)]"
              title={t(locale, "compareDrawer.quickAdd.title", {
                name: l.name,
              })}
            >
              <span className="relative h-6 w-6 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                <Image
                  src={l.mainImage}
                  alt=""
                  fill
                  sizes="24px"
                  className="object-cover"
                />
              </span>
              <span className="max-w-[7rem] truncate">{l.name}</span>
              <Plus
                className="h-3 w-3 text-[var(--color-brand-primary-strong)] transition-transform duration-150 group-hover:rotate-90"
                aria-hidden
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Layout helpers                                                          */
/* ----------------------------------------------------------------------- */

interface Slot {
  /** Stable key — listing id when filled, otherwise a positional token. */
  key: string;
  /** 1-based position used to label empty slots. */
  position: number;
  listing: BiringaListing | null;
}

function buildSlots(
  listings: ReadonlyArray<BiringaListing>,
  slotCount: number,
): Slot[] {
  const slots: Slot[] = [];
  for (let pos = 1; pos <= slotCount; pos++) {
    const listing = listings[pos - 1] ?? null;
    slots.push({
      key: listing ? `filled-${listing.id}` : `empty-of-${slotCount}-pos-${pos}`,
      position: pos,
      listing,
    });
  }
  return slots;
}

const COLUMN_GRID =
  "grid gap-x-2 sm:gap-x-3 grid-cols-[88px_repeat(var(--cols),minmax(0,1fr))] sm:grid-cols-[140px_repeat(var(--cols),minmax(0,1fr))]";

function gridStyle(count: number): React.CSSProperties {
  return { ["--cols" as string]: String(count) } as React.CSSProperties;
}

interface ColumnHeadersProps {
  listings: ReadonlyArray<BiringaListing>;
  slotCount: number;
  onRemove: (id: string) => void;
  locale: SupportedLocale;
}

function ColumnHeaders({
  listings,
  slotCount,
  onRemove,
  locale,
}: Readonly<ColumnHeadersProps>) {
  const slots = buildSlots(listings, slotCount);
  return (
    <div
      className={`${COLUMN_GRID} items-center px-4 py-3 sm:px-5`}
      style={gridStyle(slotCount)}
    >
      <span aria-hidden />
      {slots.map((slot) =>
        slot.listing ? (
          <FilledSlotHeader
            key={slot.key}
            listing={slot.listing}
            onRemove={onRemove}
            locale={locale}
          />
        ) : (
          <EmptySlotHeader
            key={slot.key}
            index={slot.position}
            locale={locale}
          />
        ),
      )}
    </div>
  );
}

interface FilledSlotHeaderProps {
  listing: BiringaListing;
  onRemove: (id: string) => void;
  locale: SupportedLocale;
}

function FilledSlotHeader({
  listing,
  onRemove,
  locale,
}: Readonly<FilledSlotHeaderProps>) {
  return (
    <div className="flex items-center gap-2 sm:gap-2.5">
      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[var(--color-surface-muted)] ring-1 ring-[var(--color-border)] sm:h-14 sm:w-14">
        <Image
          src={listing.mainImage}
          alt={`${listing.name} en ${listing.city}`}
          fill
          sizes="56px"
          className="object-cover"
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-[var(--color-foreground)] sm:text-sm">
          {listing.name}
          <span className="ml-1 text-[10px] font-normal text-[var(--color-text-muted)] sm:text-xs">
            · {listing.age}
          </span>
        </p>
        <p className="truncate text-[10px] text-[var(--color-text-subtle)] sm:text-[11px]">
          {listing.city}
          {listing.neighborhood ? ` · ${listing.neighborhood}` : ""}
        </p>
      </div>
      <button
        type="button"
        aria-label={t(locale, "compareDrawer.remove.aria", {
          name: listing.name,
        })}
        onClick={() => onRemove(listing.id)}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
      >
        <X className="h-3 w-3" aria-hidden />
      </button>
    </div>
  );
}

interface EmptySlotHeaderProps {
  index: number;
  locale: SupportedLocale;
}

function EmptySlotHeader({ index, locale }: Readonly<EmptySlotHeaderProps>) {
  return (
    <div className="flex h-12 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-background-elevated)] px-3 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-subtle)] sm:h-14">
      <span className="inline-flex items-center gap-1.5">
        <Plus className="h-3 w-3" aria-hidden />
        {t(locale, "compareDrawer.empty.slot", { index })}
      </span>
    </div>
  );
}

interface ColumnFootersProps {
  listings: ReadonlyArray<BiringaListing>;
  slotCount: number;
  locale: SupportedLocale;
}

function ColumnFooters({
  listings,
  slotCount,
  locale,
}: Readonly<ColumnFootersProps>) {
  const slots = buildSlots(listings, slotCount);
  return (
    <div
      className={`${COLUMN_GRID} items-center border-t border-[var(--color-border)]/60 bg-[var(--color-background-elevated)] px-4 py-3 sm:px-5`}
      style={gridStyle(slotCount)}
    >
      <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
        {t(locale, "compareDrawer.footer.decide")}
      </span>
      {slots.map((slot) =>
        slot.listing ? (
          <Link
            key={slot.key}
            href={localizedHref(locale, `/p/${slot.listing.slug}`)}
            className="group inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[var(--color-brand-primary)] px-3 text-[11px] font-semibold text-[var(--color-surface)] shadow-[var(--shadow-sm)] transition-[background,box-shadow] duration-200 ease-[var(--ease-standard)] hover:bg-[var(--color-brand-primary-strong)] hover:shadow-[var(--shadow-glow-primary)]"
          >
            {t(locale, "compareDrawer.footer.gotoProfile")}
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-200 ease-[var(--ease-standard)] group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        ) : (
          <span
            key={slot.key}
            className="inline-flex h-9 items-center justify-center rounded-full border border-dashed border-[var(--color-border)] text-[11px] text-[var(--color-text-subtle)]"
          >
            {t(locale, "compareDrawer.value.dash")}
          </span>
        ),
      )}
    </div>
  );
}

interface RowLineProps {
  row: RowDef;
  listings: ReadonlyArray<BiringaListing>;
  slotCount: number;
  locale: SupportedLocale;
}

function RowLine({ row, listings, slotCount, locale }: Readonly<RowLineProps>) {
  const slots = buildSlots(listings, slotCount);
  return (
    <div
      className={`${COLUMN_GRID} items-center px-4 py-2 sm:px-5`}
      style={gridStyle(slotCount)}
    >
      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
        {row.icon}
        {row.label}
      </span>
      {slots.map((slot) => {
        if (!slot.listing) {
          return (
            <span
              key={`${row.key}-${slot.key}`}
              className="inline-flex min-h-[28px] items-center px-2 text-[var(--color-text-subtle)]"
            >
              {t(locale, "compareDrawer.value.dash")}
            </span>
          );
        }
        const { content, verdict } = row.cell(slot.listing);
        return (
          <Cell key={`${row.key}-${slot.key}`} verdict={verdict} locale={locale}>
            {content}
          </Cell>
        );
      })}
    </div>
  );
}

interface CellProps {
  verdict: Verdict;
  locale: SupportedLocale;
  children: React.ReactNode;
}

function Cell({ verdict, locale, children }: Readonly<CellProps>) {
  const winner = verdict === "win";
  return (
    <div
      className={`relative flex min-h-[28px] items-center rounded-md px-2 py-1 text-xs transition-colors sm:text-sm ${
        winner
          ? "bg-gradient-to-br from-[var(--color-brand-primary)]/10 via-[var(--color-brand-accent)]/8 to-transparent ring-1 ring-[var(--color-brand-primary)]/30"
          : ""
      }`}
    >
      <span className="flex flex-1 flex-wrap items-center gap-1">
        {children}
      </span>
      {winner && (
        <Crown
          className="ml-1.5 h-3 w-3 shrink-0 text-[var(--color-brand-primary-strong)]"
          aria-label={t(locale, "compareDrawer.crown.aria")}
        />
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Row builders + verdict logic                                            */
/* ----------------------------------------------------------------------- */

function buildRows(
  listings: ReadonlyArray<BiringaListing>,
  locale: SupportedLocale,
): RowDef[] {
  const numberFormat = new Intl.NumberFormat(
    locale === "en" ? "en-US" : "es-CO",
  );
  const single = listings.length < 2;
  const verdict = (predicate: boolean): Verdict => {
    if (single) return "neutral";
    return predicate ? "win" : "neutral";
  };

  const prices = listings.map((l) => l.pricePerHour);
  const scores = listings.map((l) => l.reputation.score);
  const reviewCounts = listings.map((l) => l.reputation.reviewCount);
  const langCounts = listings.map(
    (l) => (l.attributes.languages ?? []).length,
  );
  const serviceCounts = listings.map((l) => l.services.length);

  const minPrice = listings.length > 0 ? Math.min(...prices) : 0;
  const maxScore = listings.length > 0 ? Math.max(...scores) : 0;
  const maxReviews = listings.length > 0 ? Math.max(...reviewCounts) : 0;
  const maxLangs = listings.length > 0 ? Math.max(...langCounts) : 0;
  const maxServices = listings.length > 0 ? Math.max(...serviceCounts) : 0;

  const yes = t(locale, "compareDrawer.value.yes");
  const no = t(locale, "compareDrawer.value.no");
  const dash = t(locale, "compareDrawer.value.dash");

  return [
    {
      key: "price",
      label: t(locale, "compareDrawer.row.price"),
      cell: (l) => ({
        content: (
          <span className="font-semibold tabular-nums">
            {formatPricePerHour(l.pricePerHour)}
          </span>
        ),
        verdict: verdict(l.pricePerHour === minPrice),
      }),
    },
    {
      key: "score",
      label: t(locale, "compareDrawer.row.score"),
      icon: (
        <Star
          className="h-3 w-3 fill-[var(--color-brand-warn)] text-[var(--color-brand-warn)]"
          aria-hidden
        />
      ),
      cell: (l) => ({
        content: (
          <span className="inline-flex items-center gap-0.5 font-semibold tabular-nums">
            {l.reputation.score.toFixed(1)}
            <span className="text-[10px] font-normal text-[var(--color-text-muted)]">
              {t(locale, "compareDrawer.score.outOf")}
            </span>
          </span>
        ),
        verdict: verdict(l.reputation.score === maxScore),
      }),
    },
    {
      key: "reviews",
      label: t(locale, "compareDrawer.row.reviews"),
      cell: (l) => ({
        content: (
          <span className="tabular-nums">
            {numberFormat.format(l.reputation.reviewCount)}
          </span>
        ),
        verdict: verdict(l.reputation.reviewCount === maxReviews),
      }),
    },
    {
      key: "verified",
      label: t(locale, "compareDrawer.row.verified"),
      cell: (l) => ({
        content: <Pill on={l.verified}>{l.verified ? yes : no}</Pill>,
        verdict: verdict(l.verified),
      }),
    },
    {
      key: "video",
      label: t(locale, "compareDrawer.row.video"),
      cell: (l) => ({
        content: <Pill on={l.hasVideo}>{l.hasVideo ? yes : dash}</Pill>,
        verdict: verdict(l.hasVideo),
      }),
    },
    {
      key: "audio",
      label: t(locale, "compareDrawer.row.audio"),
      cell: (l) => ({
        content: <Pill on={l.hasAudio}>{l.hasAudio ? yes : dash}</Pill>,
        verdict: verdict(l.hasAudio),
      }),
    },
    {
      key: "languages",
      label: t(locale, "compareDrawer.row.languages"),
      cell: (l) => {
        const langs = l.attributes.languages ?? [];
        return {
          content:
            langs.length === 0 ? (
              <span className="text-[var(--color-text-subtle)]">{dash}</span>
            ) : (
              <span className="flex flex-wrap gap-1">
                {langs.map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center rounded-full bg-[var(--color-brand-secondary)]/12 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-brand-secondary-strong)]"
                  >
                    {lang}
                  </span>
                ))}
              </span>
            ),
          verdict: verdict(langs.length === maxLangs && langs.length > 0),
        };
      },
    },
    {
      key: "services",
      label: t(locale, "compareDrawer.row.services"),
      icon: (
        <Sparkles
          className="h-3 w-3 text-[var(--color-brand-accent-strong)]"
          aria-hidden
        />
      ),
      cell: (l) => ({
        content: (
          <span>
            <span className="font-semibold tabular-nums">
              {l.services.length}
            </span>
            <span className="ml-1 text-[10px] text-[var(--color-text-muted)]">
              {t(locale, "compareDrawer.services.suffix")}
            </span>
          </span>
        ),
        verdict: verdict(
          l.services.length === maxServices && l.services.length > 0,
        ),
      }),
    },
  ];
}

interface PillProps {
  on: boolean;
  children: React.ReactNode;
}

function Pill({ on, children }: Readonly<PillProps>) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
        on
          ? "bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary-strong)]"
          : "text-[var(--color-text-subtle)]"
      }`}
    >
      {children}
    </span>
  );
}
