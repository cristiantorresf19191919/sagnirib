/**
 * Shared "liquid" motion primitives for the enrollment wizard.
 *
 * Extracted from `LiquidProgressOrb` so the orb AND the gallery upload "Sello
 * Biringas" stamp share ONE spring signature — the brand's settle/slosh — instead
 * of redeclaring the constant in two places (which would drift on a re-tune).
 *
 * `LIQUID_SPRING` is a touch under-damped on purpose: a rising/settling element
 * visibly overshoots and slosh-settles home, which is the little "impact" that
 * makes a completion read as satisfying. Reuse it for any motion that should feel
 * like the same material as the progress orb.
 */
export const LIQUID_SPRING = {
  type: "spring",
  stiffness: 90,
  damping: 12,
  mass: 1,
} as const;
