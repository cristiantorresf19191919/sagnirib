import Link from "next/link";
import { Search } from "lucide-react";

import { readLocale } from "@/core/i18n/locale";
import { t } from "@/core/i18n/messages";
import { listHeroMosaic } from "@/server/biringas";
import { CountUp } from "@/shared/motion/CountUp";
import { UnderlineSweep } from "@/shared/motion/UnderlineSweep";

import { EditorialHeroMosaicColumn } from "./EditorialHeroMosaicColumn";
import { HeroCitySelect } from "./HeroCitySelect";
import { HeroMosaicCard } from "./HeroMosaicCard";
import { LuckyButton } from "./LuckyButton";

function buildHeroCities(allLabel: string) {
  return [
    { value: "", label: allLabel },
    { value: "Bogotá", label: "Bogotá" },
    { value: "Medellín", label: "Medellín" },
    { value: "Cartagena", label: "Cartagena" },
    { value: "Cali", label: "Cali" },
    { value: "Barranquilla", label: "Barranquilla" },
    { value: "Bucaramanga", label: "Bucaramanga" },
  ] as const;
}

interface EditorialHeroProps {
  /** Optional location label rendered as the kicker. */
  location?: string;
}

const CHIP_KEYS = [
  { i18nKey: "hero.chip.availableNow", href: "/explorar?available=1" },
  { i18nKey: "hero.chip.dinnerBogota", href: "/explorar?city=Bogot%C3%A1" },
  {
    i18nKey: "hero.chip.weekendCartagena",
    href: "/explorar?city=Cartagena",
  },
  { i18nKey: "hero.chip.topRated", href: "/explorar?sort=rating" },
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
 * Cinematic editorial hero — magazine cover for the catalog (V5 layout).
 *
 * Copy column (left, V5 structure):
 *   - Vertical gold rail (desktop only) with rotated brand line + diamond.
 *   - Top row: hairline + diamond + uppercase kicker on the left, live
 *     pulse dot + "N en línea" on the right.
 *   - Three-line headline: "Encuentra a / *tu Biringa* / ideal."
 *     — italic gold with a swept gold underline on the middle line,
 *     forest-colored period flourish on the last.
 *   - Stats one-liner with two strong numbers (247 verificadas, 6 ciudades)
 *     and an italic Fraunces phrase "Sin algoritmos turbios."
 *   - Spacer (desktop) → pushes chips + search + trust to the lower half.
 *   - Four text-only chips. First chip is the active/highlight action.
 *   - Search pill: HeroCitySelect (Ciudad) · italic input · forest Buscar.
 *   - Trust microline: three plain labels separated by gold diamonds.
 *
 * Mosaic column (right): 3-track cinema-reel of listing tiles on desktop;
 * horizontal snap carousel below the copy on mobile.
 *
 * Theme: uses cream/ink/forest/gold tokens which auto-flip in dark mode
 * (cream becomes candle-dark, forest becomes mint, etc.). V5's dark
 * mockup falls out naturally under `[data-theme="dark"]`.
 */
export async function EditorialHero({
  location,
}: Readonly<EditorialHeroProps>) {
  const localePromise = readLocale();
  // Degrade to empty on failure so the hero copy + CTA still render — common
  // failure mode is Firestore composite indexes not yet deployed.
  const mosaic = await listHeroMosaic(MOSAIC_TOTAL_TILES).catch((err) => {
    console.error("[home] listHeroMosaic failed", err);
    return [] as Awaited<ReturnType<typeof listHeroMosaic>>;
  });
  const locale = await localePromise;
  // Allow callers to override the kicker via prop; otherwise fall back
  // to the localized default. Keeps existing callsites that pass an
  // explicit location working unchanged.
  const kickerLabel = location ?? t(locale, "hero.kicker.location");
  const heroCities = buildHeroCities(t(locale, "hero.field.cityAll"));
  const chips = CHIP_KEYS.map((chip) => ({
    href: chip.href,
    label: t(locale, chip.i18nKey),
  }));
  const marqueeItems: ReadonlyArray<{ label: string; href?: string }> = [
    {
      label: t(locale, "hero.marquee.activeIn", {
        city: "Bogotá",
        count: 142,
      }),
      href: "/explorar?city=Bogot%C3%A1",
    },
    {
      label: t(locale, "hero.marquee.activeIn", {
        city: "Medellín",
        count: 88,
      }),
      href: "/explorar?city=Medell%C3%ADn",
    },
    {
      label: t(locale, "hero.marquee.activeIn", {
        city: "Cartagena",
        count: 41,
      }),
      href: "/explorar?city=Cartagena",
    },
    {
      label: t(locale, "hero.marquee.activeIn", { city: "Cali", count: 37 }),
      href: "/explorar?city=Cali",
    },
    { label: t(locale, "hero.marquee.live") },
    { label: t(locale, "hero.marquee.reviews") },
    { label: t(locale, "hero.marquee.noBots") },
    { label: t(locale, "hero.marquee.discreet") },
    {
      label: t(locale, "hero.marquee.activeIn", {
        city: "Barranquilla",
        count: 24,
      }),
      href: "/explorar?city=Barranquilla",
    },
    {
      label: t(locale, "hero.marquee.videocall"),
      href: "/explorar?category=videollamadas",
    },
  ];

  const colA = mosaic.slice(MOSAIC_COL_A_START, MOSAIC_COL_A_END);
  const colB = mosaic.slice(MOSAIC_COL_B_START, MOSAIC_COL_B_END);
  const colC = mosaic.slice(MOSAIC_COL_C_START, MOSAIC_COL_C_END);

  return (
    <section
      data-testid="editorial-hero"
      aria-labelledby="editorial-hero-title"
      className="relative isolate overflow-hidden border-b border-[var(--color-line-soft)] bg-[var(--color-cream)] text-[var(--color-ink)] lg:min-h-[760px]"
    >
      {/* Aurora — soft radial blooms layered behind the paper. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 motion-safe:motion-aurora"
        style={{
          background:
            "radial-gradient(60% 50% at 18% 30%, rgba(31,61,46,0.10), transparent 70%), radial-gradient(45% 40% at 80% 12%, rgba(200,166,118,0.14), transparent 65%), radial-gradient(50% 45% at 55% 85%, rgba(124,90,78,0.10), transparent 70%)",
        }}
      />
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

      {/* Mosaic — desktop only, three vertical cinema strips on the right. */}
      <div
        data-testid="editorial-hero-mosaic-desktop"
        aria-hidden="false"
        className="absolute inset-y-0 right-0 hidden w-[62%] grid-cols-[28fr_36fr_28fr] gap-2.5 lg:grid"
      >
        <EditorialHeroMosaicColumn
          tiles={colA}
          heights={TILE_HEIGHTS_A}
          drift="up"
          durationSeconds={34}
          testIdSuffix="a"
        />
        <EditorialHeroMosaicColumn
          tiles={colB}
          heights={TILE_HEIGHTS_B}
          drift="down"
          durationSeconds={42}
          testIdSuffix="b"
        />
        <EditorialHeroMosaicColumn
          tiles={colC}
          heights={TILE_HEIGHTS_C}
          drift="up"
          durationSeconds={28}
          testIdSuffix="c"
        />
      </div>

      {/* Left fade veil — softens the mosaic into the cream paper. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-[26%] z-[2] hidden w-[42%] lg:block"
        style={{
          background:
            "linear-gradient(90deg, var(--color-cream) 0%, var(--color-cream) 22%, color-mix(in srgb, var(--color-cream) 92%, transparent) 55%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-[2] hidden w-[40%] bg-[var(--color-cream)]/70 backdrop-blur-[2px] lg:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 z-[2] hidden h-20 lg:left-[38%] lg:block"
        style={{
          background:
            "linear-gradient(180deg, var(--color-cream), transparent)",
        }}
      />
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
        <div
          data-testid="editorial-hero-copy"
          className="flex max-w-[620px] gap-5 lg:gap-6"
        >
          {/* Vertical rail — desktop only, decorative. Mirrors V5's
              `.biringa-hero__rail`: rotated brand line + gradient hairline
              + small gold diamond at the foot. */}
          <div
            aria-hidden
            className="hidden w-5 shrink-0 flex-col items-center self-stretch py-1 lg:flex"
          >
            <span
              className="text-[10.5px] font-medium uppercase tracking-[0.32em] text-[var(--color-gold-deep)]"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              Biringas · Colombia · 2026
            </span>
            <span className="my-3.5 w-px flex-1 bg-gradient-to-b from-[var(--color-gold)] via-[var(--color-gold)]/40 to-transparent" />
            <span className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--color-gold)]" />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            {/* Top row — eyebrow on the left, live counter on the right. */}
            <div
              className="motion-safe:motion-hero-reveal flex items-center justify-between gap-4"
              style={{ animationDelay: "0.05s" }}
            >
              <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
                <span
                  aria-hidden
                  className="inline-block h-px w-5 shrink-0 bg-[var(--color-gold)]"
                />
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 shrink-0 rotate-45 bg-[var(--color-gold)] shadow-[0_0_0_3px_rgba(200,166,118,0.18)]"
                />
                <span className="truncate text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--color-ink-soft)]">
                  {kickerLabel}
                </span>
              </div>
              <div
                className="flex shrink-0 items-center gap-2"
                aria-live="polite"
              >
                <span
                  aria-hidden
                  className="relative inline-flex h-2 w-2 items-center justify-center"
                >
                  <span className="absolute inset-0 rounded-full bg-[#4D9B6E] opacity-70 motion-safe:motion-pulse-ring" />
                  <span className="relative inline-block h-2 w-2 rounded-full bg-[#4D9B6E] motion-safe:motion-hero-pulse" />
                </span>
                <span className="whitespace-nowrap text-xs font-medium tabular-nums text-[var(--color-ink)]">
                  {(() => {
                    const tpl = t(locale, "hero.kicker.online", {
                      count: "__N__",
                    });
                    const [before, after] = tpl.split("__N__");
                    return (
                      <>
                        {before}
                        <CountUp to={38} />
                        {after}
                      </>
                    );
                  })()}
                </span>
              </div>
            </div>

            {/* Headline */}
            <h1
              data-testid="editorial-hero-title"
              id="editorial-hero-title"
              // pr-6 leaves room on the right for the italic 'a' swash of
              // "tu Biringa" so it doesn't get clipped at the column edge
              // (Fraunces italic light-weight has visual overflow past the
              // glyph's logical box on the trailing letter).
              className="motion-safe:motion-hero-reveal mt-9 pr-6 font-[var(--font-display)] font-[360] tracking-[-0.025em] text-[var(--color-ink)]"
              style={{
                animationDelay: "0.15s",
                fontSize: "clamp(44px, 6.2vw, 76px)",
                lineHeight: 0.98,
              }}
            >
              {t(locale, "hero.title.line1")}
              <br />
              {/* pr-2 widens the inline-block past the gold middle line's
                  logical width so italic glyphs have room. The underline
                  stops at right-2 so it still ends under the glyph, not
                  the padding. Sheen animation removed: its background-
                  clip:text + transparent fill could leave the swash
                  unfilled at certain frames, reading as "cut". V5's spec
                  is solid gold italic anyway. */}
              <span className="relative inline-block pb-2 pr-2">
                <span className="font-[var(--font-display)] font-[320] italic text-[var(--color-gold-deep)]">
                  {t(locale, "hero.title.gold")}
                </span>
                <UnderlineSweep
                  delay={0.4}
                  className="bottom-0 left-0 right-2 h-px bg-gradient-to-r from-[var(--color-gold)] via-[var(--color-gold)]/60 to-transparent"
                />
              </span>
              <br />
              <span>{t(locale, "hero.title.line3")}</span>
              <span className="text-[var(--color-forest)]">.</span>
            </h1>

            {/* Stats one-liner */}
            <p
              data-testid="editorial-hero-description"
              className="motion-safe:motion-hero-reveal mt-7 max-w-[460px] text-[15.5px] leading-[1.55] text-[var(--color-ink-soft)] sm:text-base"
              style={{ animationDelay: "0.25s" }}
            >
              <strong className="font-semibold tabular-nums text-[var(--color-ink)]">
                <CountUp to={247} duration={1.6} />
              </strong>{" "}
              {t(locale, "hero.stats.verified")}{" "}
              <strong className="font-semibold text-[var(--color-ink)]">
                {t(locale, "hero.stats.cities")}
              </strong>
              {"."}
            </p>

            {/* Chips — first one is the active default action.
                Fixed mt/mb (no flex-1 spacer) so spacing is consistent
                across viewports — the spacer collapses to 0 when the
                column is content-bound and made the gaps invisible. */}
            <div
              data-testid="editorial-hero-suggested"
              className="motion-safe:motion-hero-reveal mb-10 mt-14 flex flex-wrap gap-2.5 lg:mb-12 lg:mt-16"
              style={{ animationDelay: "0.35s" }}
            >
              {chips.map((chip, i) => {
                const isActive = i === 0;
                const cls = isActive
                  ? "inline-flex items-center rounded-full bg-[var(--color-forest)] px-4 py-2 text-[12.5px] font-semibold text-[var(--color-cream)] shadow-[0_4px_14px_-4px_rgba(31,61,46,0.45)] transition-[background,box-shadow,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-forest-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-cream)]"
                  : "inline-flex items-center rounded-full border border-[var(--color-line)] bg-transparent px-3.5 py-2 text-[12.5px] font-medium text-[var(--color-ink-soft)] transition-[background,border-color,color,transform] duration-200 hover:-translate-y-[1px] hover:border-[var(--color-ink)]/35 hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-cream)]";
                return (
                  <Link
                    key={chip.label}
                    data-testid={`editorial-hero-suggested-${chip.label.toLowerCase().replace(/\s+/g, "-")}`}
                    href={chip.href}
                    className={cls}
                  >
                    {chip.label}
                  </Link>
                );
              })}

              {/* "Me siento con suerte" — picks a random visible mosaic
                  profile and routes to it. Sits at the end of the chip
                  row so it reads as a serendipity offer next to the
                  taxonomy filters. */}
              <LuckyButton
                slugs={mosaic.map((listing) => listing.slug)}
                className="group/lucky relative ml-1 inline-flex h-8 items-center gap-1.5 overflow-hidden rounded-full border border-[var(--color-gold)]/55 bg-[var(--color-cream-soft)]/80 px-3 text-xs font-semibold text-[var(--color-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_14px_-6px_rgba(31,61,46,0.18)] transition-[transform,border-color,box-shadow,background-color] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:border-[var(--color-gold)] hover:bg-[var(--color-cream)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_8px_20px_-8px_rgba(31,61,46,0.24)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-cream)] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Search pill. `relative z-30` lifts the open city dropdown
                above any later sibling that creates its own stacking
                context via the reveal animation. */}
            <div
              data-testid="editorial-hero-search"
              className="motion-safe:motion-hero-reveal relative z-30"
              style={{ animationDelay: "0.45s" }}
            >
              <form
                data-testid="editorial-hero-search-form"
                action="/explorar"
                method="get"
                role="search"
                aria-label={t(locale, "hero.search.aria")}
                className="group/search flex max-w-[560px] flex-col items-stretch gap-1.5 rounded-[var(--radius-2xl)] border border-[var(--color-line)] bg-[var(--color-cream-soft)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_18px_48px_-12px_rgba(31,61,46,0.18),0_8px_22px_-10px_rgba(31,61,46,0.08)] transition-[border-color,box-shadow,transform] duration-300 ease-[var(--ease-standard)] hover:-translate-y-[1px] focus-within:border-[var(--color-forest)] focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_22px_56px_-12px_rgba(31,61,46,0.26),0_10px_24px_-10px_rgba(31,61,46,0.14)] md:flex-row md:gap-0 md:rounded-full md:p-1.5"
              >
                <HeroCitySelect
                  name="city"
                  cities={heroCities}
                  defaultValue=""
                />
                <label className="block flex-1 px-4 py-2">
                  <span className="block text-[9.5px] uppercase tracking-[0.16em] text-[var(--color-ink-soft)] opacity-80">
                    {t(locale, "hero.field.queryLabel")}
                  </span>
                  <input
                    data-testid="editorial-hero-search-input"
                    type="text"
                    name="q"
                    placeholder={t(locale, "hero.field.query")}
                    className="mt-0.5 w-full bg-transparent text-sm italic text-[var(--color-ink)] placeholder:italic placeholder:text-[var(--color-ink-soft)] focus:outline-none"
                  />
                </label>
                <button
                  data-testid="editorial-hero-search-submit"
                  type="submit"
                  className="group/submit relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-full bg-[var(--color-forest)] px-6 text-[13.5px] font-medium text-[var(--color-cream)] transition-colors duration-200 hover:bg-[var(--color-forest-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-cream)] md:h-auto"
                >
                  {/* Gold shimmer sweep on hover. */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 -left-1/3 block w-1/3 bg-gradient-to-r from-transparent via-[rgba(200,166,118,0.55)] to-transparent opacity-0 group-hover/submit:opacity-100 motion-safe:group-hover/submit:motion-shimmer-sweep"
                  />
                  <Search className="relative h-3.5 w-3.5" aria-hidden />
                  <span className="relative">
                    {t(locale, "hero.cta.search")}
                  </span>
                </button>
              </form>
            </div>

            {/* Trust microline — three plain labels separated by gold
                diamonds. Replaces the old trust card + pills + strip. */}
            <ul
              className="motion-safe:motion-hero-reveal mt-9 flex flex-wrap items-center gap-x-3.5 gap-y-2 text-[11.5px] text-[var(--color-ink-soft)]"
              style={{ animationDelay: "0.55s" }}
              aria-label={t(locale, "hero.guarantees.aria")}
            >
              <li>{t(locale, "hero.trust.human")}</li>
              <li
                aria-hidden
                className="inline-block h-[3px] w-[3px] rotate-45 bg-[var(--color-gold)] opacity-70"
              />
              <li>{t(locale, "hero.trust.payment")}</li>
              <li
                aria-hidden
                className="inline-block h-[3px] w-[3px] rotate-45 bg-[var(--color-gold)] opacity-70"
              />
              <li>{t(locale, "hero.trust.noBots")}</li>
            </ul>
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
          aria-label={t(locale, "hero.mobileCarousel.aria")}
        >
          {mosaic.map((listing, idx) => (
            <div
              key={listing.id}
              className="snap-start shrink-0 basis-[68%] sm:basis-[44%]"
            >
              <HeroMosaicCard
                listing={listing}
                height={idx === 0 ? 360 : 320}
                hideLive={idx % 2 === 1}
                priority={idx === 0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom marquee — auto-drifts, city entries are real anchors. */}
      <div
        data-testid="editorial-hero-marquee"
        className="group/marquee relative z-[6] overflow-hidden border-y border-[var(--color-line)] bg-[var(--color-cream)] py-4"
      >
        <div className="flex w-[200%] gap-15 whitespace-nowrap motion-safe:motion-hero-marquee group-hover/marquee:[animation-play-state:paused]">
          {[0, 1].map((dup) =>
            marqueeItems.map((item) => {
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
                  aria-label={t(locale, "hero.marquee.viewAria", {
                    label: item.label,
                  })}
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
