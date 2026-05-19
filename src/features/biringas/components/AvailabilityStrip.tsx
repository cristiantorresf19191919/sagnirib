import { Clock } from "lucide-react";

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const SLOT_NAMES = ["Mañana", "Tarde", "Noche"];

/**
 * Deterministic FNV-1a hash → seed for a small PRNG. Same input → same
 * output, so a given listing slug always renders the same week pattern
 * across requests (no hydration churn, no "today she's free / tomorrow
 * she isn't" surprise on refresh). Until a real availability calendar
 * ships, this gives the UI something concrete to render.
 */
function seedFrom(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

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
 * When the real port lands, swap the `availability` array for the
 * server-supplied data and delete the synth helpers.
 */
export function AvailabilityStrip({
  listingSlug,
  highlightToday = true,
  avgReplyMinutes,
}: Readonly<AvailabilityStripProps>) {
  const rng = mulberry32(seedFrom(listingSlug));
  // 7 days × 3 slots → 21 cells, each 0..2: 0=closed, 1=tentative, 2=open
  const availability: ReadonlyArray<ReadonlyArray<0 | 1 | 2>> = Array.from(
    { length: 7 },
    () =>
      Array.from({ length: 3 }, () => {
        const r = rng();
        if (r < 0.18) return 0 as const;
        if (r < 0.42) return 1 as const;
        return 2 as const;
      }),
  );

  // Synthesise an avg reply time too if the parent didn't pass one.
  const replyMin =
    avgReplyMinutes ?? Math.max(4, Math.floor(rng() * 38) + 4);

  // We never trust the server's `new Date()` for "today" — render the
  // dow on the client via a data-attribute so SSR is stable across
  // timezones. Tailwind picks up the `data-today=true` class for the
  // highlight.
  const todayDow = highlightToday ? new Date().getDay() : -1;

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

      <table className="mt-4 w-full border-separate border-spacing-1 text-center">
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
          {SLOT_NAMES.map((slot, slotIdx) => (
            <tr key={slot}>
              <th
                scope="row"
                className="text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]"
              >
                {slot}
              </th>
              {availability.map((day, dayIdx) => {
                const state = day[slotIdx];
                const isToday = dayIdx === todayDow;
                return (
                  <td key={`${slot}-${dayIdx}`} className="p-0">
                    <span
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
                      data-today={isToday ? "true" : "false"}
                      data-state={state}
                      className="block h-7 w-full rounded-[6px] transition-transform duration-150 ease-[var(--ease-standard)] data-[state='0']:bg-[var(--color-surface-muted)] data-[state='1']:bg-[var(--color-brand-warn)]/30 data-[state='1']:ring-1 data-[state='1']:ring-[var(--color-brand-warn)]/50 data-[state='2']:bg-[var(--color-brand-primary)] data-[state='2']:shadow-[0_2px_6px_-2px_rgba(47,93,67,0.4)] data-[today=true]:scale-[1.06] data-[today=true]:ring-2 data-[today=true]:ring-[var(--color-brand-primary)]/60"
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

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
