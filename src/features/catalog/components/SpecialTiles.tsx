import Link from "next/link";
import { Gem, Sparkles } from "lucide-react";

interface TileProps {
  href: string;
}

/**
 * Editorial tile pinned at the start of the catalog grid (yellow honey).
 * Same footprint as a card so the masonry stays clean.
 */
export function HistoriasTopTile({ href }: TileProps) {
  return (
    <Link
      href={href}
      className="group relative isolate flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-brand-warn)]/40 bg-gradient-to-br from-[#FFE45E]/30 via-[#FF8B36]/20 to-[#7A2BFF]/25 p-5 text-[var(--color-foreground)] shadow-[0_18px_48px_-18px_rgba(255,228,94,0.55)] transition-[transform,box-shadow] duration-200 ease-[var(--ease-standard)] hover:-translate-y-0.5 hover:shadow-[0_24px_64px_-16px_rgba(255,228,94,0.7)]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[radial-gradient(closest-side,rgba(255,228,94,0.65),transparent_70%)] blur-2xl"
      />
      <div className="relative flex items-start justify-between gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-background)]/70 text-[var(--color-brand-warn)] shadow-[0_8px_24px_-8px_rgba(255,228,94,0.7)]">
          <Gem className="h-5 w-5" aria-hidden />
        </span>
        <span className="rounded-full border border-[var(--color-brand-warn)]/50 bg-[var(--color-background)]/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-warn)]">
          Top
        </span>
      </div>
      <div className="relative">
        <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-brand-warn)]/90">
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
      className="group relative isolate flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-brand-primary)]/45 bg-gradient-to-br from-[#FF2BB5]/35 via-[#7A2BFF]/25 to-[#1FA8FF]/20 p-5 text-[var(--color-foreground)] shadow-[0_18px_48px_-18px_rgba(255,43,181,0.55)] transition-[transform,box-shadow] duration-200 ease-[var(--ease-standard)] hover:-translate-y-0.5 hover:shadow-[0_24px_64px_-16px_rgba(255,43,181,0.7)]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(255,43,181,0.55),transparent_70%)] blur-2xl"
      />
      <div className="relative flex items-start justify-between gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-background)]/70 text-[var(--color-brand-primary-strong)] shadow-[0_8px_24px_-8px_rgba(255,43,181,0.7)]">
          <Sparkles className="h-5 w-5" aria-hidden />
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-brand-accent)]/40 bg-[var(--color-background)]/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-accent-strong)]">
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-accent-strong)] motion-safe:animate-pulse"
          />
          En vivo
        </span>
      </div>
      <div className="relative">
        <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-brand-primary-soft)]">
          Online
        </p>
        <h3 className="mt-2 text-2xl font-bold leading-tight text-[var(--color-foreground)] sm:text-3xl">
          Disponibles AHORA
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
          Atención inmediata, hoy mismo. Filtra el catálogo por disponibilidad.
        </p>
      </div>
    </Link>
  );
}
