export const motion = {
  duration: {
    instant: "80ms",
    fast: "160ms",
    base: "240ms",
    slow: "400ms",
  },
  easing: {
    standard: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    enter: "cubic-bezier(0, 0, 0.2, 1)",
    exit: "cubic-bezier(0.4, 0, 1, 1)",
  },
} as const;

/**
 * Framer-motion adapter for the same tokens.
 *
 * `motion.duration.*` are CSS strings ("160ms") and `motion.easing.*` are
 * `cubic-bezier(...)` strings — both are what `transition`/`animation` CSS wants.
 * Framer-motion instead wants durations in SECONDS (numbers) and easings as
 * `[x1, y1, x2, y2]` arrays. These mirror the values above so a framer-motion
 * component can stay token-driven without hardcoding raw numbers inline.
 */
export const motionFM = {
  fast: 0.16, // = motion.duration.fast
  base: 0.24, // = motion.duration.base
  slow: 0.4, // = motion.duration.slow
  standardEase: [0.2, 0.8, 0.2, 1] as const, // = motion.easing.standard
} as const;
