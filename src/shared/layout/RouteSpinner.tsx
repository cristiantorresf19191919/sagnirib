"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";

/**
 * Elegant brand spinner for route transitions of signed-in users — replaces
 * the public catalog skeleton (which only makes sense for the catalog + new
 * visitors) when navigating the app while logged in. Forest ring + gold arc
 * sweep with a softly pulsing Biringas mark in the centre.
 *
 * Honors `prefers-reduced-motion`: the ring holds still and the mark stops
 * pulsing, leaving a calm static indicator.
 */
export function RouteSpinner({ label }: { label: string }) {
  const reduced = useReducedMotion();

  return (
    <div
      data-testid="route-spinner"
      className="flex min-h-[70vh] flex-col items-center justify-center gap-6"
    >
      <div className="relative h-16 w-16">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border-2 border-[var(--color-border)]"
        />
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--color-brand-primary)] border-r-[var(--color-gold)]"
          animate={reduced ? undefined : { rotate: 360 }}
          transition={
            reduced ? undefined : { duration: 0.9, repeat: Infinity, ease: "linear" }
          }
        />
        <motion.span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center text-[var(--color-brand-primary)]"
          animate={reduced ? undefined : { scale: [1, 0.82, 1], opacity: [1, 0.55, 1] }}
          transition={
            reduced
              ? undefined
              : { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <Sparkles className="h-5 w-5" aria-hidden />
        </motion.span>
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
        {label}
      </span>
    </div>
  );
}
