import Image from "next/image";
import Link from "next/link";
import { Mic, MapPin, Play, Star } from "lucide-react";

import type { BiringaListing } from "@/server/biringas";
import { VerifiedBadge } from "@/shared/design-system/components/VerifiedBadge";
import { Tag } from "@/shared/ui/Tag";

import { formatPricePerHour } from "../format";

interface BiringaCardProps {
  listing: BiringaListing;
  /**
   * Eager-load + LCP candidate for the first card in the grid. Per the
   * /explorar Responsive Contract only the first card may be `priority`.
   */
  priority?: boolean;
  /**
   * `sizes` mapped to the parent grid layout. Defaults match the home
   * featured grid: 1 col mobile / 2 col tablet / 3 col laptop / 4 col xl.
   */
  sizes?: string;
}

const DEFAULT_SIZES =
  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1440px) 33vw, 25vw";

const HREF = (slug: string) => `/p/${slug}`;

export function BiringaCard({
  listing,
  priority = false,
  sizes = DEFAULT_SIZES,
}: BiringaCardProps) {
  const tagToShow = listing.tags[0];
  const ratingLabel = listing.reputation.score.toFixed(1);

  return (
    <article className="group relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)]/60 bg-[var(--color-background-elevated)] transition-[transform,border-color,box-shadow] duration-200 ease-[var(--ease-standard)] hover:-translate-y-0.5 hover:border-[var(--color-brand-primary)]/60 hover:shadow-[0_18px_48px_-12px_rgba(255,43,181,0.45)] focus-within:border-[var(--color-brand-primary)] focus-within:shadow-[0_18px_48px_-12px_rgba(255,43,181,0.55)]">
      <Link
        href={HREF(listing.slug)}
        className="absolute inset-0 z-20 rounded-[var(--radius-xl)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        aria-label={`${listing.name} en ${listing.city} — ver perfil`}
      >
        <span className="sr-only">Ver perfil</span>
      </Link>

      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--color-surface-muted)]">
        <Image
          src={listing.mainImage}
          alt={`${listing.name} en ${listing.city}`}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-500 ease-[var(--ease-standard)] group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--color-background)]/95 via-[var(--color-background)]/15 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
          {listing.verified && <VerifiedBadge />}
          {tagToShow && <Tag tone="primary">{tagToShow}</Tag>}
        </div>

        <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
          {listing.hasVideo && (
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-background)]/80 text-[var(--color-foreground)] backdrop-blur-sm"
              aria-label="Con vídeo"
              title="Con vídeo"
            >
              <Play className="h-3.5 w-3.5" aria-hidden />
            </span>
          )}
          {listing.hasAudio && (
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-background)]/80 text-[var(--color-foreground)] backdrop-blur-sm"
              aria-label="Con audio"
              title="Con audio"
            >
              <Mic className="h-3.5 w-3.5" aria-hidden />
            </span>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4 text-[var(--color-foreground)]">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold leading-tight">
                {listing.name}
                <span className="ml-2 text-sm font-normal text-[var(--color-text-muted)]">
                  {listing.age}
                </span>
              </h3>
              <p className="mt-1 flex items-center gap-1 truncate text-xs text-[var(--color-text-muted)]">
                <MapPin className="h-3 w-3" aria-hidden />
                <span className="truncate">
                  {listing.city}
                  {listing.neighborhood ? ` · ${listing.neighborhood}` : ""}
                </span>
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--color-background)]/70 px-2 py-1 text-xs text-[var(--color-foreground)] backdrop-blur-sm">
              <Star className="h-3 w-3 fill-[var(--color-brand-warn)] text-[var(--color-brand-warn)]" aria-hidden />
              {ratingLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)]/40 px-4 py-3">
        <span className="text-sm font-semibold text-[var(--color-foreground)]">
          {formatPricePerHour(listing.pricePerHour)}
        </span>
        <span className="text-xs text-[var(--color-text-subtle)]">
          Ver perfil
        </span>
      </div>
    </article>
  );
}
