"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { useLocale } from "@/core/i18n/LocaleProvider";
import { t } from "@/core/i18n/messages";
import { Sparkle } from "@/shared/design-system/components/Sparkle";

interface TileProps {
  href: string;
}

// `aspect-[4/5]` forced the tile to a hard ratio that the editorial
// content overflows on narrow viewports (≤ 200 px column width). We
// switched to a min-height so the content can grow vertically on mobile
// and the aspect ratio kicks back in at md+ where columns are wider.
const TILE_BASE =
  "group relative isolate flex min-h-[360px] flex-col overflow-hidden rounded-[var(--radius-xl)] p-5 transition-[box-shadow,border-color] duration-200 ease-[var(--ease-standard)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] md:aspect-[4/5] md:min-h-0";

const SPRING_HOVER = { y: -4, transition: { type: "spring", stiffness: 320, damping: 22 } } as const;
const SPRING_TAP = { scale: 0.985, transition: { duration: 0.12 } } as const;

/**
 * Editorial tile pinned at the start of the catalog grid. Matches the
 * reference comp: cream surface, a decorative eucalyptus sprig on the
 * left, a gold-diamond inside a gold-ringed circle as the focal element,
 * a "TOP" pill in the top-right, and a Fraunces title + sub-copy +
 * "Ver más historias →" link at the bottom.
 *
 * Same aspect-[4/5] footprint as a CatalogCard so the masonry rhythm
 * stays clean.
 */
export function HistoriasTopTile({ href }: TileProps) {
  const locale = useLocale();
  return (
    <motion.div
      whileHover={SPRING_HOVER}
      whileTap={SPRING_TAP}
      className="contents"
    >
      <Link
        href={href}
        className={`${TILE_BASE} border border-[var(--color-brand-warn)]/40 bg-gradient-to-br from-[var(--color-background-elevated)] via-[var(--color-cream)] to-[#F0E6CD] text-[var(--color-foreground)] shadow-[var(--shadow-sm)] hover:border-[var(--color-brand-warn)] hover:shadow-[var(--shadow-glow-accent)]`}
      >
        {/* Soft gold blur in the corner — same vocabulary as the hero
            aurora, anchors this tile as part of the same publication. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[radial-gradient(closest-side,rgba(229,162,58,0.22),transparent_70%)] blur-2xl"
        />

        {/* Decorative SVG ornaments — eucalyptus sprig curving up the
            left edge + a sparkle near the focal diamond. Inline so the
            tile is one self-contained component. */}
        <svg
          aria-hidden
          viewBox="0 0 200 280"
          className="pointer-events-none absolute -left-4 top-0 h-full w-32 text-[var(--color-brand-primary)]/45"
        >
          <defs>
            <linearGradient id="hi-leaf" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#A9C2B2" />
              <stop offset="1" stopColor="#2F5D43" />
            </linearGradient>
          </defs>
          {/* Stem curves up-and-right */}
          <path
            d="M 24 260 C 60 200, 90 140, 100 60"
            fill="none"
            stroke="#5C6E51"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity="0.55"
          />
          {[
            { cx: 32, cy: 240, rx: 14, ry: 6, rot: 38 },
            { cx: 44, cy: 214, rx: 16, ry: 7, rot: -40 },
            { cx: 56, cy: 184, rx: 18, ry: 8, rot: 42 },
            { cx: 70, cy: 152, rx: 18, ry: 8, rot: -42 },
            { cx: 82, cy: 118, rx: 16, ry: 7, rot: 38 },
            { cx: 94, cy: 84, rx: 14, ry: 6, rot: -34 },
          ].map((leaf, i) => (
            <ellipse
              key={i}
              cx={leaf.cx}
              cy={leaf.cy}
              rx={leaf.rx}
              ry={leaf.ry}
              transform={`rotate(${leaf.rot} ${leaf.cx} ${leaf.cy})`}
              fill="url(#hi-leaf)"
              opacity={0.6}
            />
          ))}
          {/* Tiny gold sparkles scattered around the leaf */}
          <path
            d="M 130 30 l 1.5 -5 l 1.5 5 l 5 1.5 l -5 1.5 l -1.5 5 l -1.5 -5 l -5 -1.5 z"
            fill="#C8A676"
            opacity="0.85"
          />
          <path
            d="M 152 80 l 1 -3.5 l 1 3.5 l 3.5 1 l -3.5 1 l -1 3.5 l -1 -3.5 l -3.5 -1 z"
            fill="#C8A676"
            opacity="0.7"
          />
          <circle cx="118" cy="64" r="1.2" fill="#C8A676" opacity="0.65" />
        </svg>

        <div className="relative flex items-start justify-end">
          <span className="rounded-full bg-[var(--color-brand-warn)]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-accent-strong)] ring-1 ring-[var(--color-brand-warn)]/30">
            {t(locale, "tile.top")}
          </span>
        </div>

        {/* Focal: a gold diamond inside a thin gold-ringed circle. The
            diamond is a clean SVG rotated square + inner solid square
            so it reads as a jewel facet. Sparkle accent in the corner. */}
        <div className="relative flex flex-1 items-center justify-center">
          <span className="relative inline-flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-cream-soft)] ring-1 ring-[var(--color-brand-warn)]/40">
            <svg
              aria-hidden
              viewBox="0 0 48 48"
              className="h-10 w-10 text-[var(--color-brand-accent-strong)]"
            >
              <g transform="translate(24 24) rotate(45)">
                <rect
                  x="-13"
                  y="-13"
                  width="26"
                  height="26"
                  rx="3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  opacity="0.9"
                />
                <rect
                  x="-6"
                  y="-6"
                  width="12"
                  height="12"
                  fill="currentColor"
                  opacity="0.95"
                />
              </g>
            </svg>
            <Sparkle
              tone="accent"
              size={18}
              className="absolute -right-1 -top-1 opacity-85"
            />
          </span>
        </div>

        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-brand-accent-strong)]">
            {t(locale, "tile.editorial")}
          </p>
          <h3 className="mt-2 font-[var(--font-display)] text-[1.65rem] font-[440] leading-tight tracking-tight text-[var(--color-foreground)]">
            {t(locale, "tile.historiasTop")}
          </h3>
          <p className="mt-2 font-[var(--font-serif)] text-[12.5px] leading-snug text-[var(--color-text-muted)]">
            {t(locale, "tile.historiasTop.body")}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--color-brand-accent-strong)]">
            {t(locale, "tile.seeMoreStories")}
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-200 ease-[var(--ease-standard)] group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

/**
 * "Disponibles AHORA" tile — links to `?now=1`.
 */
export function DisponiblesAhoraTile({ href }: TileProps) {
  const locale = useLocale();
  return (
    <motion.div
      whileHover={SPRING_HOVER}
      whileTap={SPRING_TAP}
      className="contents"
    >
      <Link
        href={href}
        className={`${TILE_BASE} border border-[var(--color-brand-primary)]/35 bg-[var(--color-brand-primary)] text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] hover:shadow-[var(--shadow-lg)]`}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.18),transparent_70%)] blur-2xl"
        />
        <Sparkle
          tone="muted"
          size={48}
          className="absolute right-5 top-5 opacity-60"
        />

        <div className="relative flex items-start justify-between gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)]/15 text-[var(--color-surface)]">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface)]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-surface)] ring-1 ring-[var(--color-surface)]/25">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-[var(--color-surface)] motion-safe:animate-pulse"
            />
            {t(locale, "tile.live")}
          </span>
        </div>

        <div className="relative mt-auto">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-brand-primary-soft)]">
            {t(locale, "tile.online")}
          </p>
          <h3 className="mt-2 text-2xl font-bold leading-tight text-[var(--color-surface)] sm:text-[1.65rem]">
            {t(locale, "tile.availableNow")}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-[var(--color-surface)]/85">
            {t(locale, "tile.availableNow.body")}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
