import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Eye,
  Play,
  Star,
  Volume2,
} from "lucide-react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { t } from "@/core/i18n/messages";
import type { BiringaListing } from "@/server/biringas";
import { Card } from "@/shared/design-system/components/Card";
import { VerifiedBadge } from "@/shared/design-system/components/VerifiedBadge";
import { HeartButton } from "@/shared/ui/HeartButton";
import { PriceTag } from "@/shared/ui/PriceTag";
import { RatingBadge } from "@/shared/ui/RatingBadge";

import {
  formatPricePerHour,
  formatPricePerHourCompact,
} from "@/features/biringas/format";
import { StoryTimestamp } from "@/features/biringas/components/StoryTimestamp";

import type { CatalogView } from "../lib/parse-filters";

interface CatalogCardProps {
  listing: BiringaListing;
  /** Active locale — required so the card works under both Server callers
   *  (CatalogGrid, FeaturedStrip…) and the Client `FavoritesView` without
   *  reaching into `next/headers` from inside a client tree. */
  locale: SupportedLocale;
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
  locale,
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
        locale={locale}
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
      className={`group flex h-full flex-col p-2.5 sm:p-3 ${featuredCls}`.trim()}
    >
      <Link
        href={HREF(listing.slug)}
        aria-label={t(locale, "catalog.card.linkAria", {
          name: listing.name,
          city: listing.city,
        })}
        className="absolute inset-0 z-20 rounded-[var(--radius-xl)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        <span className="sr-only">{t(locale, "catalog.card.viewListing")}</span>
      </Link>

      <div
        className={`relative ${imageAspect} w-full overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)]`}
      >
        <div className="absolute inset-0 motion-safe:motion-ken-burns">
          <Image
            src={listing.mainImage}
            alt={t(locale, "catalog.card.imageAlt", {
              name: listing.name,
              city: listing.city,
            })}
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

        {/*
         * Top-overlay badges. `right-14` keeps badges out of the heart
         * button's territory (heart is 44px wide @ < sm with 8px gutter)
         * so pills can never extend past the image edge or sit under the
         * heart even at the narrowest column. `max-w-full + truncate`
         * is a belt-and-braces guard for very long translations.
         */}
        <div className="pointer-events-none absolute left-2 right-14 top-2 z-10 flex flex-col items-start gap-1.5 sm:left-3 sm:right-16 sm:top-3">
          {featured && (
            <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-gradient-to-r from-[var(--color-gold-deep)] via-[var(--color-gold)] to-[var(--color-gold-deep)] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[var(--color-cream)] shadow-[0_4px_14px_-4px_rgba(200,166,118,0.6)] ring-1 ring-[rgba(255,247,232,0.45)] sm:px-2.5 sm:text-[10px] sm:tracking-[0.18em]">
              <Star className="h-2.5 w-2.5 shrink-0 fill-current" aria-hidden />
              <span className="truncate">{t(locale, "catalog.card.featured")}</span>
            </span>
          )}
          {listing.availableNow ? (
            <span
              aria-label={t(locale, "catalog.card.availableNow")}
              title={t(locale, "catalog.card.availableNow")}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[var(--color-brand-primary)] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] motion-safe:motion-glow-pulse sm:px-2.5 sm:py-1 sm:text-[10px] sm:tracking-[0.18em]"
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-surface)] motion-safe:animate-pulse"
              />
              {/* Short label on the card — the pulsing dot already says
                  "live". Full label lives in aria-label for screen readers. */}
              <span className="truncate">
                {t(locale, "catalog.card.availableNowShort")}
              </span>
            </span>
          ) : listing.storyAt ? (
            <StoryTimestamp storyAt={listing.storyAt} />
          ) : null}
        </div>

        <div className="pointer-events-auto absolute right-2 top-2 z-30 sm:right-3 sm:top-3">
          <HeartButton listingId={listing.id} listingSlug={listing.slug} />
        </div>

        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span className="inline-flex translate-y-2 items-center gap-1.5 rounded-full bg-[var(--color-surface)]/95 px-4 py-2 text-xs font-semibold text-[var(--color-foreground)] opacity-0 shadow-[0_12px_28px_-10px_rgba(20,28,24,0.35)] ring-1 ring-[var(--color-gold)]/40 backdrop-blur-sm transition-[opacity,transform] duration-300 ease-[var(--ease-standard)] group-hover:translate-y-0 group-hover:opacity-100">
            <Eye className="h-3.5 w-3.5 text-[var(--color-brand-primary)]" aria-hidden />
            {t(locale, "catalog.card.viewListing")}
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
              aria-label={t(locale, "catalog.card.withVideo")}
              title={t(locale, "catalog.card.withVideo")}
            >
              <Play className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
        )}
      </div>

      {/*
       * Content column. Heights are kept consistent across every card in
       * the grid by:
       *   - a `flex-col` parent on the Card with `h-full`
       *   - this column claims `flex-1` and is itself a flex-col
       *   - the bio uses `min-h-[1.25rem]` so a missing/short bio doesn't
       *     collapse the row
       *   - the meta footer is anchored with `mt-auto`
       *   - the "extras" slot below price has a `min-h` reservation so
       *     cards with and without audio/response-time chips still align
       */}
      <div className="relative flex flex-1 flex-col gap-1.5 px-1 pt-2.5 sm:gap-2 sm:pt-3">
        <header className="flex items-center justify-between gap-2">
          <h3 className="flex min-w-0 items-center gap-1.5 text-[15px] font-semibold leading-tight text-[var(--color-foreground)] sm:text-base">
            <span className="truncate">{listing.name}</span>
            {/* Inline verified check — small green badge next to the name,
                matching the reference. Replaces the bottom-row Verificada
                pill so the trust signal travels with the name itself. */}
            {listing.verified && (
              <BadgeCheck
                aria-label={t(locale, "catalog.card.verifiedProfile")}
                className="h-4 w-4 shrink-0 text-[var(--color-brand-primary)]"
              />
            )}
            {/* In-text live indicator — separate from the corner pill so
                the signal travels with the name in long lists. */}
            {listing.availableNow && (
              <span
                aria-label={t(locale, "catalog.card.onlineNow")}
                title={t(locale, "catalog.card.onlineNow")}
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
          <span className="shrink-0 whitespace-nowrap text-[11px] text-[var(--color-text-muted)] sm:text-xs">
            {listing.age} {t(locale, "catalog.card.ageSuffix")}
          </span>
        </header>
        <RatingBadge
          score={listing.reputation.score}
          count={listing.reputation.reviewCount}
          size="sm"
        />
        {/* Single condensed feature line — shortBio truncated to one row
            so the card reads light. `min-h` reserves the line so cards
            with empty/short bios still align with their siblings. */}
        <p className="line-clamp-1 min-h-[1.25rem] text-xs leading-relaxed text-[var(--color-text-muted)]">
          {listing.shortBio || " "}
        </p>
        {/* Footer: city (caption, top) + price (prominent, bottom).
            Stacking eliminates the previous row-mode bug where the price
            wrapped to two lines and the city truncated to "Bogo…" at
            narrow column widths. Price uses `whitespace-nowrap` and a
            compact "/h" suffix on the smallest viewports. */}
        <div className="mt-auto flex flex-col items-start gap-0.5 pt-1.5">
          <span className="max-w-full truncate text-[11px] text-[var(--color-text-muted)] sm:text-xs">
            {listing.city}
            {listing.neighborhood ? ` · ${listing.neighborhood}` : ""}
          </span>
          <PriceTag
            value={formatPricePerHour(listing.pricePerHour)}
            size="md"
            className="hidden whitespace-nowrap font-[var(--font-display)] tabular-nums sm:inline-flex"
          />
          {/* Mobile uses the compact "/ h" form so the price never wraps
              inside a 160-180px card column. Hidden ≥ sm where the full
              "/ hora" suffix has room. */}
          <PriceTag
            value={formatPricePerHourCompact(listing.pricePerHour)}
            size="md"
            className="inline-flex whitespace-nowrap font-[var(--font-display)] tabular-nums sm:hidden"
          />
        </div>
        {/*
         * Extras slot — keeps audio chip + activity signals OUT of the
         * critical path so cards with and without these badges still line
         * up. `min-h-[1.5rem]` reserves exactly one chip-row of vertical
         * space; anything inside is absolutely positioned-style content
         * but kept in normal flow for accessibility.
         */}
        <div className="mt-1 flex min-h-[1.5rem] flex-wrap items-center gap-x-2 gap-y-1">
          {listing.hasAudio && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-secondary)]/12 px-2 py-0.5 text-[10px] font-medium text-[var(--color-brand-secondary-strong)]">
              <Volume2 className="h-3 w-3" aria-hidden />
              {t(locale, "catalog.card.audio")}
            </span>
          )}
          <ActivitySignals listing={listing} locale={locale} />
        </div>
      </div>
    </Card>
  );
}

interface ActivitySignalsProps {
  listing: BiringaListing;
  locale: SupportedLocale;
}

/**
 * Inline activity chips for the card meta row. Returns a fragment so the
 * parent extras slot keeps a consistent flow / wrap layout regardless of
 * which chips are present.
 *
 * The previous version emitted a redundant "Active now" caption — the
 * pulsing "AHORA" pill on the image already encodes live presence, and
 * a second line of text doubled the card height for live profiles only,
 * breaking grid alignment.
 */
function ActivitySignals({ listing, locale }: Readonly<ActivitySignalsProps>) {
  const replyMin = listing.reputation.replyMedianMinutes ?? null;
  if (replyMin === null) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-primary)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-brand-primary)]">
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-brand-primary)]"
      />
      {t(locale, "catalog.card.respondsIn", { minutes: replyMin })}
    </span>
  );
}

interface ListCardProps {
  listing: BiringaListing;
  locale: SupportedLocale;
  priority: boolean;
  featuredCls: string;
}

function ListCard({
  listing,
  locale,
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
        aria-label={t(locale, "catalog.card.linkAria", {
          name: listing.name,
          city: listing.city,
        })}
        className="absolute inset-0 z-20 rounded-[var(--radius-xl)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        <span className="sr-only">{t(locale, "catalog.card.viewListing")}</span>
      </Link>

      <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] sm:w-32">
        <div className="absolute inset-0 motion-safe:motion-ken-burns">
          <Image
            src={listing.mainImage}
            alt={t(locale, "catalog.card.imageAlt", {
              name: listing.name,
              city: listing.city,
            })}
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
            {t(locale, "catalog.card.availableNowShort")}
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
                  aria-label={t(locale, "catalog.card.onlineNow")}
                  title={t(locale, "catalog.card.onlineNow")}
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
                {listing.age} {t(locale, "catalog.card.ageSuffix")}
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
            {listing.verified && (
              <VerifiedBadge label={t(locale, "catalog.card.verified")} />
            )}
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
