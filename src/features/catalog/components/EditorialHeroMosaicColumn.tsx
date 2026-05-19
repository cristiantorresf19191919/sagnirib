import type { BiringaListing } from "@/server/biringas";

import { HeroMosaicCard } from "./HeroMosaicCard";

interface EditorialHeroMosaicColumnProps {
  readonly tiles: ReadonlyArray<BiringaListing>;
  readonly heights: ReadonlyArray<number>;
  /** Direction the reel travels — adjacent columns alternate up/down/up. */
  readonly drift: "up" | "down";
  /** One full loop in seconds. Each column carries its own clock so the
   *  three strips never advance in lockstep. */
  readonly durationSeconds: number;
  readonly testIdSuffix: string;
}

/**
 * One vertical strip of the cinema-reel mosaic. The tile list is duplicated
 * back-to-back inside an overflow-hidden frame; the inner track translates
 * exactly -50% (or 0 → 0 for the reversed direction) on a linear infinite
 * loop, so the seam between copy 1 and copy 2 is pixel-identical and the
 * reel reads as endless film.
 *
 * Pure CSS (no framer-motion) so this component is a Server Component and
 * the animation cannot drift out of sync across hydration. `prefers-reduced-
 * motion` collapses the animation to a static stack via the global utility.
 */
export function EditorialHeroMosaicColumn({
  tiles,
  heights,
  drift,
  durationSeconds,
  testIdSuffix,
}: Readonly<EditorialHeroMosaicColumnProps>) {
  if (tiles.length === 0) return null;

  // Duplicate the tile list back-to-back. The animation translates by -50%
  // so the visible window cycles through copy 1 → copy 2 → copy 1 …
  const reel = [...tiles, ...tiles];
  const reelClass =
    drift === "up"
      ? "motion-safe:motion-hero-reel-up"
      : "motion-safe:motion-hero-reel-down";

  return (
    <div
      data-testid={`editorial-hero-mosaic-column-${testIdSuffix}`}
      className="group/reel relative h-full overflow-hidden"
    >
      <div
        className={`flex flex-col will-change-transform ${reelClass} group-hover/reel:[animation-play-state:paused]`}
        style={{ ["--reel-duration" as string]: `${durationSeconds}s` }}
      >
        {/* Every tile (including the last) carries a 10 px trailing buffer
            so the doubled list has identical pitch between any two adjacent
            tiles — required for the -50 % loop to land pixel-clean. */}
        {reel.map((listing, idx) => (
          <div key={`${testIdSuffix}-${idx}-${listing.id}`} className="pb-2.5">
            <HeroMosaicCard
              listing={listing}
              height={heights[idx % heights.length] ?? 280}
              hideLive={idx % 2 === 1}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
