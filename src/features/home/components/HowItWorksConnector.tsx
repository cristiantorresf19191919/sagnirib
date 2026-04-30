"use client";

import { motion } from "framer-motion";

/**
 * Decorative SVG connector that runs across the 3 step cards on md+ screens.
 * Two soft curves (1→2 and 2→3) draw on scroll-into-view via framer-motion's
 * `pathLength`. Hidden on small screens — the cards stack vertically there
 * and a horizontal line would just be visual noise.
 */
export function HowItWorksConnector() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-32 -translate-y-1/2 md:block"
    >
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="h-full w-full text-[var(--color-brand-primary)]/40"
      >
        <motion.path
          d="M 60 60 C 240 -10, 360 130, 600 60"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="6 8"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{
            pathLength: { duration: 1.4, ease: [0.2, 0.8, 0.2, 1] },
            opacity: { duration: 0.4 },
          }}
        />
        <motion.path
          d="M 600 60 C 840 -10, 960 130, 1140 60"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="6 8"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{
            pathLength: { duration: 1.4, ease: [0.2, 0.8, 0.2, 1], delay: 0.4 },
            opacity: { duration: 0.4, delay: 0.4 },
          }}
        />
      </svg>
    </div>
  );
}
