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

import type { CatalogView } from "../lib/parse-filters";

interface CatalogCardProps {
  listing: BiringaListing;
  /** First card in the grid uses `priority` per /explorar Responsive Contract. */
  priority?: boolean;
  /** Featured cards get the warm honey accent strip + star prefix. */
  featured?: boolean;
  /** Catalog grid presentation mode — drives layout and image sizes. */
  view?: CatalogView;
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

const SIZES_GRID =
  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 280px";
const SIZES_LIST = "(max-width: 640px) 35vw, 160px";
const SIZES_SPOTLIGHT =
  "(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 720px";

export function CatalogCard({
  listing,
  priority = false,
  featured = false,
  view = "grid3",
}: CatalogCardProps) {
  const storyLabel = listing.storyAt ? formatStoryTime(listing.storyAt) : "";
  const featuredCls = featured
    ? "ring-1 ring-[var(--color-brand-warn)]/40"
    : "";

  if (view === "list") {
    return (
      <ListCard
        listing={listing}
        priority={priority}
        storyLabel={storyLabel}
        featuredCls={featuredCls}
      />
    );
  }

  const imageSizes = view === "spotlight" ? SIZES_SPOTLIGHT : SIZES_GRID;
  const imageAspect =
    view === "spotlight" ? "aspect-[16/10] sm:aspect-[16/9]" : "aspect-[4/5]";

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

      <div
        className={`relative ${imageAspect} w-full overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)]`}
      >
        <Image
          src={listing.mainImage}
          alt={`${listing.name} en ${listing.city}`}
          fill
          sizes={imageSizes}
          priority={priority}
          className="object-cover transition-transform duration-500 ease-[var(--ease-standard)] group-hover:scale-[1.04]"
        />

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

        <div className="absolute right-3 top-3 z-30">
          <HeartButton />
        </div>

        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface)]/95 px-3.5 py-1.5 text-xs font-semibold text-[var(--color-foreground)] opacity-0 shadow-[var(--shadow-md)] backdrop-blur-sm transition-opacity duration-200 ease-[var(--ease-standard)] group-hover:opacity-100">
            <Eye className="h-3.5 w-3.5" aria-hidden />
            Ver anuncio
          </span>
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

interface ListCardProps {
  listing: BiringaListing;
  priority: boolean;
  storyLabel: string;
  featuredCls: string;
}

function ListCard({
  listing,
  priority,
  storyLabel,
  featuredCls,
}: ListCardProps) {
  return (
    <Card
      tone="surface"
      interactive
      className={`group relative flex gap-3 p-2.5 sm:gap-4 sm:p-3 ${featuredCls}`.trim()}
    >
      <Link
        href={HREF(listing.slug)}
        aria-label={`${listing.name} en ${listing.city} — ver perfil`}
        className="absolute inset-0 z-20 rounded-[var(--radius-xl)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        <span className="sr-only">Ver anuncio</span>
      </Link>

      <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] sm:w-32">
        <Image
          src={listing.mainImage}
          alt={`${listing.name} en ${listing.city}`}
          fill
          sizes={SIZES_LIST}
          priority={priority}
          className="object-cover transition-transform duration-500 ease-[var(--ease-standard)] group-hover:scale-[1.05]"
        />
        {listing.availableNow ? (
          <span className="absolute left-1.5 top-1.5 z-10 inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-primary)] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.18em] text-[var(--color-surface)]">
            <span
              aria-hidden
              className="h-1 w-1 rounded-full bg-[var(--color-surface)] motion-safe:animate-pulse"
            />
            Ahora
          </span>
        ) : null}
      </div>

      <div className="relative flex flex-1 flex-col justify-between gap-1.5 py-0.5">
        <div className="flex flex-col gap-1">
          <header className="flex items-baseline justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-[var(--color-foreground)] sm:text-base">
              {listing.name}
              <span className="ml-2 text-xs font-normal text-[var(--color-text-muted)]">
                {listing.age} a.
              </span>
            </h3>
            <div className="z-30 shrink-0">
              <HeartButton />
            </div>
          </header>
          <div className="flex items-center gap-2">
            <RatingBadge
              score={listing.reputation.score}
              count={listing.reputation.reviewCount}
              size="sm"
            />
            {listing.verified && <VerifiedBadge label="Verificada" />}
          </div>
          <p className="line-clamp-2 text-xs leading-snug text-[var(--color-text-muted)]">
            {listing.shortBio}
          </p>
        </div>
        <div className="flex items-end justify-between gap-2">
          <span className="truncate text-[11px] text-[var(--color-text-muted)]">
            {listing.city}
            {listing.neighborhood ? ` · ${listing.neighborhood}` : ""}
            {storyLabel ? ` · ${storyLabel}` : ""}
          </span>
          <PriceTag value={formatPricePerHour(listing.pricePerHour)} size="sm" />
        </div>
      </div>
    </Card>
  );
}
