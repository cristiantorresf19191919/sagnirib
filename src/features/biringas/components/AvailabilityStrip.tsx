"use client";

import {
  motion,
  useInView,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { Clock } from "lucide-react";
import { useMemo, useRef } from "react";

import {
  getWeeklyAvailability,
  synthReplyMinutes,
  type Slot,
} from "../lib/availability";

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const SLOT_ROWS: ReadonlyArray<{ key: Slot; label: string }> = [
  { key: "morning", label: "Mañana" },
  { key: "afternoon", label: "Tarde" },
  { key: "evening", label: "Noche" },
];

/**
 * Parent stagger — fires once per viewport entry, replays on every
 * subsequent re-entry. `delayChildren` gives the eye a beat to land on
 * the calendar before the cells start spark-firing.
 */
const STAGGER_PARENT: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.12,
    },
  },
};

/**
 * "Disponible" (open green) slot — sparks in with a bright halo, scale
 * overshoot, and a soft drop into the resting state. This is the
 * attention-call: the user's eye is drawn directly to the cells they
 * can actually book.
 */
const SPARK_AVAILABLE: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.35,
    boxShadow: "0 0 0 0 rgba(47, 93, 67, 0)",
  },
  visible: {
    opacity: 1,
    // Slight overshoot → settle = "spark"
    scale: [0.35, 1.22, 0.98, 1],
    boxShadow: [
      "0 0 0 0 rgba(47, 93, 67, 0)",
      "0 0 22px 6px rgba(47, 93, 67, 0.55)",
      "0 0 8px 2px rgba(47, 93, 67, 0.25)",
      "0 2px 6px -2px rgba(47, 93, 67, 0.45)",
    ],
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as const,
      times: [0, 0.4, 0.7, 1],
    },
  },
};

/**
 * Non-available slots fade in quietly. Same parent stagger so the
 * grid still reads as a single coordinated reveal, but no spark — only
 * the green cells call attention.
 */
const FADE_NEUTRAL: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

interface AvailabilityStripProps {
  /** Slug of the listing — drives the deterministic week pattern. */
  listingSlug: string;
  /** When true (default), highlights today's column so users orient fast. */
  highlightToday?: boolean;
  /** Synthesised "avg reply" minutes shown alongside the grid. */
  avgReplyMinutes?: number;
}

/**
 * Weekly-availability strip rendered on the profile page.
 *
 * Until a real calendar / availability port ships, the week is
 * synthesised deterministically from the listing slug — every listing
 * gets a stable pattern that doesn't change across refreshes. The 7×3
 * grid (day × slot) gives buyers a one-glance answer to "is she free
 * when I want to meet?" — the biggest pre-contact uncertainty.
 *
 * Animation: on every viewport entry (first paint AND each scroll-in),
 * the grid replays a staggered cascade. "Disponible" cells SPARK in
 * with a bright forest halo + scale overshoot, calling attention. The
 * neutral cells fade in quietly so the green ones own the moment.
 * Respects `prefers-reduced-motion`.
 *
 * When the real port lands, swap the `availability` array for the
 * server-supplied data and delete the synth helpers.
 */
export function AvailabilityStrip({
  listingSlug,
  highlightToday = true,
  avgReplyMinutes,
}: Readonly<AvailabilityStripProps>) {
  // Pull the per-(slug, dayOfWeek, slot) pattern from the shared lib so
  // this strip and the booking date picker agree cell-for-cell on what
  // "Disponible" / "Consultar" / "Ocupada" means.
  const week = useMemo(() => getWeeklyAvailability(listingSlug), [listingSlug]);
  const replyMin = avgReplyMinutes ?? synthReplyMinutes(listingSlug);

  // Highlight today (computed client-side so timezone doesn't drift
  // between SSR and CSR).
  const todayDow = highlightToday ? new Date().getDay() : -1;

  // useInView re-fires every viewport entry (`once: false`) — that's
  // what makes the spark cascade replay each time the user scrolls
  // back to the profile, exactly as the founder asked.
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLTableElement>(null);
  const inView = useInView(containerRef, {
    once: false,
    amount: 0.4,
    margin: "-40px",
  });

  return (
    <section
      data-testid="availability-strip"
      aria-label="Disponibilidad semanal"
      className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-5 backdrop-blur-sm"
    >
      <header className="flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
          Disponibilidad
        </h3>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand-primary)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--color-brand-primary)]">
          <Clock className="h-3 w-3" aria-hidden />
          Responde en ~{replyMin} min
        </span>
      </header>

      <motion.table
        ref={containerRef}
        className="mt-4 w-full border-separate border-spacing-1 text-center"
        variants={reduced ? undefined : STAGGER_PARENT}
        initial={reduced ? false : "hidden"}
        animate={reduced ? undefined : inView ? "visible" : "hidden"}
      >
        <thead>
          <tr>
            <th className="w-12" />
            {DAY_NAMES.map((day, i) => (
              <th
                key={day}
                scope="col"
                data-today={i === todayDow ? "true" : "false"}
                className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)] data-[today=true]:text-[var(--color-brand-primary)]"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SLOT_ROWS.map(({ key: slotKey, label: slot }) => (
            <tr key={slotKey}>
              <th
                scope="row"
                className="text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]"
              >
                {slot}
              </th>
              {week.map((day, dayIdx) => {
                const state = day[slotKey];
                const isToday = dayIdx === todayDow;
                const variants =
                  state === 2 ? SPARK_AVAILABLE : FADE_NEUTRAL;
                const baseCls =
                  "block h-7 w-full rounded-[6px] will-change-transform";
                const stateCls =
                  state === 0
                    ? "bg-[var(--color-surface-muted)]"
                    : state === 1
                      ? "bg-[var(--color-brand-warn)]/30 ring-1 ring-[var(--color-brand-warn)]/50"
                      : "bg-[var(--color-brand-primary)]";
                const todayCls = isToday
                  ? "ring-2 ring-[var(--color-brand-primary)]/60"
                  : "";

                return (
                  <td key={`${slotKey}-${dayIdx}`} className="p-0">
                    <motion.span
                      aria-label={
                        state === 2
                          ? "Disponible"
                          : state === 1
                            ? "Consultar"
                            : "Ocupada"
                      }
                      title={
                        state === 2
                          ? "Disponible"
                          : state === 1
                            ? "Consultar"
                            : "Ocupada"
                      }
                      variants={reduced ? undefined : variants}
                      className={`${baseCls} ${stateCls} ${todayCls}`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </motion.table>

      <ul
        aria-label="Leyenda de disponibilidad"
        className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-[var(--color-text-muted)]"
      >
        <li className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-[3px] bg-[var(--color-brand-primary)]"
          />
          Disponible
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-[3px] bg-[var(--color-brand-warn)]/30 ring-1 ring-[var(--color-brand-warn)]/50"
          />
          Consultar
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-[3px] bg-[var(--color-surface-muted)]"
          />
          Ocupada
        </li>
      </ul>

      <p className="mt-2 text-[10.5px] italic text-[var(--color-text-subtle)]">
        Confirma siempre la disponibilidad antes de viajar — los horarios
        son orientativos.
      </p>
    </section>
  );
}
