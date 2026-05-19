import type { Metadata } from "next";

import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { RecentlyViewedStrip } from "@/features/biringas/components/RecentlyViewedStrip";
import { CatalogGrid } from "@/features/catalog/components/CatalogGrid";
import { CategoryBar } from "@/features/catalog/components/CategoryBar";
import { OnboardingQuiz } from "@/features/catalog/components/OnboardingQuiz";
import { QuickPresets } from "@/features/catalog/components/QuickPresets";
import { SaveSearchButton } from "@/features/catalog/components/SaveSearchButton";
import { SearchBar } from "@/features/catalog/components/SearchBar";
import {
  encodeFilters,
  parseFilters,
  parseView,
  type RawSearchParams,
} from "@/features/catalog/lib/parse-filters";
import { Container } from "@/shared/design-system/components/Container";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";

interface ExplorarPageProps {
  searchParams: Promise<RawSearchParams>;
}

/**
 * `/explorar` is the catalog surface: filters + grid + pagination.
 * Home (`/`) carries the editorial hero and only links here — keeping the
 * two surfaces separate matches the SEO contract pair (`home.md` →
 * marketing, `explorar.md` → catalog discovery).
 */
export const metadata: Metadata = buildPageMetadata({
  title: "Explorar Biringas — Catálogo de acompañantes",
  description:
    "Catálogo de Biringas verificadas en Colombia. Filtra por ciudad, categoría (prepagos · masajes · videollamadas), precio, edad y disponibilidad.",
  path: "/explorar",
});

export default async function ExplorarPage({
  searchParams,
}: Readonly<ExplorarPageProps>) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const view = parseView(params);

  // Compose a short label for the "guardar búsqueda" pill — only shows
  // when the user has applied at least one real filter. Pure read; no
  // hooks here because this is a server component.
  const filterCount = Object.values(filters).filter(
    (v) =>
      v !== undefined &&
      v !== null &&
      v !== "" &&
      !(Array.isArray(v) && v.length === 0),
  ).length;
  const savedSearchHref = `/explorar?${encodeFilters(filters)}`;
  const savedSearchLabel = [
    filters.city,
    filters.category,
    filters.search ? `“${filters.search}”` : null,
    filters.sortBy ? filters.sortBy.replace("_", " ") : null,
  ]
    .filter(Boolean)
    .slice(0, 3)
    .join(" · ") || "Búsqueda personalizada";

  return (
    <>
      <Header hideCatalogCta />
      <main className="relative flex flex-col overflow-hidden bg-[var(--color-background)]">
        {/* Decorative editorial ornaments — top-right diamond + leaf
            foliage + dot grid + sparkle, matching the reference. Sits at
            -z-0 below content, pointer-events:none. Hidden on small
            screens so the mobile layout stays uncluttered. */}
        <ExplorarHeaderOrnaments />

        <Container
          width="wide"
          className="relative flex flex-col gap-3 pt-8 sm:gap-4 sm:pt-12 lg:pt-14"
        >
          <span className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-brand-primary)]">
            <span
              aria-hidden
              className="inline-block h-px w-10 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-[var(--color-brand-primary)]/40"
            />
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--color-gold)] shadow-[0_0_0_3px_rgba(200,166,118,0.18)]"
            />
            Catálogo
          </span>
          <h1 className="font-[var(--font-display)] text-[clamp(34px,5vw,56px)] font-[360] leading-[1.02] tracking-[-0.03em] text-[var(--color-foreground)]">
            Explorar{" "}
            <span className="italic font-[340] text-[var(--color-brand-primary)]">
              Biringas
            </span>
          </h1>
          <p className="max-w-2xl font-[var(--font-serif)] text-[15px] leading-[1.55] text-[var(--color-text-muted)] sm:text-base">
            Filtra por ciudad, categoría y disponibilidad. Sólo perfiles
            verificados — <em>sin bots, sin catfish.</em>
          </p>
          {filterCount > 0 && (
            <div className="mt-2 flex">
              <SaveSearchButton
                label={savedSearchLabel}
                href={savedSearchHref}
              />
            </div>
          )}
        </Container>
        <CategoryBar filters={filters} view={view} />
        <SearchBar filters={filters} view={view} />
        <QuickPresets filters={filters} view={view} />
        <CatalogGrid filters={filters} view={view} />
        <RecentlyViewedStrip />
        <OnboardingQuiz />
      </main>
      <Footer />
    </>
  );
}

/**
 * Decorative editorial ornaments anchored to the top-right of the
 * `/explorar` header band. Composes a soft dot-grid, an orbital ring
 * with a gold-diamond focal point, an eucalyptus-leaf sprig, and a
 * scattering of gold sparkles — same vocabulary as the home hero's
 * left foliage so the two surfaces feel like the same publication.
 *
 * Pure SVG, absolutely positioned, pointer-events:none, hidden on
 * mobile so the header copy stays the focus on small screens.
 */
function ExplorarHeaderOrnaments() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-0 top-0 -z-0 hidden h-[340px] w-[420px] md:block lg:h-[380px] lg:w-[520px]"
    >
      <svg
        viewBox="0 0 520 380"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full text-[var(--color-brand-primary)]"
      >
        <defs>
          <linearGradient id="ex-leaf" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#A9C2B2" />
            <stop offset="1" stopColor="#2F5D43" />
          </linearGradient>
          <linearGradient id="ex-ring" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#C8A676" stopOpacity="0.55" />
            <stop offset="1" stopColor="#C8A676" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Orbital gold ring — a thin ellipse that frames the diamond */}
        <ellipse
          cx="360"
          cy="140"
          rx="96"
          ry="72"
          fill="none"
          stroke="url(#ex-ring)"
          strokeWidth="1.2"
          transform="rotate(-22 360 140)"
        />

        {/* Inner cream-tinted circle */}
        <circle
          cx="360"
          cy="140"
          r="44"
          fill="rgba(244,239,227,0.0)"
          stroke="rgba(200,166,118,0.18)"
          strokeWidth="1"
        />

        {/* Center gold diamond */}
        <g transform="translate(360 140) rotate(45)">
          <rect
            x="-12"
            y="-12"
            width="24"
            height="24"
            rx="3"
            fill="none"
            stroke="#C8A676"
            strokeWidth="1.5"
            opacity="0.85"
          />
          <rect
            x="-6"
            y="-6"
            width="12"
            height="12"
            fill="#C8A676"
            opacity="0.85"
          />
        </g>

        {/* Dot grid — sits left of the ring, faint */}
        {Array.from({ length: 6 }).flatMap((_, row) =>
          Array.from({ length: 8 }).map((__, col) => (
            <circle
              key={`${row}-${col}`}
              cx={236 + col * 9}
              cy={130 + row * 9}
              r="1"
              fill="currentColor"
              opacity={0.22}
            />
          )),
        )}

        {/* Gold sparkles — three at varying sizes around the focal */}
        <path
          d="M 290 70 l 2 -8 l 2 8 l 8 2 l -8 2 l -2 8 l -2 -8 l -8 -2 z"
          fill="#C8A676"
          opacity="0.8"
        />
        <path
          d="M 470 90 l 1.5 -6 l 1.5 6 l 6 1.5 l -6 1.5 l -1.5 6 l -1.5 -6 l -6 -1.5 z"
          fill="#C8A676"
          opacity="0.7"
        />
        <path
          d="M 442 230 l 1 -4 l 1 4 l 4 1 l -4 1 l -1 4 l -1 -4 l -4 -1 z"
          fill="#C8A676"
          opacity="0.85"
        />

        {/* Eucalyptus leaf sprig — lower-right under the diamond. The
            stem curves up; leaves alternate sides like the home hero. */}
        <g>
          <path
            d="M 426 320 C 446 280, 458 248, 472 218"
            fill="none"
            stroke="#5C6E51"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.6"
          />
          {[
            { cx: 432, cy: 304, rx: 14, ry: 6, rot: 40 },
            { cx: 440, cy: 288, rx: 16, ry: 7, rot: -45 },
            { cx: 448, cy: 270, rx: 18, ry: 8, rot: 42 },
            { cx: 456, cy: 252, rx: 18, ry: 8, rot: -42 },
            { cx: 464, cy: 236, rx: 16, ry: 7, rot: 38 },
            { cx: 472, cy: 220, rx: 14, ry: 6, rot: -36 },
          ].map((leaf, i) => (
            <ellipse
              key={i}
              cx={leaf.cx}
              cy={leaf.cy}
              rx={leaf.rx}
              ry={leaf.ry}
              transform={`rotate(${leaf.rot} ${leaf.cx} ${leaf.cy})`}
              fill="url(#ex-leaf)"
              opacity={0.55}
            />
          ))}
        </g>

        {/* Tiny accent dots near the kicker line on the left */}
        <circle cx="10" cy="44" r="1.5" fill="#C8A676" opacity="0.7" />
        <path
          d="M 28 24 l 1 -4 l 1 4 l 4 1 l -4 1 l -1 4 l -1 -4 l -4 -1 z"
          fill="#C8A676"
          opacity="0.55"
        />
      </svg>
    </div>
  );
}
