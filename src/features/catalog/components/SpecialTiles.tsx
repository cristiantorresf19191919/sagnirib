import Link from "next/link";
import { Gem, Sparkles } from "lucide-react";

import { Sparkle } from "@/shared/design-system/components/Sparkle";

interface TileProps {
  href: string;
}

const TILE_BASE =
  "group relative isolate flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-[var(--radius-xl)] p-5 transition-[transform,box-shadow,border-color] duration-200 ease-[var(--ease-standard)] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]";

/**
 * Editorial tile pinned at the start of the catalog grid (warm cream + gold).
 * Same footprint as a card so the masonry stays clean.
 */
export function HistoriasTopTile({ href }: TileProps) {
  return (
    <Link
      href={href}
      className={`${TILE_BASE} border border-[var(--color-brand-warn)]/40 bg-[var(--color-background-elevated)] text-[var(--color-foreground)] shadow-[var(--shadow-sm)] hover:border-[var(--color-brand-warn)] hover:shadow-[var(--shadow-glow-accent)]`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[radial-gradient(closest-side,rgba(229,162,58,0.20),transparent_70%)] blur-2xl"
      />
      <div className="relative flex items-start justify-between gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-warn)]/15 text-[var(--color-brand-accent-strong)]">
          <Gem className="h-5 w-5" aria-hidden />
        </span>
        <span className="rounded-full bg-[var(--color-brand-warn)]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-accent-strong)] ring-1 ring-[var(--color-brand-warn)]/30">
          Top
        </span>
      </div>
      <div className="relative">
        <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-brand-accent-strong)]">
          Editorial
        </p>
        <h3 className="mt-2 text-2xl font-bold leading-tight text-[var(--color-foreground)] sm:text-3xl">
          Historias TOP
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
          Las stories más vistas de la semana. Verificadas y con mejor reputación.
        </p>
      </div>
    </Link>
  );
}

/**
 * "Disponibles AHORA" tile — links to `?now=1`.
 */
export function DisponiblesAhoraTile({ href }: TileProps) {
  return (
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
          En vivo
        </span>
      </div>
      <div className="relative">
        <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-brand-primary-soft)]">
          Online
        </p>
        <h3 className="mt-2 text-2xl font-bold leading-tight text-[var(--color-surface)] sm:text-3xl">
          Disponibles AHORA
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-[var(--color-surface)]/85">
          Atención inmediata, hoy mismo. Filtra el catálogo por disponibilidad.
        </p>
      </div>
    </Link>
  );
}
