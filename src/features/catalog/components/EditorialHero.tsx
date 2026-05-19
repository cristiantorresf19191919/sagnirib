import Image from "next/image";
import Link from "next/link";
import {
  BotOff,
  ChevronDown,
  Lock,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  UserCheck,
  Video,
  type LucideIcon,
} from "lucide-react";

import { listHeroMosaic } from "@/server/biringas";
import { CountUp } from "@/shared/motion/CountUp";
import { UnderlineSweep } from "@/shared/motion/UnderlineSweep";

import { EditorialHeroMosaicColumn } from "./EditorialHeroMosaicColumn";
import { HeroMosaicCard } from "./HeroMosaicCard";

interface EditorialHeroProps {
  /** Optional location label rendered as the kicker. */
  location?: string;
}

/** Sugerido categories — each pill carries a taxonomy hint so users scan
 *  the row in an F-pattern instead of reading every label.
 *  - `live`      → green pulsing dot (availability now)
 *  - `location`  → MapPin (geo/plan tied to a city)
 *  - `digital`   → outline-style Video pill (remote service)
 *  - `quality`   → Star (curation signal)
 */
type SuggestedKind = "live" | "location" | "digital" | "quality";

const SUGGESTED: ReadonlyArray<{
  label: string;
  href: string;
  kind: SuggestedKind;
}> = [
  { label: "Disponibles ahora", href: "/explorar?available=1", kind: "live" },
  { label: "Cena Bogotá", href: "/explorar?city=Bogot%C3%A1", kind: "location" },
  { label: "Fin de semana Cartagena", href: "/explorar?city=Cartagena", kind: "location" },
  { label: "Videollamada", href: "/explorar?category=videollamadas", kind: "digital" },
  { label: "Top rated", href: "/explorar?sort=rating", kind: "quality" },
];

const SUGGESTED_ICON: Record<SuggestedKind, LucideIcon | null> = {
  live: null, // rendered as a pulsing dot, see below
  location: MapPin,
  digital: Video,
  quality: Star,
};

/** Marquee items — city entries are interactive (jump straight into the
 *  filtered catalog); the value-prop lines stay non-link so the user
 *  doesn't accidentally navigate. */
const MARQUEE_ITEMS: ReadonlyArray<{ label: string; href?: string }> = [
  { label: "Bogotá · 142 activas", href: "/explorar?city=Bogot%C3%A1" },
  { label: "Medellín · 88 activas", href: "/explorar?city=Medell%C3%ADn" },
  { label: "Cartagena · 41 activas", href: "/explorar?city=Cartagena" },
  { label: "Cali · 37 activas", href: "/explorar?city=Cali" },
  { label: "Verificación en vivo" },
  { label: "Reseñas reales" },
  { label: "Sin bots, sin catfish" },
  { label: "Pago discreto disponible" },
  { label: "Barranquilla · 24 activas", href: "/explorar?city=Barranquilla" },
  { label: "Videollamada disponible", href: "/explorar?category=videollamadas" },
];

const TILE_HEIGHTS_A = [240, 320, 240, 320] as const;
const TILE_HEIGHTS_B = [360, 220, 360, 220] as const;
const TILE_HEIGHTS_C = [280, 240, 280, 240] as const;

const MOSAIC_TILES_PER_COLUMN = 4;
const MOSAIC_COL_A_START = 0;
const MOSAIC_COL_A_END = MOSAIC_COL_A_START + MOSAIC_TILES_PER_COLUMN;
const MOSAIC_COL_B_START = MOSAIC_COL_A_END;
const MOSAIC_COL_B_END = MOSAIC_COL_B_START + MOSAIC_TILES_PER_COLUMN;
const MOSAIC_COL_C_START = MOSAIC_COL_B_END;
const MOSAIC_COL_C_END = MOSAIC_COL_C_START + MOSAIC_TILES_PER_COLUMN;
const MOSAIC_TOTAL_TILES = MOSAIC_COL_C_END;

/**
 * Mosaic columns are absolutely positioned inside the right rail so the
 * staggered editorial offsets (top: -40 / +60 / -20) sit on `top`/`bottom`
 * instead of `marginTop`. Widths use `calc()` against the rail width so
 * the original 28% / 36% / 28% rhythm with 10px gutters is preserved
 * pixel-for-pixel — only the positioning primitive changed.
 */
const MOSAIC_GAP_PX = 10;
const MOSAIC_COL_A_WIDTH = `calc((100% - ${MOSAIC_GAP_PX * 2}px) * 0.28)`;
const MOSAIC_COL_B_WIDTH = `calc((100% - ${MOSAIC_GAP_PX * 2}px) * 0.36)`;
const MOSAIC_COL_C_WIDTH = `calc((100% - ${MOSAIC_GAP_PX * 2}px) * 0.28)`;
const MOSAIC_COL_B_LEFT = `calc((100% - ${MOSAIC_GAP_PX * 2}px) * 0.28 + ${MOSAIC_GAP_PX}px)`;

/**
 * Cinematic editorial hero — magazine cover for the catalog.
 *
 * Layout (desktop ≥ 1024 px):
 *   - Right 62%: 3-column drifting mosaic (12 tiles total).
 *   - Cream-to-transparent fade veils the left edge of the mosaic so the
 *     headline reads against a calm paper field.
 *   - Left ~38%: kicker rule + huge Fraunces headline ("Encuentra a / *tu
 *     Biringa* / ideal." with a skewed gold highlighter on "ideal.").
 *   - Sub-paragraph (Newsreader serif), live counters with separators,
 *     pill-shaped search bar, "Sugerido" chips, two-layer-verification
 *     trust block.
 *   - Bottom: edge-to-edge ticker marquee.
 *
 * Mobile (< 1024 px): mosaic moves below the copy as a horizontal snap
 * carousel (see `responsive/routes/home.md`).
 */
export async function EditorialHero({
  location = "Acompañantes verificadas · Colombia",
}: Readonly<EditorialHeroProps>) {
  // Auxiliary content — degrade to empty on failure so the hero copy + CTA
  // still render. Common failure mode in early production: Firestore
  // composite indexes from `firestore.indexes.json` not yet deployed, so
  // the first read throws FAILED_PRECONDITION. The page should not 500.
  const mosaic = await listHeroMosaic(MOSAIC_TOTAL_TILES).catch((err) => {
    console.error("[home] listHeroMosaic failed", err);
    return [] as Awaited<ReturnType<typeof listHeroMosaic>>;
  });

  const colA = mosaic.slice(MOSAIC_COL_A_START, MOSAIC_COL_A_END);
  const colB = mosaic.slice(MOSAIC_COL_B_START, MOSAIC_COL_B_END);
  const colC = mosaic.slice(MOSAIC_COL_C_START, MOSAIC_COL_C_END);

  return (
    <section
      data-testid="editorial-hero"
      aria-labelledby="editorial-hero-title"
      className="relative isolate overflow-hidden border-b border-[var(--color-line-soft)] bg-[var(--color-cream)] text-[var(--color-ink)] lg:min-h-[720px]"
    >
      {/* Aurora — three soft radial blooms layered behind the cream paper,
          each drifting on its own clock so the field never repeats. Sits
          below the mosaic so the photography remains the focal point. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 motion-safe:motion-aurora"
        style={{
          background:
            "radial-gradient(60% 50% at 18% 30%, rgba(31,61,46,0.10), transparent 70%), radial-gradient(45% 40% at 80% 12%, rgba(200,166,118,0.14), transparent 65%), radial-gradient(50% 45% at 55% 85%, rgba(124,90,78,0.10), transparent 70%)",
        }}
      />
      {/* Second aurora layer drifts on a different timeline */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 motion-safe:motion-aurora"
        style={{
          animationDelay: "-14s",
          animationDuration: "36s",
          background:
            "radial-gradient(35% 30% at 12% 75%, rgba(200,166,118,0.08), transparent 70%), radial-gradient(40% 35% at 88% 65%, rgba(31,61,46,0.08), transparent 70%)",
        }}
      />

      {/* Mosaic — desktop only, absolutely placed on the right.
          `pointer-events-none` removed so each tile's `Link` is clickable;
          the column wrappers and their backdrops still pass clicks through
          via per-element rules where needed. */}
      <div
        data-testid="editorial-hero-mosaic-desktop"
        aria-hidden="false"
        className="absolute inset-y-0 right-0 hidden w-[62%] lg:block"
      >
        <EditorialHeroMosaicColumn
          tiles={colA}
          heights={TILE_HEIGHTS_A}
          drift="up"
          top={-40}
          position={{ left: 0, width: MOSAIC_COL_A_WIDTH }}
          slideRange={28}
          slideDuration={14}
          slideDelay={0}
          testIdSuffix="a"
        />
        <EditorialHeroMosaicColumn
          tiles={colB}
          heights={TILE_HEIGHTS_B}
          drift="down"
          top={60}
          position={{ left: MOSAIC_COL_B_LEFT, width: MOSAIC_COL_B_WIDTH }}
          slideRange={-24}
          slideDuration={18}
          slideDelay={1.5}
          testIdSuffix="b"
        />
        <EditorialHeroMosaicColumn
          tiles={colC}
          heights={TILE_HEIGHTS_C}
          drift="up"
          top={-20}
          position={{ right: 0, width: MOSAIC_COL_C_WIDTH }}
          slideRange={20}
          slideDuration={12}
          slideDelay={2.8}
          testIdSuffix="c"
        />
      </div>

      {/* Left fade veil — softens the mosaic into the cream paper. Pushed
          wider + deeper opacity at the left third so the headline text always
          reads against calm paper, not faces drifting through it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-[26%] z-[2] hidden w-[42%] lg:block"
        style={{
          background:
            "linear-gradient(90deg, var(--color-cream) 0%, var(--color-cream) 22%, rgba(242,235,220,0.92) 55%, rgba(242,235,220,0) 100%)",
        }}
      />
      {/* Secondary cream wash directly behind the headline column — pulls
          the mosaic visually further away so faces stay in the background. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-[2] hidden w-[40%] bg-[var(--color-cream)]/70 backdrop-blur-[2px] lg:block"
      />
      {/* Top fade — bleed the mosaic into the page top */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 z-[2] hidden h-20 lg:left-[38%] lg:block"
        style={{
          background:
            "linear-gradient(180deg, var(--color-cream), transparent)",
        }}
      />
      {/* Bottom fade — bleed the mosaic into the marquee */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 z-[2] hidden h-32 lg:left-[38%] lg:block"
        style={{
          background:
            "linear-gradient(0deg, var(--color-cream), transparent)",
        }}
      />

      {/* Content column */}
      <div
        data-testid="editorial-hero-content"
        className="relative z-[5] mx-auto w-full max-w-[1440px] px-5 pb-16 pt-12 sm:px-9 sm:pb-20 sm:pt-20 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-15 lg:pt-[70px]"
      >
        <div data-testid="editorial-hero-copy" className="max-w-[600px]">
          <div
            data-testid="editorial-hero-kicker"
            className="motion-safe:motion-hero-reveal"
            style={{ animationDelay: "0.05s" }}
          >
            <div className="inline-flex items-center gap-3.5">
              <span
                aria-hidden
                className="h-px w-8 bg-gradient-to-r from-transparent via-[var(--color-ink-soft)] to-[var(--color-gold)] opacity-70"
              />
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--color-gold)] shadow-[0_0_0_3px_rgba(200,166,118,0.18)]"
              />
              <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-ink-soft)]">
                {location}
              </span>
            </div>
          </div>

          <h1
            data-testid="editorial-hero-title"
            id="editorial-hero-title"
            className="motion-safe:motion-hero-reveal mt-6 font-[var(--font-display)] font-[360] tracking-[-0.035em] text-[var(--color-ink)]"
            style={{
              animationDelay: "0.15s",
              fontSize: "clamp(48px, 7vw, 96px)",
              lineHeight: 0.96,
            }}
          >
            Encuentra a
            <br />
            <span className="relative inline-block">
              <UnderlineSweep
                delay={0.4}
                className="bottom-3 -right-2 left-0 -z-10 h-3 -skew-x-12 bg-[var(--color-gold)] opacity-30"
              />
              {/* Gold sheen swept through Fraunces italic — the headline's
                  signature moment. Falls back to flat ink at SSR and for
                  reduced-motion users (utility resets text-fill there). */}
              <span className="font-[var(--font-display)] italic font-[320] motion-safe:motion-gold-sheen">
                tu Biringa
              </span>
            </span>
            <br />
            <span className="relative inline-block">
              <UnderlineSweep
                delay={0.55}
                className="bottom-2 -right-1.5 left-0 -z-10 h-2 -skew-x-12 bg-[var(--color-gold)] opacity-55"
              />
              <span>ideal.</span>
              {/* Period flourish — a tiny gold diamond hangs off the end of
                  the headline. Editorial finishing touch. */}
              <span
                aria-hidden
                className="ml-3 inline-block h-2 w-2 rotate-45 align-middle bg-[var(--color-gold)] shadow-[0_0_0_4px_rgba(200,166,118,0.18)]"
              />
            </span>
          </h1>

          <p
            data-testid="editorial-hero-description"
            className="motion-safe:motion-hero-reveal mt-7 max-w-[480px] font-[var(--font-serif)] text-[18.5px] leading-[1.5] text-[var(--color-ink-soft)]"
            style={{ animationDelay: "0.25s" }}
          >
            Perfiles auténticos, encuentros con cabeza. Filtra por ciudad,
            plan y disponibilidad — la actividad reciente queda primero.{" "}
            <em>Sin algoritmos turbios.</em>
          </p>

          {/* Stat tiles — three discrete vertical cells separated by hairlines.
              Each tile reads "icon · big number · small label" so the user
              scans counts before reading meaning. Reference design pattern. */}
          <div
            data-testid="editorial-hero-stats"
            className="motion-safe:motion-hero-reveal mt-9 inline-flex flex-wrap items-stretch gap-x-6 gap-y-4 sm:gap-x-7"
            style={{ animationDelay: "0.35s" }}
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="relative inline-flex h-2.5 w-2.5 items-center justify-center"
              >
                <span className="absolute inset-0 rounded-full bg-[#4D9B6E] opacity-60 motion-safe:motion-pulse-ring" />
                <span className="relative inline-block h-2.5 w-2.5 rounded-full bg-[#4D9B6E] motion-safe:motion-hero-pulse" />
              </span>
              <span className="flex flex-col leading-tight">
                <strong className="text-[22px] font-[var(--font-display)] font-[480] tabular-nums tracking-tight text-[var(--color-ink)]">
                  <CountUp to={38} />
                </strong>
                <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
                  en línea ahora
                </span>
              </span>
            </div>

            <span
              aria-hidden
              className="hidden self-stretch w-px bg-gradient-to-b from-transparent via-[var(--color-line)] to-transparent sm:block"
            />

            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-forest)]/10 ring-1 ring-[var(--color-forest)]/20"
              >
                <ShieldCheck
                  className="h-4 w-4 text-[var(--color-forest)]"
                  aria-hidden
                />
              </span>
              <span className="flex flex-col leading-tight">
                <strong className="text-[22px] font-[var(--font-display)] font-[480] tabular-nums tracking-tight text-[var(--color-ink)]">
                  <CountUp to={247} duration={1.6} />
                </strong>
                <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
                  verificadas activas
                </span>
              </span>
            </div>

            <span
              aria-hidden
              className="hidden self-stretch w-px bg-gradient-to-b from-transparent via-[var(--color-line)] to-transparent sm:block"
            />

            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-gold)]/15 ring-1 ring-[var(--color-gold)]/25"
              >
                <MapPin
                  className="h-4 w-4 text-[var(--color-gold-deep)]"
                  aria-hidden
                />
              </span>
              <span className="flex flex-col leading-tight">
                <strong className="text-[22px] font-[var(--font-display)] font-[480] tabular-nums tracking-tight text-[var(--color-ink)]">
                  6
                </strong>
                <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
                  ciudades
                </span>
              </span>
            </div>
          </div>

          <div
            data-testid="editorial-hero-search"
            className="motion-safe:motion-hero-reveal mt-10"
            style={{ animationDelay: "0.45s" }}
          >
            <form
              data-testid="editorial-hero-search-form"
              action="/explorar"
              method="get"
              className="group/search flex max-w-[600px] flex-col items-stretch gap-1.5 rounded-[var(--radius-2xl)] border border-[var(--color-line)] bg-[var(--color-cream-soft)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_18px_48px_-12px_rgba(31,61,46,0.18),0_8px_22px_-10px_rgba(31,61,46,0.08)] transition-[border-color,box-shadow,transform] duration-300 ease-[var(--ease-standard)] hover:-translate-y-[1px] focus-within:border-[var(--color-forest)] focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_22px_56px_-12px_rgba(31,61,46,0.26),0_10px_24px_-10px_rgba(31,61,46,0.14)] md:flex-row md:gap-0 md:rounded-full md:p-1.5"
              role="search"
              aria-label="Buscar Biringas"
            >
              <label className="group/city relative block cursor-pointer rounded-[var(--radius-xl)] px-4 py-2 transition-colors duration-200 hover:bg-[var(--color-cream)]/40 focus-within:bg-[var(--color-cream)]/40 md:flex-[0_0_38%] md:rounded-none md:border-r md:border-[var(--color-line-soft)] md:px-5 md:py-2.5">
                <span className="block text-[9.5px] uppercase tracking-[0.16em] text-[var(--color-ink-soft)] opacity-80">
                  Ciudad
                </span>
                {/* Native select rendered visibly — appearance-none strips
                    the default arrow and we draw our own chevron, but the
                    selected option text *does* render so the value the user
                    picks is always reflected. Was previously overlaid as
                    `sr-only` (collapsed to 1×1 px), which made the dropdown
                    anchor wrong on desktop and never showed the new value. */}
                <div className="mt-0.5 relative flex items-center gap-1.5">
                  <select
                    data-testid="editorial-hero-search-city"
                    name="city"
                    className="w-full cursor-pointer appearance-none bg-transparent pr-5 text-sm font-medium text-[var(--color-ink)] focus:outline-none"
                    aria-label="Ciudad"
                    defaultValue=""
                  >
                    <option value="">Toda Colombia</option>
                    <option value="Bogotá">Bogotá</option>
                    <option value="Medellín">Medellín</option>
                    <option value="Cartagena">Cartagena</option>
                    <option value="Cali">Cali</option>
                    <option value="Barranquilla">Barranquilla</option>
                    <option value="Bucaramanga">Bucaramanga</option>
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-0 h-3 w-3 text-[var(--color-ink-soft)] transition-transform duration-300 ease-[var(--ease-standard)] group-hover/city:rotate-180 group-focus-within/city:rotate-180"
                    aria-hidden
                  />
                </div>
              </label>
              <label className="block flex-1 px-4 py-2.5">
                <span className="block text-[9.5px] uppercase tracking-[0.16em] text-[var(--color-ink-soft)] opacity-80">
                  Buscar
                </span>
                <input
                  data-testid="editorial-hero-search-input"
                  type="text"
                  name="q"
                  placeholder="Nombre, plan, servicio…"
                  className="mt-0.5 w-full bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] focus:outline-none"
                />
              </label>
              <button
                data-testid="editorial-hero-search-submit"
                type="submit"
                className="group/submit relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-full bg-[var(--color-forest)] px-6 text-[13.5px] font-medium text-[var(--color-cream)] transition-colors duration-200 hover:bg-[var(--color-forest-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-cream)] md:h-auto"
              >
                {/* Gold shimmer sweep — only fires on hover, reuses the
                    existing motion-shimmer-sweep keyframe. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 -left-1/3 block w-1/3 bg-gradient-to-r from-transparent via-[rgba(200,166,118,0.55)] to-transparent opacity-0 group-hover/submit:opacity-100 motion-safe:group-hover/submit:motion-shimmer-sweep"
                />
                <Search className="relative h-3.5 w-3.5" aria-hidden />
                <span className="relative">Buscar</span>
              </button>
            </form>

            <div
              data-testid="editorial-hero-suggested"
              className="mt-3.5 flex flex-wrap items-center gap-2"
            >
              <span className="mr-1 text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
                Sugerido
              </span>
              {SUGGESTED.map((chip) => {
                const isLive = chip.kind === "live";
                const isDigital = chip.kind === "digital";
                const Icon = SUGGESTED_ICON[chip.kind];
                // Live → forest-filled CTA pill. Digital → outline pill
                // (signals "remote, ethereal"). Location/quality → solid
                // bone pill with a small leading icon. The taxonomy lets
                // users F-scan: shape + colour says category before they
                // read the label.
                const cls = isLive
                  ? "inline-flex items-center gap-1.5 rounded-full bg-[var(--color-forest)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-cream)] shadow-[0_4px_14px_-4px_rgba(31,61,46,0.45)] transition-[background,box-shadow,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-forest-deep)] hover:shadow-[0_8px_22px_-6px_rgba(31,61,46,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-cream)]"
                  : isDigital
                  ? "inline-flex items-center gap-1.5 rounded-full border border-dashed border-[var(--color-forest)]/45 bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--color-forest)] transition-[background,border-color,color,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:border-[var(--color-forest)] hover:bg-[var(--color-forest)]/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-cream)]"
                  : "inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-cream-soft)]/70 px-3 py-1.5 text-xs text-[var(--color-ink)] transition-[background,border-color,color,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-cream)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-cream)]";
                return (
                  <Link
                    key={chip.label}
                    data-testid={`editorial-hero-suggested-${chip.label.toLowerCase().replace(/\s+/g, "-")}`}
                    href={chip.href}
                    className={cls}
                  >
                    {isLive ? (
                      <span
                        aria-hidden
                        className="relative inline-flex h-1.5 w-1.5 items-center justify-center"
                      >
                        <span className="absolute inset-0 rounded-full bg-[#A8E6BA] opacity-70 motion-safe:motion-pulse-ring" />
                        <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-[#A8E6BA] motion-safe:motion-hero-pulse" />
                      </span>
                    ) : Icon ? (
                      <Icon className="h-3 w-3" aria-hidden />
                    ) : null}
                    {chip.label}
                  </Link>
                );
              })}
            </div>

            {/* Trust pills — three-up proof line, anchors "sin algoritmos
                turbios" with concrete claims. Sits below the suggested
                chips, above the detailed verification block. */}
            <ul
              data-testid="editorial-hero-trust-pills"
              className="motion-safe:motion-hero-reveal mt-5 flex flex-wrap items-center gap-1.5 text-[11.5px] sm:gap-2"
              style={{ animationDelay: "0.55s" }}
              aria-label="Garantías del marketplace"
            >
              <li className="group/pill inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-cream-soft)]/60 px-3 py-1.5 text-[var(--color-ink-soft)] transition-[background,border-color,color,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:border-[var(--color-forest)]/40 hover:bg-[var(--color-cream)] hover:text-[var(--color-ink)]">
                <UserCheck
                  className="h-3.5 w-3.5 text-[var(--color-forest)]"
                  aria-hidden
                />
                Verificación humana
              </li>
              <li className="group/pill inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-cream-soft)]/60 px-3 py-1.5 text-[var(--color-ink-soft)] transition-[background,border-color,color,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:border-[var(--color-forest)]/40 hover:bg-[var(--color-cream)] hover:text-[var(--color-ink)]">
                <Lock
                  className="h-3.5 w-3.5 text-[var(--color-forest)]"
                  aria-hidden
                />
                Pago discreto
              </li>
              <li className="group/pill inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-cream-soft)]/60 px-3 py-1.5 text-[var(--color-ink-soft)] transition-[background,border-color,color,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:border-[var(--color-forest)]/40 hover:bg-[var(--color-cream)] hover:text-[var(--color-ink)]">
                <BotOff
                  className="h-3.5 w-3.5 text-[var(--color-forest)]"
                  aria-hidden
                />
                Sin bots ni catfish
              </li>
            </ul>
          </div>

          {/* Trust card — verification as the hero's primary value prop.
              Layout matches the reference: avatar bubble stack on the left
              (with shield-check nested on the front bubble), copy block in
              the middle, and a large gold-shield disc on the right that
              visually anchors the "official" stamp. */}
          <div
            data-testid="editorial-hero-trust"
            className="group/trust motion-safe:motion-hero-reveal relative mt-11 flex items-center gap-4 overflow-hidden rounded-2xl border border-[var(--color-line-soft)] bg-[var(--color-cream-soft)]/70 p-4 transition-[border-color,box-shadow,transform] duration-300 ease-[var(--ease-standard)] hover:-translate-y-[2px] hover:border-[var(--color-gold)]/40 hover:shadow-[0_18px_40px_-22px_rgba(20,28,24,0.25)] sm:gap-6 sm:p-5"
            style={{ animationDelay: "0.6s" }}
          >
            {/* Decorative gold corner brackets — drawn in only on hover. */}
            <span
              aria-hidden
              className="pointer-events-none absolute left-2 top-2 h-3 w-3 origin-top-left scale-0 border-l border-t border-[var(--color-gold)] opacity-0 transition-[opacity,transform] duration-300 ease-[var(--ease-standard)] group-hover/trust:scale-100 group-hover/trust:opacity-80"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute right-2 top-2 h-3 w-3 origin-top-right scale-0 border-r border-t border-[var(--color-gold)] opacity-0 transition-[opacity,transform] duration-300 ease-[var(--ease-standard)] group-hover/trust:scale-100 group-hover/trust:opacity-80"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 origin-bottom-left scale-0 border-b border-l border-[var(--color-gold)] opacity-0 transition-[opacity,transform] duration-300 ease-[var(--ease-standard)] group-hover/trust:scale-100 group-hover/trust:opacity-80"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 origin-bottom-right scale-0 border-b border-r border-[var(--color-gold)] opacity-0 transition-[opacity,transform] duration-300 ease-[var(--ease-standard)] group-hover/trust:scale-100 group-hover/trust:opacity-80"
            />

            <div className="relative flex shrink-0 items-center">
              {mosaic.slice(0, 4).map((listing, i) => (
                <span
                  key={listing.id}
                  aria-hidden
                  className="relative block h-12 w-12 overflow-hidden rounded-full border-[3px] border-[var(--color-cream)] shadow-[0_2px_6px_rgba(31,61,46,0.18)] transition-transform duration-300 ease-[var(--ease-standard)] group-hover/trust:translate-x-[2px] md:h-14 md:w-14"
                  style={{
                    marginLeft: i === 0 ? 0 : -14,
                    transitionDelay: `${i * 35}ms`,
                    zIndex: 4 - i,
                  }}
                >
                  <Image
                    src={listing.mainImage}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </span>
              ))}
              {mosaic.length === 0 &&
                ["#3B342B", "#1F3D2E", "#C8A676", "#C9837A"].map((bg, i) => (
                  <span
                    key={bg}
                    aria-hidden
                    className="block h-12 w-12 rounded-full border-[3px] border-[var(--color-cream)] shadow-[0_2px_6px_rgba(31,61,46,0.18)] md:h-14 md:w-14"
                    style={{
                      background: bg,
                      marginLeft: i === 0 ? 0 : -14,
                    }}
                  />
                ))}
              <span
                aria-label="Verificada"
                className="absolute -bottom-1 right-0 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-forest)] text-[var(--color-cream)] shadow-[0_4px_10px_-2px_rgba(31,61,46,0.55)] ring-2 ring-[var(--color-cream)]"
                style={{ zIndex: 10 }}
              >
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>

            <p className="min-w-0 flex-1 font-[var(--font-serif)] text-[13.5px] leading-[1.45] text-[var(--color-ink-soft)] md:text-[15px]">
              <strong className="block font-semibold text-[var(--color-ink)] md:text-[17px]">
                Verificación en 2 capas
              </strong>
              <span className="mt-1 block">
                Documento oficial + selfie en vivo.
              </span>
              <span className="mt-0.5 block italic text-[var(--color-text-muted)]">
                Perfiles reales para conexiones reales.
              </span>
            </p>

            {/* Gold-shield disc on the right — the "official seal" cue
                from the reference. Hidden below `md:` (768px) since on
                a 390-class viewport the avatar stack + text already fills
                the row; squeezing in the disc compresses the type into
                vertical word-per-line wrap. */}
            <span
              aria-hidden
              className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-gold)]/20 via-[var(--color-gold)]/10 to-[var(--color-cream)] text-[var(--color-gold-deep)] ring-1 ring-[var(--color-gold)]/35 shadow-[0_8px_22px_-10px_rgba(200,166,118,0.55)] md:inline-flex"
            >
              <ShieldCheck className="h-6 w-6" aria-hidden />
            </span>
          </div>

          {/* Bottom trust strip — matches the reference's footer row of
              guarantees beneath the verification card. */}
          <ul
            data-testid="editorial-hero-trust-strip"
            className="motion-safe:motion-hero-reveal mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-[var(--color-ink-soft)]"
            style={{ animationDelay: "0.65s" }}
            aria-label="Garantías"
          >
            <li className="inline-flex items-center gap-1.5">
              <ShieldCheck
                className="h-3.5 w-3.5 text-[var(--color-forest)]"
                aria-hidden
              />
              Privacidad garantizada
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Lock
                className="h-3.5 w-3.5 text-[var(--color-forest)]"
                aria-hidden
              />
              Pago 100% discreto
            </li>
            <li className="inline-flex items-center gap-1.5">
              <UserCheck
                className="h-3.5 w-3.5 text-[var(--color-forest)]"
                aria-hidden
              />
              Perfiles verificados
            </li>
          </ul>
        </div>
        <div aria-hidden />
      </div>

      {/* Mobile / tablet — horizontal snap carousel below the copy */}
      <div
        data-testid="editorial-hero-mosaic-mobile"
        className="relative z-[5] mb-4 lg:hidden"
      >
        <div
          data-testid="editorial-hero-mosaic-mobile-track"
          className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Selección editorial de Biringas"
        >
          {mosaic.map((listing, idx) => (
            <div
              key={listing.id}
              className="snap-start shrink-0 basis-[68%] sm:basis-[44%]"
            >
              <HeroMosaicCard
                listing={listing}
                height={idx === 0 ? 360 : 320}
                drift={idx % 2 === 0 ? "up" : "down"}
                delay={`${idx * 0.3}s`}
                duration={`${14 + idx}s`}
                hideLive={idx % 2 === 1}
                priority={idx === 0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom marquee — auto-drifting on rest, but city entries are real
          anchors so clicking "Bogotá · 142 activas" auto-filters the catalog.
          The marquee pauses on hover so users can read + click without the
          tape sliding the target out from under them. */}
      <div
        data-testid="editorial-hero-marquee"
        className="group/marquee relative z-[6] overflow-hidden border-y border-[var(--color-line)] bg-[var(--color-cream)] py-4"
      >
        <div
          className="flex w-[200%] gap-15 whitespace-nowrap motion-safe:motion-hero-marquee group-hover/marquee:[animation-play-state:paused]"
        >
          {[0, 1].map((dup) =>
            MARQUEE_ITEMS.map((item) => {
              const inner = (
                <>
                  {item.label}
                  <span
                    aria-hidden
                    className="block h-1.5 w-1.5 rotate-45 bg-[var(--color-gold)] shadow-[0_0_0_2px_rgba(200,166,118,0.18)]"
                  />
                </>
              );
              const cls =
                "inline-flex items-center gap-3.5 text-xs uppercase tracking-[0.18em] text-[var(--color-ink-soft)]";
              return item.href ? (
                <Link
                  key={`${dup}-${item.label}`}
                  href={item.href}
                  className={`${cls} transition-colors duration-200 ease-[var(--ease-standard)] hover:text-[var(--color-forest)]`}
                  aria-label={`Ver ${item.label}`}
                >
                  {inner}
                </Link>
              ) : (
                <span key={`${dup}-${item.label}`} className={cls} aria-hidden>
                  {inner}
                </span>
              );
            }),
          )}
        </div>
      </div>
    </section>
  );
}
