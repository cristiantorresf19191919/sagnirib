"use client";

import { motion, useReducedMotion } from "framer-motion";

interface UnderlineSweepProps {
  /** Delay before the underline starts drawing, seconds. */
  delay?: number;
  /** Tailwind classes for the underline bar (color, height, position). */
  className?: string;
}

/**
 * Decorative gold bar that draws itself from left to right. Used as an
 * editorial flourish behind hero accent words. Server-friendly: the bar
 * starts at scaleX(0) on SSR, so there is no FOUC before hydration.
 *
 * Honors prefers-reduced-motion (snaps to drawn state with no motion).
 */
export function UnderlineSweep({
  delay = 0,
  className = "",
}: UnderlineSweepProps) {
  const reduced = useReducedMotion();
  return (
    <motion.span
      aria-hidden
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={
        reduced
          ? { duration: 0 }
          : { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }
      }
      style={{ transformOrigin: "left center" }}
      className={`pointer-events-none absolute ${className}`}
    />
  );
}
