"use client";

import { motion } from "framer-motion";

/**
 * Editorial connector that bridges the 3 step cards on md+ screens.
 *
 * Previous version used wavy bezier curves whose control points sat
 * outside the viewBox (y=-10 / y=130 on a 120-tall canvas), so the
 * stroke clipped at the top and "dropped off" near card 03. This
 * rewrite:
 *
 *  - Uses a flat, horizontally-centered dashed gold line that stays
 *    fully inside the viewBox.
 *  - Sits in the *gaps* between cards via z-order — the cards' opaque
 *    surfaces hide the line behind them, so only the inter-card
 *    segments are visible, which reads as a stitched thread.
 *  - A small gold diamond glides L→R along the line on a slow loop,
 *    subconsciously walking the user's eye from 01 → 03.
 *  - Hidden on small screens, where the cards stack vertically.
 */
export function HowItWorksConnector() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-12 top-1/2 -z-[1] hidden h-3 -translate-y-1/2 md:block lg:inset-x-16"
    >
      {/* Hairline dashed gold line, drawn left→right on scroll. The
          gradient mask softens both ends so the line dissolves before
          it can touch the outer edges of the section. */}
      <svg
        viewBox="0 0 1200 12"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full text-[var(--color-gold)]"
      >
        <defs>
          <linearGradient id="hw-line-mask" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="black" stopOpacity="0" />
            <stop offset="0.08" stopColor="black" stopOpacity="1" />
            <stop offset="0.92" stopColor="black" stopOpacity="1" />
            <stop offset="1" stopColor="black" stopOpacity="0" />
          </linearGradient>
          <mask id="hw-line-fade">
            <rect width="1200" height="12" fill="url(#hw-line-mask)" />
          </mask>
        </defs>
        <motion.line
          x1="0"
          x2="1200"
          y1="6"
          y2="6"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeDasharray="5 7"
          mask="url(#hw-line-fade)"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 0.75 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{
            pathLength: { duration: 1.4, ease: [0.2, 0.8, 0.2, 1] },
            opacity: { duration: 0.4 },
          }}
        />
      </svg>

      {/* Traveling diamond — a small rotated gold square that glides
          along the line on a slow continuous loop. Set delay so it
          enters only after the dashed line has finished drawing. */}
      <motion.span
        className="absolute top-1/2 left-0 block h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[var(--color-gold)] shadow-[0_0_0_3px_rgba(200,166,118,0.18)] motion-reduce:hidden"
        initial={{ left: "0%", opacity: 0 }}
        whileInView={{
          left: ["8%", "96%"],
          opacity: [0, 1, 1, 0],
        }}
        viewport={{ once: false, margin: "-80px" }}
        transition={{
          duration: 4.2,
          ease: "easeInOut",
          delay: 1.4,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "loop",
          times: [0, 0.1, 0.9, 1],
        }}
      />
    </div>
  );
}
