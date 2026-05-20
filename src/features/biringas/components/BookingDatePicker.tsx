"use client";

import { useEffect, useMemo, useRef } from "react";

import {
  SLOTS,
  SLOT_LABELS,
  firstAvailableSlot,
  getUpcomingAvailability,
  type Slot,
  type SlotState,
} from "../lib/availability";

const DAY_NAMES_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_NAMES_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

interface BookingDatePickerProps {
  listingSlug: string;
  /** YYYY-MM-DD (local) — current day selection. */
  selectedDate: string;
  /** Currently selected time-of-day slot. */
  selectedSlot: Slot;
  onChange: (next: { date: string; slot: Slot }) => void;
  /** How many forward days to render in the strip. */
  dayCount?: number;
}

/**
 * Booking date + slot picker. Replaces the native `<input type="date">`
 * with a horizontally-scrollable day strip whose cells mirror the
 * availability data shown on the profile's `AvailabilityStrip`, plus a
 * slot row (Mañana/Tarde/Noche) where only the day's open slots are
 * clickable. This is the difference between "she might be free" and
 * "you're requesting a moment she actually has on her calendar".
 */
export function BookingDatePicker({
  listingSlug,
  selectedDate,
  selectedSlot,
  onChange,
  dayCount = 14,
}: Readonly<BookingDatePickerProps>) {
  const days = useMemo(
    () => getUpcomingAvailability(listingSlug, dayCount),
    [listingSlug, dayCount],
  );

  const selectedDay =
    days.find((d) => d.isoDate === selectedDate) ?? days[0]!;

  // Selected slot may become unavailable when the user hops to a day
  // that doesn't open that slot — quietly migrate to the first open slot
  // of the new day so submit stays valid. The strip's onClick also does
  // this for direct clicks; this hook covers the externally-driven case
  // (e.g. the modal mounts with a stale slot).
  useEffect(() => {
    if (selectedDay.slots[selectedSlot] !== 0) return;
    const fallback = firstAvailableSlot(selectedDay);
    if (fallback !== selectedSlot) {
      onChange({ date: selectedDay.isoDate, slot: fallback });
    }
  }, [selectedDay, selectedSlot, onChange]);

  // Auto-scroll the selected day into view when the picker mounts —
  // matters when the default selection isn't day 0 (e.g. today is fully
  // blocked and the picker opens on day +1).
  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLElement>(
      `[data-iso="${selectedDate}"]`,
    );
    el?.scrollIntoView({ block: "nearest", inline: "center" });
    // Mount only — subsequent clicks already keep the card on screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todayIso = days[0]?.isoDate;

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={stripRef}
        role="radiogroup"
        aria-label="Día propuesto"
        className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]"
      >
        {days.map((d) => {
          const isSelected = d.isoDate === selectedDate;
          const isToday = d.isoDate === todayIso;
          const allBlocked =
            d.slots.morning === 0 &&
            d.slots.afternoon === 0 &&
            d.slots.evening === 0;
          const dow = DAY_NAMES_SHORT[d.dayOfWeek];
          return (
            <button
              key={d.isoDate}
              type="button"
              role="radio"
              data-iso={d.isoDate}
              aria-checked={isSelected}
              aria-label={`${dow} ${d.date.getDate()} de ${MONTH_NAMES_SHORT[d.date.getMonth()]}${
                allBlocked ? " — sin disponibilidad" : ""
              }`}
              disabled={allBlocked}
              onClick={() => {
                if (allBlocked) return;
                const keepSlot =
                  d.slots[selectedSlot] !== 0
                    ? selectedSlot
                    : firstAvailableSlot(d);
                onChange({ date: d.isoDate, slot: keepSlot });
              }}
              className={`group flex min-w-[68px] shrink-0 snap-start flex-col items-center gap-1.5 rounded-[var(--radius-lg)] border px-2.5 py-2.5 text-center transition-[border-color,background,transform] duration-150 ease-[var(--ease-standard)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]/40 disabled:cursor-not-allowed disabled:opacity-40 ${
                isSelected
                  ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/12 shadow-[var(--shadow-glow-primary)]"
                  : "border-[var(--color-border)] bg-[var(--color-background)] hover:-translate-y-[1px] hover:border-[var(--color-brand-primary-soft)]"
              }`}
            >
              <span
                className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${
                  isSelected
                    ? "text-[var(--color-brand-primary)]"
                    : "text-[var(--color-text-subtle)]"
                }`}
              >
                {isToday ? "Hoy" : dow}
              </span>
              <span className="text-base font-semibold leading-none tabular-nums text-[var(--color-foreground)]">
                {d.date.getDate()}
              </span>
              <span className="text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                {MONTH_NAMES_SHORT[d.date.getMonth()]}
              </span>
              <span className="mt-0.5 flex items-center gap-1" aria-hidden>
                {SLOTS.map((s) => (
                  <span
                    key={s}
                    className={`block h-1.5 w-1.5 rounded-full ${dotClass(d.slots[s])}`}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div
        role="radiogroup"
        aria-label="Momento del día"
        className="flex flex-wrap items-center gap-2"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
          Momento
        </span>
        {SLOTS.map((s) => {
          const state = selectedDay.slots[s];
          const disabled = state === 0;
          const checked = !disabled && s === selectedSlot;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={checked}
              disabled={disabled}
              title={
                disabled
                  ? "Sin disponibilidad para este momento"
                  : state === 1
                    ? "Disponible por consulta"
                    : "Disponible"
              }
              onClick={() =>
                onChange({ date: selectedDay.isoDate, slot: s })
              }
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-[border-color,background,color,opacity] duration-150 ease-[var(--ease-standard)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]/40 disabled:cursor-not-allowed disabled:opacity-40 ${
                checked
                  ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary)]"
                  : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-muted)] hover:border-[var(--color-brand-primary-soft)] hover:text-[var(--color-foreground)]"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${dotClass(state)}`}
                aria-hidden
              />
              {SLOT_LABELS[s]}
              {state === 1 && !disabled && (
                <span className="text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                  por consulta
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function dotClass(state: SlotState): string {
  if (state === 2) return "bg-[var(--color-brand-primary)]";
  if (state === 1)
    return "bg-[var(--color-brand-warn)]/70 ring-1 ring-[var(--color-brand-warn)]/50";
  return "bg-[var(--color-surface-muted)]";
}
