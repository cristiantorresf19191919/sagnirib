import Image from "next/image";
import Link from "next/link";
import { Mic, MapPin, Play } from "lucide-react";

import type { BiringaListing } from "@/server/biringas";
import { Card } from "@/shared/design-system/components/Card";
import { VerifiedBadge } from "@/shared/design-system/components/VerifiedBadge";
import { HeartButton } from "@/shared/ui/HeartButton";
import { PriceTag } from "@/shared/ui/PriceTag";
import { RatingBadge } from "@/shared/ui/RatingBadge";
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

  return (
    <Card tone="surface" interactive className="group p-3">
      <Link
        href={HREF(listing.slug)}
        className="absolute inset-0 z-20 rounded-[var(--radius-xl)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        aria-label={`${listing.name} en ${listing.city} — ver perfil`}
      >
        <span className="sr-only">Ver perfil</span>
      </Link>

      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)]">
        <Image
          src={listing.mainImage}
          alt={`${listing.name} en ${listing.city}`}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-500 ease-[var(--ease-standard)] group-hover:scale-[1.03]"
        />

        <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-2">
          {listing.verified && <VerifiedBadge />}
          {tagToShow && <Tag tone="primary">{tagToShow}</Tag>}
        </div>

        <div className="absolute right-3 top-3 z-30">
          <HeartButton listingId={listing.id} />
        </div>

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

      <div className="flex flex-col gap-1.5 px-1 pt-3">
        <header className="flex items-baseline justify-between gap-2">
          <h3 className="truncate text-base font-semibold text-[var(--color-foreground)]">
            {listing.name}
            <span className="ml-2 text-sm font-normal text-[var(--color-text-muted)]">
              {listing.age}
            </span>
          </h3>
          <RatingBadge
            score={listing.reputation.score}
            count={listing.reputation.reviewCount}
            size="sm"
          />
        </header>
        <p className="flex items-center gap-1 truncate text-xs text-[var(--color-text-muted)]">
          <MapPin className="h-3 w-3" aria-hidden />
          <span className="truncate">
            {listing.city}
            {listing.neighborhood ? ` · ${listing.neighborhood}` : ""}
          </span>
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <PriceTag value={formatPricePerHour(listing.pricePerHour)} size="sm" />
          <span className="text-xs text-[var(--color-brand-primary)] group-hover:underline">
            Ver perfil
          </span>
        </div>
      </div>
    </Card>
  );
}
