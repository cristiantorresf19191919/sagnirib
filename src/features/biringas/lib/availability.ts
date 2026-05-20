/**
 * Shared availability synthesis for a listing slug.
 *
 * Until a real availability port ships, both the profile-page
 * `AvailabilityStrip` and the `BookingRequestModal` date picker need to
 * agree on whether a given `(slug, dayOfWeek, slot)` cell is open,
 * by-request, or blocked — otherwise the buyer sees "Disponible mañana"
 * on the strip but the date picker refuses to schedule it. This module
 * is the single source of truth.
 *
 * The hash → PRNG keys on `slug | dayOfWeek | slot` so each cell is
 * stable across SSR, hydration, navigation, and re-renders. When the
 * real port lands, swap the bodies of `getSlotState` /
 * `getWeeklyAvailability` / `getUpcomingAvailability` for the
 * server-supplied data and the consumers won't notice.
 */

export type SlotState = 0 | 1 | 2;

export type Slot = "morning" | "afternoon" | "evening";

export const SLOTS: ReadonlyArray<Slot> = ["morning", "afternoon", "evening"];

export const SLOT_LABELS: Record<Slot, string> = {
  morning: "Mañana",
  afternoon: "Tarde",
  evening: "Noche",
};

/**
 * Local hour each slot maps to when the picked day + slot are flattened
 * into the ISO `proposedAt` sent to the server. Keeps the booking schema
 * unchanged while preserving the buyer's intent inside the timestamp.
 */
export const SLOT_HOURS: Record<Slot, number> = {
  morning: 10,
  afternoon: 16,
  evening: 21,
};

function seedFrom(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash >>> 0;
}

function rngOnce(seed: number): number {
  const t = (seed + 0x6d2b79f5) >>> 0;
  let r = Math.imul(t ^ (t >>> 15), 1 | t);
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
  return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
}

export function getSlotState(
  slug: string,
  dayOfWeek: number,
  slot: Slot,
): SlotState {
  const r = rngOnce(seedFrom(`${slug}|${dayOfWeek}|${slot}`));
  if (r < 0.18) return 0;
  if (r < 0.42) return 1;
  return 2;
}

/** "Responde en ~N min" badge — synthesised from a dedicated seed so it
 *  stays stable independently of the availability grid. */
export function synthReplyMinutes(slug: string): number {
  return Math.max(4, Math.floor(rngOnce(seedFrom(`${slug}|reply`)) * 38) + 4);
}

export interface DayAvailability {
  /** Calendar date as YYYY-MM-DD in local time (matches the user's clock). */
  isoDate: string;
  /** 0-6 (Sun..Sat) — index into the synthesised week pattern. */
  dayOfWeek: number;
  /** Underlying Date for label rendering (local). */
  date: Date;
  slots: Record<Slot, SlotState>;
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Weekly pattern indexed by dayOfWeek (Sun=0..Sat=6). Used by
 *  `AvailabilityStrip` which renders a fixed Dom..Sáb grid. */
export function getWeeklyAvailability(
  slug: string,
): ReadonlyArray<Record<Slot, SlotState>> {
  return Array.from({ length: 7 }, (_, dow) => ({
    morning: getSlotState(slug, dow, "morning"),
    afternoon: getSlotState(slug, dow, "afternoon"),
    evening: getSlotState(slug, dow, "evening"),
  }));
}

/** Forward-looking N days starting at `startFrom` (default: today, local).
 *  Used by the booking date picker to map each calendar day to the same
 *  per-dayOfWeek pattern surfaced by the strip. */
export function getUpcomingAvailability(
  slug: string,
  dayCount = 14,
  startFrom: Date = new Date(),
): ReadonlyArray<DayAvailability> {
  const start = new Date(
    startFrom.getFullYear(),
    startFrom.getMonth(),
    startFrom.getDate(),
  );
  return Array.from({ length: dayCount }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dow = d.getDay();
    return {
      isoDate: toIsoDate(d),
      dayOfWeek: dow,
      date: d,
      slots: {
        morning: getSlotState(slug, dow, "morning"),
        afternoon: getSlotState(slug, dow, "afternoon"),
        evening: getSlotState(slug, dow, "evening"),
      },
    };
  });
}

/** Encode the picked day + slot into the ISO string the server expects.
 *  The schema accepts any `Date.parse`-able value — putting the slot's
 *  canonical hour into the timestamp preserves intent without extending
 *  the booking payload. */
export function composeProposedAt(isoDate: string, slot: Slot): string {
  return `${isoDate}T${String(SLOT_HOURS[slot]).padStart(2, "0")}:00:00`;
}

/** Pick the first day in the strip that has any non-blocked slot — the
 *  default selection for the date picker so the modal opens on a real
 *  bookable day instead of a hardcoded "tomorrow". */
export function firstAvailableDay(
  days: ReadonlyArray<DayAvailability>,
): DayAvailability {
  return (
    days.find((d) =>
      SLOTS.some((s) => d.slots[s] !== 0),
    ) ?? days[0]!
  );
}

/** Pick the first non-blocked slot on a day, with a stable fallback when
 *  every slot is blocked (caller is responsible for disabling submit in
 *  that case). */
export function firstAvailableSlot(day: DayAvailability): Slot {
  return SLOTS.find((s) => day.slots[s] !== 0) ?? "afternoon";
}
