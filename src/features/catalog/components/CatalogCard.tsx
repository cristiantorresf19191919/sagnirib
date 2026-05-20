import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Eye,
  Play,
  Star,
  Volume2,
} from "lucide-react";

import type { BiringaListing } from "@/server/biringas";
import { Card } from "@/shared/design-system/components/Card";
import { VerifiedBadge } from "@/shared/design-system/components/VerifiedBadge";
import { HeartButton } from "@/shared/ui/HeartButton";
import { PriceTag } from "@/shared/ui/PriceTag";
import { RatingBadge } from "@/shared/ui/RatingBadge";

import { formatPricePerHour } from "@/features/biringas/format";
import { StoryTimestamp } from "@/features/biringas/components/StoryTimestamp";

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
  // Make featured cards visibly distinct — a double ring (inner cream
  // hairline + outer gold) plus an ambient shadow that intensifies on
  // hover. Reads as "this is curated" without resorting to a coloured fill.
  const featuredCls = featured
    ? "ring-1 ring-[var(--color-gold)]/55 ring-offset-2 ring-offset-[var(--color-background)] shadow-[0_0_0_1px_rgba(255,247,232,0.9),0_18px_44px_-22px_rgba(200,166,118,0.55)] hover:shadow-[0_0_0_1px_rgba(255,247,232,0.95),0_26px_60px_-22px_rgba(200,166,118,0.7)]"
    : "";

  if (view === "list") {
    return (
      <ListCard
        listing={listing}
        priority={priority}
        featuredCls={featuredCls}
      />
    );
  }

  const imageSizes = view === "spotlight" ? SIZES_SPOTLIGHT : SIZES_GRID;
  const imageAspect =
    view === "spotlight" ? "aspect-[16/10] sm:aspect-[16/9]" : "aspect-[4/5]";

  return (
    <Card
      data-testid="catalog-card"
      data-listing-id={listing.id}
      tone="surface"
      interactive
      className={`group flex h-full flex-col p-3 ${featuredCls}`.trim()}
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
        <div className="absolute inset-0 motion-safe:motion-ken-burns">
          <Image
            src={listing.mainImage}
            alt={`${listing.name} en ${listing.city}`}
            fill
            sizes={imageSizes}
            priority={priority}
            className="object-cover transition-[filter,transform] duration-[600ms] ease-[var(--ease-standard)] group-hover:scale-[1.04] group-hover:saturate-[1.08]"
          />
        </div>

        {/* Two-layer hover overlay — a forest-tinted scrim at the bottom
            for the meta + a thin gold rim at the top for editorial polish. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-t from-[rgba(20,28,24,0.32)] via-transparent to-[rgba(200,166,118,0.10)] opacity-0 transition-opacity duration-300 ease-[var(--ease-standard)] group-hover:opacity-100"
        />

        {featured && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[6] overflow-hidden"
          >
            <span className="absolute inset-y-0 -left-1/3 block w-1/3 bg-gradient-to-r from-transparent via-[rgba(229,162,58,0.28)] to-transparent opacity-0 group-hover:opacity-100 motion-safe:group-hover:motion-shimmer-sweep" />
          </div>
        )}

        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
          {featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[var(--color-gold-deep)] via-[var(--color-gold)] to-[var(--color-gold-deep)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-cream)] shadow-[0_4px_14px_-4px_rgba(200,166,118,0.6)] ring-1 ring-[rgba(255,247,232,0.45)]">
              <Star className="h-2.5 w-2.5 fill-current" aria-hidden />
              Destacada
            </span>
          )}
          {listing.availableNow ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand-primary)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] motion-safe:motion-glow-pulse">
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-[var(--color-surface)] motion-safe:animate-pulse"
              />
              Disponible ahora
            </span>
          ) : listing.storyAt ? (
            <StoryTimestamp storyAt={listing.storyAt} />
          ) : null}
        </div>

        <div className="absolute right-3 top-3 z-30">
          <HeartButton listingId={listing.id} listingSlug={listing.slug} />
        </div>

        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span className="inline-flex translate-y-2 items-center gap-1.5 rounded-full bg-[var(--color-surface)]/95 px-4 py-2 text-xs font-semibold text-[var(--color-foreground)] opacity-0 shadow-[0_12px_28px_-10px_rgba(20,28,24,0.35)] ring-1 ring-[var(--color-gold)]/40 backdrop-blur-sm transition-[opacity,transform] duration-300 ease-[var(--ease-standard)] group-hover:translate-y-0 group-hover:opacity-100">
            <Eye className="h-3.5 w-3.5 text-[var(--color-brand-primary)]" aria-hidden />
            Ver anuncio
            <span
              aria-hidden
              className="ml-1 inline-block h-1 w-1 rotate-45 bg-[var(--color-gold)]"
            />
          </span>
        </div>

        {/* Audio gets the meta-row "Audio" chip below the title instead
            of an icon overlay here — the chip with the Volume2 + label
            reads better at card width than a bare microphone. Video
            keeps the overlay because the play glyph is universally
            understood and previews the affordance. */}
        {listing.hasVideo && (
          <div className="absolute right-3 bottom-3 z-10">
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-surface)]/95 text-[var(--color-foreground)] shadow-[var(--shadow-sm)] backdrop-blur-sm"
              aria-label="Con vídeo"
              title="Con vídeo"
            >
              <Play className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
        )}
      </div>

      <div className="relative flex flex-1 flex-col gap-2 px-1 pt-3">
        <header className="flex items-center justify-between gap-2">
          <h3 className="flex min-w-0 items-center gap-1.5 text-base font-semibold text-[var(--color-foreground)]">
            <span className="truncate">{listing.name}</span>
            {/* Inline verified check — small green badge next to the name,
                matching the reference. Replaces the bottom-row Verificada
                pill so the trust signal travels with the name itself. */}
            {listing.verified && (
              <BadgeCheck
                aria-label="Perfil verificado"
                className="h-4 w-4 shrink-0 text-[var(--color-brand-primary)]"
              />
            )}
            {/* In-text live indicator — separate from the corner pill so
                the signal travels with the name in long lists. */}
            {listing.availableNow && (
              <span
                aria-label="En línea ahora"
                title="En línea ahora"
                className="relative inline-flex h-1.5 w-1.5 shrink-0 items-center justify-center"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-[#4D9B6E] opacity-70 motion-safe:motion-pulse-ring"
                />
                <span
                  aria-hidden
                  className="relative inline-block h-1.5 w-1.5 rounded-full bg-[#4D9B6E] motion-safe:motion-hero-pulse"
                />
              </span>
            )}
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
        {/* Single condensed feature line — shortBio truncated to one row
            so the card reads light. The full bio is on the profile page. */}
        <p className="line-clamp-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
          {listing.shortBio}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="truncate text-xs text-[var(--color-text-muted)]">
            {listing.city}
            {listing.neighborhood ? ` · ${listing.neighborhood}` : ""}
          </span>
          <PriceTag
            value={formatPricePerHour(listing.pricePerHour)}
            size="md"
            className="font-[var(--font-display)] tabular-nums"
          />
        </div>
        {/* Audio chip — only when relevant. Review count moved out:
            the RatingBadge above already shows `(reviewCount)` next to
            the score, so a second chip with a MessageSquare icon read
            as "messages" not "reviews" and added visual noise without
            new information. */}
        {listing.hasAudio && (
          <div className="text-[10px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-secondary)]/12 px-2 py-0.5 font-medium text-[var(--color-brand-secondary-strong)]">
              <Volume2 className="h-3 w-3" aria-hidden />
              Audio
            </span>
          </div>
        )}

        {/* Activity + response-time signals — deterministic from the
            slug so the value is stable across renders. Helps buyers
            pre-qualify before tapping into the profile. */}
        <ActivitySignals listing={listing} />
      </div>
    </Card>
  );
}

interface ActivitySignalsProps {
  listing: BiringaListing;
}

function ActivitySignals({ listing }: Readonly<ActivitySignalsProps>) {
  // Reply median is owner-earned — set by `respondToBooking` once the
  // listing has at least a couple of responded bookings. Absent value
  // hides the chip entirely; we do NOT synthesise a number anymore.
  const replyMin = listing.reputation.replyMedianMinutes ?? null;
  // "Activa ahora" only when the live flag is on. We don't surface a
  // synthetic "Activa hace Xh" from storyAt — that conflates "subió
  // story" with "estuvo en línea", which is misleading.
  const lastActive = listing.availableNow ? "Activa ahora" : null;
  if (replyMin === null && !lastActive) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-[var(--color-text-muted)]">
      {replyMin !== null && (
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-primary)]/10 px-2 py-0.5 font-semibold text-[var(--color-brand-primary)]">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-brand-primary)]"
          />
          Responde ~{replyMin}min
        </span>
      )}
      {lastActive && (
        <span className="text-[10px] text-[var(--color-text-subtle)]">
          {lastActive}
        </span>
      )}
    </div>
  );
}

interface ListCardProps {
  listing: BiringaListing;
  priority: boolean;
  featuredCls: string;
}

function ListCard({
  listing,
  priority,
  featuredCls,
}: ListCardProps) {
  return (
    <Card
      data-testid="catalog-card-list"
      data-listing-id={listing.id}
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
        <div className="absolute inset-0 motion-safe:motion-ken-burns">
          <Image
            src={listing.mainImage}
            alt={`${listing.name} en ${listing.city}`}
            fill
            sizes={SIZES_LIST}
            priority={priority}
            className="object-cover transition-[filter,transform] duration-[600ms] ease-[var(--ease-standard)] group-hover:scale-[1.04] group-hover:saturate-[1.08]"
          />
        </div>
        {listing.availableNow ? (
          <span className="absolute left-1.5 top-1.5 z-10 inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-primary)] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.18em] text-[var(--color-surface)] motion-safe:motion-glow-pulse">
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
            <h3 className="flex min-w-0 items-baseline gap-1.5 text-sm font-semibold text-[var(--color-foreground)] sm:text-base">
              <span className="truncate">{listing.name}</span>
              {listing.availableNow && (
                <span
                  aria-label="En línea ahora"
                  title="En línea ahora"
                  className="relative inline-flex h-1.5 w-1.5 shrink-0 items-center justify-center"
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-[#4D9B6E] opacity-70 motion-safe:motion-pulse-ring"
                  />
                  <span
                    aria-hidden
                    className="relative inline-block h-1.5 w-1.5 rounded-full bg-[#4D9B6E] motion-safe:motion-hero-pulse"
                  />
                </span>
              )}
              <span className="ml-1 text-xs font-normal text-[var(--color-text-muted)]">
                {listing.age} a.
              </span>
            </h3>
            <div className="z-30 shrink-0">
              <HeartButton listingId={listing.id} listingSlug={listing.slug} />
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
          <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-[11px] text-[var(--color-text-muted)]">
            <span className="truncate">
              {listing.city}
              {listing.neighborhood ? ` · ${listing.neighborhood}` : ""}
            </span>
            {listing.storyAt && (
              <>
                <span aria-hidden>·</span>
                <StoryTimestamp storyAt={listing.storyAt} variant="inline" />
              </>
            )}
          </span>
          <PriceTag value={formatPricePerHour(listing.pricePerHour)} size="sm" />
        </div>
      </div>
    </Card>
  );
}
