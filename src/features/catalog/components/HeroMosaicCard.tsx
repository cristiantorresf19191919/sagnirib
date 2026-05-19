import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Star } from "lucide-react";

import type { BiringaListing } from "@/server/biringas";

interface HeroMosaicCardProps {
  readonly listing: BiringaListing;
  /** Tile height — drives the editorial rhythm of the column. */
  readonly height: number;
  /** Hide the "live" pill even when listing is `availableNow` (for variety). */
  readonly hideLive?: boolean;
  readonly priority?: boolean;
}

/**
 * Editorial mosaic tile used inside the cinematic hero.
 *
 * Layout matches the reference comp:
 *  - Top-LEFT: rating pill (5.0 ★) on a dark frosted background.
 *  - Bottom-LEFT: stacked name/age + neighborhood "Neighborhood, City" +
 *    a green-dot "En línea" pill when the listing is online.
 *  - Bottom-RIGHT: a gold verified-shield circle — anchors the verification
 *    promise on every visible card.
 *  - Photograph: lightly softened (no longer heavy-blurred) so the face
 *    reads as a real portrait.
 *
 * Text color is hardcoded cream-white because it always sits over the
 * dark forest scrim — the `--color-cream` token flips dark under
 * `data-theme="dark"` and would render invisible against the scrim.
 *
 * The tile itself carries no motion — the parent reel column scrolls it
 * vertically. Stacking ken-burns / drift here on top of the reel produced
 * the "wobbly bad animation" look from the previous iteration.
 */
export function HeroMosaicCard({
  listing,
  height,
  hideLive = false,
  priority = false,
}: HeroMosaicCardProps) {
  const showLive = !hideLive && listing.availableNow;
  const location = listing.neighborhood
    ? `${listing.neighborhood}, ${listing.city}`
    : listing.city;

  return (
    <div className="relative w-full shrink-0" style={{ height }}>
      <Link
        href={`/p/${listing.slug}`}
        aria-label={`${listing.name}, ${listing.age}, ${listing.city} — ver perfil`}
        className="group relative block h-full w-full overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-cream-deep)] shadow-[0_18px_36px_-22px_rgba(20,28,24,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-cream)]"
      >
        <div className="absolute inset-0">
          <Image
            src={listing.mainImage}
            alt=""
            aria-hidden
            fill
            quality={70}
            priority={priority}
            sizes="(max-width: 768px) 70vw, 22vw"
            className="object-cover saturate-[0.98] transition-transform duration-[800ms] ease-[var(--ease-standard)] group-hover:scale-[1.04]"
          />
        </div>

        {/* Bottom scrim — guarantees cream text contrast over any photo */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[rgba(20,38,30,0.82)] via-[rgba(20,38,30,0.18)] to-transparent"
        />
        {/* Top vignette for the rating pill */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[rgba(20,38,30,0.45)] to-transparent"
        />

        {/* Rating pill — TOP-LEFT */}
        <span
          aria-label={`Calificación ${listing.reputation.score.toFixed(1)} estrellas`}
          className="absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-[10px] border border-[rgba(248,242,228,0.18)] bg-[rgba(20,28,24,0.62)] px-2.5 py-1 text-[12px] font-semibold text-[#F2EBDC] backdrop-blur-md"
        >
          <Star
            className="h-3.5 w-3.5 fill-[var(--color-gold)] text-[var(--color-gold)]"
            aria-hidden
          />
          <span className="tabular-nums">
            {listing.reputation.score.toFixed(1)}
          </span>
        </span>

        {/* Bottom-LEFT: stacked name / location / live pill */}
        <div className="absolute bottom-3.5 left-3.5 right-14 text-[#F2EBDC]">
          <h3 className="font-[var(--font-display)] text-[22px] font-[420] leading-none tracking-[-0.02em]">
            {listing.name}
            <span className="ml-1 align-baseline font-[var(--font-display)] text-[17px] italic font-[340] opacity-80">
              , {listing.age}
            </span>
          </h3>
          <p className="mt-1.5 truncate text-[12.5px] leading-tight opacity-90">
            {location}
          </p>
          {showLive && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[rgba(248,242,228,0.22)] bg-[rgba(20,28,24,0.45)] px-2 py-0.5 text-[10.5px] font-medium text-[#F2EBDC] backdrop-blur-md">
              <span
                aria-hidden
                className="relative inline-flex h-1.5 w-1.5 items-center justify-center"
              >
                <span className="absolute inset-0 rounded-full bg-[#7BCB9A] opacity-70 motion-safe:motion-pulse-ring" />
                <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-[#7BCB9A] motion-safe:motion-hero-pulse" />
              </span>
              En línea
            </span>
          )}
        </div>

        {/* Bottom-RIGHT: gold verified shield circle */}
        {listing.verified && (
          <span
            aria-label="Verificada"
            title="Verificada"
            className="absolute bottom-3.5 right-3.5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(200,166,118,0.55)] bg-[rgba(20,28,24,0.55)] text-[var(--color-gold)] backdrop-blur-md transition-[transform,border-color] duration-200 ease-[var(--ease-standard)] group-hover:scale-110 group-hover:border-[var(--color-gold)]"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden />
          </span>
        )}
      </Link>
    </div>
  );
}
