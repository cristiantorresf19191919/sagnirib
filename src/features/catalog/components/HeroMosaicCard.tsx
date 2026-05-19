import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

import type { BiringaListing } from "@/server/biringas";

interface HeroMosaicCardProps {
  listing: BiringaListing;
  /** Tile height — drives the editorial rhythm of the column. */
  height: number;
  /** Each column drifts slowly in its own direction. */
  drift?: "up" | "down";
  /** Stagger the drift per tile so the mosaic never feels synchronized. */
  delay?: string;
  /** Slow individual durations per tile to break up the loop. */
  duration?: string;
  /** Hide the "live" pill even when listing is `availableNow` (for variety). */
  hideLive?: boolean;
  priority?: boolean;
}

/**
 * Floating editorial tile used inside the cinematic hero mosaic.
 *
 * Layout intent:
 *  - Heavy blur on the photograph so the tile reads as colour + atmosphere
 *    rather than a portrait — keeps the hero anti-catalog.
 *  - Bottom-aligned name (Fraunces) + zone/city kicker (UI sans).
 *  - Optional glassy "live" pill bottom-right when the listing is online.
 *
 * Drift + ken-burns animations are scoped via shared utilities so they
 * collapse cleanly under `prefers-reduced-motion: reduce`.
 */
export function HeroMosaicCard({
  listing,
  height,
  drift = "up",
  delay = "0s",
  duration,
  hideLive = false,
  priority = false,
}: Readonly<HeroMosaicCardProps>) {
  const showLive = !hideLive && listing.availableNow;
  const driftClass =
    drift === "up" ? "motion-safe:motion-drift-up" : "motion-safe:motion-drift-down";

  return (
    <div
      className={`relative w-full shrink-0 ${driftClass}`}
      style={{ height, animationDelay: delay, animationDuration: duration }}
    >
      <Link
        href={`/p/${listing.slug}`}
        aria-label={`${listing.name}, ${listing.age}, ${listing.city} — ver perfil`}
        className="group relative block h-full w-full overflow-hidden bg-[var(--color-cream-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-cream)]"
      >
        <div className="absolute inset-0 motion-safe:motion-ken-burns">
          <Image
            src={listing.mainImage}
            alt=""
            aria-hidden
            fill
            quality={45}
            priority={priority}
            sizes="(max-width: 768px) 70vw, 22vw"
            className="object-cover saturate-[0.92]"
            style={{ filter: "blur(1.5px)" }}
          />
        </div>

        {/* Forest-tinted bottom scrim — guarantees WCAG-AA contrast for the
            cream name + uppercase neighborhood line against any uploaded
            photograph (bright skies, light fabric, etc). The previous flat
            black/55 was too uniform and competed with the brand palette. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[rgba(20,38,30,0.82)] via-[rgba(20,38,30,0.28)] to-transparent"
        />
        {/* Subtle top vignette so the rating ribbon also reads cleanly
            against pale-sky photographs. */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[rgba(20,38,30,0.35)] to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.08] mix-blend-soft-light"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, transparent 0 14px, rgba(255,255,255,0.45) 14px 15px)",
          }}
        />

        {/* Rating ribbon — explains the mosaic's curation: every tile is
            in the hall of fame. Top-right corner avoids collision with the
            bottom-right "live" pill. */}
        <span
          aria-label={`Calificación ${listing.reputation.score.toFixed(1)} estrellas`}
          className="absolute right-3.5 top-3.5 inline-flex items-center gap-1 rounded-full border border-[rgba(248,242,228,0.32)] bg-[rgba(20,28,24,0.48)] px-2 py-0.5 text-[10.5px] font-semibold text-[var(--color-cream)] backdrop-blur-md"
        >
          <Star
            className="h-3 w-3 fill-[var(--color-gold)] text-[var(--color-gold)]"
            aria-hidden
          />
          <span className="tabular-nums">
            {listing.reputation.score.toFixed(1)}
          </span>
        </span>

        <div className="absolute right-3.5 bottom-3.5 left-3.5 flex items-end justify-between gap-2 text-[var(--color-cream)]">
          <div className="min-w-0">
            <h3 className="font-[var(--font-display)] text-[22px] font-[380] leading-none tracking-[-0.02em]">
              {listing.name}
              <span className="ml-1 align-baseline font-[var(--font-display)] text-[16px] italic font-[320] opacity-70">
                , {listing.age}
              </span>
            </h3>
            <p className="mt-1 truncate text-[10.5px] uppercase tracking-[0.06em] opacity-80">
              {listing.neighborhood ? `${listing.neighborhood} · ` : ""}
              {listing.city}
            </p>
          </div>
          {showLive && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[rgba(248,242,228,0.3)] bg-[rgba(248,242,228,0.18)] px-2 py-1 text-[10px] backdrop-blur-md">
              <span
                aria-hidden
                className="h-[5px] w-[5px] rounded-full bg-[#7BCB9A] motion-safe:motion-hero-pulse"
              />{" "}
              live
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
