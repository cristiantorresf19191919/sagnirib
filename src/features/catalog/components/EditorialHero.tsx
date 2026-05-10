import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";

import { listHeroMosaic } from "@/server/biringas";

import { EditorialHeroMosaicColumn } from "./EditorialHeroMosaicColumn";
import { HeroMosaicCard } from "./HeroMosaicCard";

interface EditorialHeroProps {
  /** Optional location label rendered as the kicker. */
  location?: string;
}

const SUGGESTED = [
  { label: "Disponibles ahora", href: "/?available=1" },
  { label: "Cena Bogotá", href: "/?city=Bogot%C3%A1" },
  { label: "Fin de semana Cartagena", href: "/?city=Cartagena" },
  { label: "Videollamada", href: "/?category=videollamadas" },
  { label: "Top rated", href: "/?sort=rating" },
] as const;

const MARQUEE_ITEMS = [
  "Bogotá · 142 activas",
  "Medellín · 88 activas",
  "Cartagena · 41 activas",
  "Cali · 37 activas",
  "Verificación en vivo",
  "Reseñas reales",
  "Sin bots, sin catfish",
  "Pago discreto disponible",
  "Barranquilla · 24 activas",
  "Videollamada disponible",
] as const;

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
  const mosaic = await listHeroMosaic(MOSAIC_TOTAL_TILES);

  const colA = mosaic.slice(MOSAIC_COL_A_START, MOSAIC_COL_A_END);
  const colB = mosaic.slice(MOSAIC_COL_B_START, MOSAIC_COL_B_END);
  const colC = mosaic.slice(MOSAIC_COL_C_START, MOSAIC_COL_C_END);

  return (
    <section
      data-testid="editorial-hero"
      aria-labelledby="editorial-hero-title"
      className="relative isolate overflow-hidden border-b border-[var(--color-line-soft)] bg-[var(--color-cream)] text-[var(--color-ink)]"
      style={{ minHeight: 720 }}
    >
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

      {/* Left fade veil — softens the mosaic into the cream paper */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-[32%] z-[2] hidden w-[32%] lg:block"
        style={{
          background:
            "linear-gradient(90deg, var(--color-cream) 0%, rgba(242,235,220,0.95) 30%, rgba(242,235,220,0) 100%)",
        }}
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
        className="relative z-[5] mx-auto w-full max-w-[1440px] px-6 pb-20 pt-16 sm:px-9 sm:pt-20 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-15 lg:pt-[70px]"
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
                className="h-px w-8 bg-[var(--color-ink-soft)] opacity-50"
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
            <span className="font-[var(--font-display)] italic font-[320]">
              tu Biringa
            </span>
            <br />
            <span className="relative inline-block">
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-2 -right-1.5 left-0 -z-10 h-2 -skew-x-12 bg-[var(--color-gold)] opacity-55"
              />
              <span>ideal.</span>
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

          <div
            data-testid="editorial-hero-stats"
            className="motion-safe:motion-hero-reveal mt-9 flex flex-wrap items-center gap-x-7 gap-y-3"
            style={{ animationDelay: "0.35s" }}
          >
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="h-2 w-2 rounded-full bg-[#4D9B6E] motion-safe:motion-hero-pulse"
              />
              <span className="text-[13px] text-[var(--color-ink)]">
                <strong className="font-semibold">38</strong>
                <span className="text-[var(--color-ink-soft)]">
                  {" "}
                  en línea ahora
                </span>
              </span>
            </div>
            <span aria-hidden className="h-4 w-px bg-[var(--color-line)]" />
            <span className="text-[13px] text-[var(--color-ink-soft)]">
              <strong className="font-semibold text-[var(--color-ink)]">
                247
              </strong>{" "}
              verificadas activas
            </span>
            <span aria-hidden className="h-4 w-px bg-[var(--color-line)]" />
            <span className="text-[13px] text-[var(--color-ink-soft)]">
              <strong className="font-semibold text-[var(--color-ink)]">
                6
              </strong>{" "}
              ciudades
            </span>
          </div>

          <div
            data-testid="editorial-hero-search"
            className="motion-safe:motion-hero-reveal mt-10"
            style={{ animationDelay: "0.45s" }}
          >
            <form
              data-testid="editorial-hero-search-form"
              action="/"
              method="get"
              className="flex max-w-[600px] items-stretch rounded-full border border-[var(--color-line)] bg-[var(--color-cream-soft)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_8px_30px_rgba(31,61,46,0.08)]"
              role="search"
              aria-label="Buscar Biringas"
            >
              <label className="block flex-[0_0_38%] cursor-pointer border-r border-[var(--color-line-soft)] px-5 py-2.5">
                <span className="block text-[9.5px] uppercase tracking-[0.16em] text-[var(--color-ink-soft)] opacity-80">
                  Ciudad
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-[var(--color-ink)]">
                  Toda Colombia
                  <ChevronDown className="h-3 w-3" aria-hidden />
                </span>
                <select
                  data-testid="editorial-hero-search-city"
                  name="city"
                  className="sr-only"
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
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-forest)] px-6 text-[13.5px] font-medium text-[var(--color-cream)] transition-colors duration-200 hover:bg-[var(--color-forest-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-cream)]"
              >
                <Search className="h-3.5 w-3.5" aria-hidden />
                Buscar
              </button>
            </form>

            <div
              data-testid="editorial-hero-suggested"
              className="mt-3.5 flex flex-wrap items-center gap-2"
            >
              <span className="mr-1 text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
                Sugerido
              </span>
              {SUGGESTED.map((chip) => (
                <Link
                  key={chip.label}
                  data-testid={`editorial-hero-suggested-${chip.label.toLowerCase().replace(/\s+/g, "-")}`}
                  href={chip.href}
                  className="rounded-full border border-[var(--color-line)] bg-transparent px-3 py-1.5 text-xs text-[var(--color-ink)] transition-colors duration-200 hover:border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-cream)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-cream)]"
                >
                  {chip.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Trust block — promoted in this iteration so verification reads
              as the hero's primary value prop. Avatars 2x larger, headline
              bumped, sub-copy spans wider. Sits inside a soft cream-tinted
              card so it reads as a discrete editorial unit. */}
          <div
            data-testid="editorial-hero-trust"
            className="motion-safe:motion-hero-reveal mt-11 flex items-center gap-5 rounded-2xl border border-[var(--color-line-soft)] bg-[var(--color-cream-soft)]/70 p-4 sm:gap-6 sm:p-5"
            style={{ animationDelay: "0.6s" }}
          >
            <div className="flex items-center">
              {[
                "#3B342B",
                "#1F3D2E",
                "#C8A676",
                "#C9837A",
              ].map((bg, i) => (
                <span
                  key={bg}
                  aria-hidden
                  className="block h-14 w-14 rounded-full border-[3px] border-[var(--color-cream)] shadow-[0_2px_6px_rgba(31,61,46,0.18)]"
                  style={{
                    background: bg,
                    marginLeft: i === 0 ? 0 : -16,
                  }}
                />
              ))}
            </div>
            <p className="font-[var(--font-serif)] text-[14px] leading-[1.45] text-[var(--color-ink-soft)] sm:text-[15.5px]">
              <strong className="block font-semibold text-[var(--color-ink)] sm:text-[17px]">
                Verificación en 2 capas
              </strong>
              <span className="mt-0.5 block">
                Documento + selfie en vivo. Sin catfish, sin sorpresas.
              </span>
            </p>
          </div>
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

      {/* Bottom marquee */}
      <div
        data-testid="editorial-hero-marquee"
        className="relative z-[6] overflow-hidden border-y border-[var(--color-line)] bg-[var(--color-cream)] py-4"
      >
        <div
          className="flex w-[200%] gap-15 whitespace-nowrap motion-safe:motion-hero-marquee"
          aria-hidden
        >
          {[0, 1].map((dup) =>
            MARQUEE_ITEMS.map((item) => (
              <span
                key={`${dup}-${item}`}
                className="inline-flex items-center gap-3.5 text-xs uppercase tracking-[0.18em] text-[var(--color-ink-soft)]"
              >
                {item}
                <span
                  aria-hidden
                  className="block h-1 w-1 rounded-full bg-[var(--color-gold)]"
                />
              </span>
            )),
          )}
        </div>
      </div>
    </section>
  );
}
