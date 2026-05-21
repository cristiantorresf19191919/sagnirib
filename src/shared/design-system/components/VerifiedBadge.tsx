"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

import { useActiveLocale } from "@/core/i18n/use-active-locale";
import { t } from "@/core/i18n/messages";

interface VerifiedBadgeProps {
  /** Visible label to render alongside the icon. Falls back to the
   *  locale-aware "Verificada"/"Verified" copy from the dictionary. */
  label?: string;
  /** Compact (icon only) or default (icon + label). */
  compact?: boolean;
}

/**
 * Trust signal pill. The periodic shimmer (1.4s sweep, ~7s pause) is a
 * deliberate brand cue — it nudges the eye back to the verification ring
 * without being a fidget toy. Disabled under prefers-reduced-motion.
 */
export function VerifiedBadge({
  label,
  compact = false,
}: VerifiedBadgeProps) {
  const locale = useActiveLocale();
  const resolvedLabel = label ?? t(locale, "catalog.card.verified");
  const reduced = useReducedMotion();
  return (
    <span
      className="relative inline-flex items-center gap-1 overflow-hidden rounded-full bg-[var(--color-brand-primary)]/10 px-2 py-1 text-xs font-medium text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/20"
      aria-label={resolvedLabel}
      title={resolvedLabel}
    >
      {!reduced && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-[var(--color-brand-primary)]/25 to-transparent"
          initial={{ x: "-120%" }}
          animate={{ x: "260%" }}
          transition={{
            duration: 1.4,
            ease: [0.22, 1, 0.36, 1],
            repeat: Infinity,
            repeatDelay: 6,
          }}
        />
      )}
      <ShieldCheck className="relative h-3.5 w-3.5" aria-hidden />
      {!compact && <span className="relative">{resolvedLabel}</span>}
    </span>
  );
}
