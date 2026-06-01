"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Minimal, elegant brand spinner for signed-in route transitions.
 *
 * One idea, done cleanly: a thin track ring with a single gradient arc
 * sweeping over it, and the Biringas sparkle breathing softly in the centre.
 * No orbits, morphs or wobble — quiet motion that reads as "loading" without
 * demanding attention.
 *
 * Colour comes from tokens (the SVG gradient reads CSS vars through the
 * cascade). Honors `prefers-reduced-motion`: the arc holds at the top and the
 * mark sits still — a calm static indicator.
 */

// 4-point sparkle (concave diamond) centred in a 56×56 viewBox.
const SPARKLE_PATH =
  "M28 14 C29.3 23.2 32.8 26.7 42 28 C32.8 29.3 29.3 32.8 28 42 C26.7 32.8 23.2 29.3 14 28 C23.2 26.7 26.7 23.2 28 14 Z";

// r = 22 → circumference ≈ 138. Show ~22% as the moving arc.
const ARC_DASH = "30 108";

export function RouteSpinner({ label }: { label: string }) {
  const reduced = useReducedMotion();

  return (
    <div
      data-testid="route-spinner"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6"
    >
      <div className="relative h-16 w-16">
        <svg
          viewBox="0 0 56 56"
          fill="none"
          aria-hidden
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="route-spinner-arc" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--color-brand-primary)" />
              <stop offset="1" stopColor="var(--color-gold)" />
            </linearGradient>
          </defs>

          {/* Faint track. */}
          <circle
            cx="28"
            cy="28"
            r="22"
            stroke="var(--color-border)"
            strokeWidth="2"
          />

          {/* Single gradient arc — one smooth rotation. */}
          <motion.circle
            cx="28"
            cy="28"
            r="22"
            stroke="url(#route-spinner-arc)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={ARC_DASH}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            initial={reduced ? { rotate: -90 } : undefined}
            animate={reduced ? undefined : { rotate: 360 }}
            transition={
              reduced
                ? undefined
                : { duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }
            }
          />

          {/* Centre sparkle — a soft, slow breath. Nothing else moves. */}
          <motion.path
            d={SPARKLE_PATH}
            fill="var(--color-brand-primary)"
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            animate={reduced ? undefined : { scale: [1, 1.1, 1], opacity: [0.85, 1, 0.85] }}
            transition={
              reduced
                ? undefined
                : { duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
            }
          />
        </svg>
      </div>

      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
        {label}
      </span>
    </div>
  );
}
