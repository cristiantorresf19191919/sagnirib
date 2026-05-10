"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";

import type { BiringaListing } from "@/server/biringas";

import { HeroMosaicCard } from "./HeroMosaicCard";

interface EditorialHeroMosaicColumnProps {
  tiles: ReadonlyArray<BiringaListing>;
  heights: ReadonlyArray<number>;
  drift: "up" | "down";
  /** Vertical offset; negative pulls the column above the rail for the editorial stagger. */
  top: number;
  /** Horizontal placement — `left`/`right` + `width`. */
  position: CSSProperties;
  /**
   * Horizontal travel range in pixels. Sign drives direction so adjacent
   * columns can drift in opposite directions for a parallax feel.
   */
  slideRange: number;
  /** Loop duration in seconds — slow on purpose, ~16–22s. */
  slideDuration: number;
  /** Start offset so columns don't share a phase. */
  slideDelay: number;
  testIdSuffix: string;
}

/**
 * Mosaic column with an infinite, *very* slow horizontal drift on top of the
 * existing per-tile vertical ken-burns. Range stays small (≤16px) so the
 * editorial layout reads as still — the motion is at the edge of perception
 * and gives the hero a living, breathing quality without becoming a feature.
 *
 * `useReducedMotion` skips the animation entirely; the column renders
 * statically in its absolute position.
 */
export function EditorialHeroMosaicColumn({
  tiles,
  heights,
  drift,
  top,
  position,
  slideRange,
  slideDuration,
  slideDelay,
  testIdSuffix,
}: EditorialHeroMosaicColumnProps) {
  const reduced = useReducedMotion();

  const animate = reduced ? undefined : { x: [0, slideRange, 0] };
  const transition = reduced
    ? undefined
    : {
        duration: slideDuration,
        delay: slideDelay,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut" as const,
      };

  return (
    <motion.div
      data-testid={`editorial-hero-mosaic-column-${testIdSuffix}`}
      className="absolute flex flex-col gap-2.5 will-change-transform"
      style={{ ...position, top }}
      animate={animate}
      transition={transition}
    >
      {tiles.map((listing, idx) => (
        <HeroMosaicCard
          key={listing.id}
          listing={listing}
          height={heights[idx % heights.length] ?? 280}
          drift={drift}
          delay={`${idx * 0.4}s`}
          duration={`${12 + idx}s`}
          hideLive={idx % 2 === 1}
        />
      ))}
    </motion.div>
  );
}
