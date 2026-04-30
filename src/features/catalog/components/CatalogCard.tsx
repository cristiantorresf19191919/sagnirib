import Image from "next/image";
import Link from "next/link";
import { Eye, MessageSquare, Mic, Play, Volume2 } from "lucide-react";

import type { BiringaListing } from "@/server/biringas";
import { Card } from "@/shared/design-system/components/Card";
import { VerifiedBadge } from "@/shared/design-system/components/VerifiedBadge";
import { HeartButton } from "@/shared/ui/HeartButton";
import { PriceTag } from "@/shared/ui/PriceTag";
import { RatingBadge } from "@/shared/ui/RatingBadge";

import { formatPricePerHour } from "@/features/biringas/format";

interface CatalogCardProps {
  listing: BiringaListing;
  /** First card in the grid uses `priority` per /explorar Responsive Contract. */
  priority?: boolean;
  /** Featured cards get the warm honey accent strip + star prefix. */
  featured?: boolean;
}

const HREF = (slug: string) => `/p/${slug}`;

const TIME_FORMAT = new Intl.DateTimeFormat("es-CO", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

function formatStoryTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return TIME_FORMAT.format(d).toLowerCase();
  } catch {
    return "";
  }
}

const SIZES =
  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 280px";

export function CatalogCard({
  listing,
  priority = false,
  featured = false,
}: CatalogCardProps) {
  const storyLabel = listing.storyAt ? formatStoryTime(listing.storyAt) : "";
  const featuredCls = featured
    ? "ring-1 ring-[var(--color-brand-warn)]/40"
    : "";

  return (
    <Card
      tone="surface"
      interactive
      className={`group flex flex-col p-3 ${featuredCls}`.trim()}
    >
      <Link
        href={HREF(listing.slug)}
        aria-label={`${listing.name} en ${listing.city} — ver perfil`}
        className="absolute inset-0 z-20 rounded-[var(--radius-xl)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        <span className="sr-only">Ver anuncio</span>
      </Link>

      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)]">
        <Image
          src={listing.mainImage}
          alt={`${listing.name} en ${listing.city}`}
          fill
          sizes={SIZES}
          priority={priority}
          className="object-cover transition-transform duration-500 ease-[var(--ease-standard)] group-hover:scale-[1.04]"
        />

        {/* Top-left: story timestamp / now */}
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
          {listing.availableNow ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand-primary)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)]">
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-[var(--color-surface)] motion-safe:animate-pulse"
              />
              Disponible ahora
            </span>
          ) : storyLabel ? (
            <span className="rounded-full bg-[var(--color-surface)]/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--color-foreground)] shadow-[var(--shadow-sm)] backdrop-blur-sm">
              <span className="block text-[8px] tracking-[0.22em] text-[var(--color-text-muted)]">
                Grabada a las
              </span>
              {storyLabel}
            </span>
          ) : null}
        </div>

        {/* Top-right: heart toggle */}
        <div className="absolute right-3 top-3 z-30">
          <HeartButton />
        </div>

        {/* Hover overlay: Ver anuncio */}
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface)]/95 px-3.5 py-1.5 text-xs font-semibold text-[var(--color-foreground)] opacity-0 shadow-[var(--shadow-md)] backdrop-blur-sm transition-opacity duration-200 ease-[var(--ease-standard)] group-hover:opacity-100">
            <Eye className="h-3.5 w-3.5" aria-hidden />
            Ver anuncio
          </span>
        </div>

        {/* Bottom-right media chips */}
        <div className="absolute right-3 bottom-3 z-10 flex flex-col items-end gap-1.5">
          {listing.hasVideo && (
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-surface)]/95 text-[var(--color-foreground)] shadow-[var(--shadow-sm)] backdrop-blur-sm"
              aria-label="Con vídeo"
              title="Con vídeo"
            >
              <Play className="h-3.5 w-3.5" aria-hidden />
            </span>
          )}
          {listing.hasAudio && (
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-surface)]/95 text-[var(--color-foreground)] shadow-[var(--shadow-sm)] backdrop-blur-sm"
              aria-label="Con audio"
              title="Con audio"
            >
              <Mic className="h-3.5 w-3.5" aria-hidden />
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="relative flex flex-1 flex-col gap-1.5 px-1 pt-3">
        <header className="flex items-baseline justify-between gap-2">
          <h3 className="truncate text-base font-semibold text-[var(--color-foreground)]">
            {listing.name}
          </h3>
          <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
            {listing.age} a.
          </span>
        </header>
        <RatingBadge
          score={listing.reputation.score}
          count={listing.reputation.reviewCount}
          size="sm"
        />
        <p className="line-clamp-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
          {listing.shortBio}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="truncate text-xs text-[var(--color-text-muted)]">
            {listing.city}
            {listing.neighborhood ? ` · ${listing.neighborhood}` : ""}
          </span>
          <PriceTag value={formatPricePerHour(listing.pricePerHour)} size="sm" />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
          {listing.verified && <VerifiedBadge label="Verificada" />}
          {listing.hasAudio && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-secondary)]/12 px-2 py-0.5 font-medium text-[var(--color-brand-secondary-strong)]">
              <Volume2 className="h-3 w-3" aria-hidden />
              Audio
            </span>
          )}
          {listing.reputation.reviewCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-muted)] px-2 py-0.5 text-[var(--color-text-muted)]">
              <MessageSquare className="h-3 w-3" aria-hidden />
              {listing.reputation.reviewCount}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
