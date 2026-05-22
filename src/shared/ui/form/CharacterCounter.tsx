"use client";

import { motion } from "framer-motion";

interface CharacterCounterProps {
  current: number;
  min?: number;
  max: number;
}

/**
 * Live character counter used beneath textareas. Tone shifts as the user
 * moves through the valid range:
 *
 *   - below `min` → highlight (still too short)
 *   - in range   → muted (ok)
 *   - near max   → accent (warn at 90%+)
 *   - at max     → highlight (boundary reached)
 *
 * Pure presentational — the form is still the source of truth for
 * accepting/rejecting input.
 */
export function CharacterCounter({
  current,
  min,
  max,
}: Readonly<CharacterCounterProps>) {
  const tooShort = min !== undefined && current < min;
  const atLimit = current >= max;
  const nearLimit = !atLimit && current >= Math.floor(max * 0.9);

  const tone = tooShort
    ? "text-[var(--color-brand-highlight)]"
    : atLimit
      ? "text-[var(--color-brand-highlight)]"
      : nearLimit
        ? "text-[var(--color-brand-accent-strong)]"
        : "text-[var(--color-text-subtle)]";

  const progress = Math.min(1, current / max);

  return (
    <span
      className={`inline-flex items-center gap-2 font-mono text-[10px] ${tone}`}
    >
      <span aria-live="polite">
        {current}
        <span className="opacity-60"> / {max}</span>
      </span>
      <span
        aria-hidden
        className="relative inline-block h-1 w-16 overflow-hidden rounded-full bg-[var(--color-border)]"
      >
        <motion.span
          className={`absolute inset-y-0 left-0 rounded-full ${
            tooShort
              ? "bg-[var(--color-brand-highlight)]/70"
              : atLimit
                ? "bg-[var(--color-brand-highlight)]"
                : nearLimit
                  ? "bg-[var(--color-brand-accent-strong)]"
                  : "bg-[var(--color-brand-primary)]"
          }`}
          initial={false}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        />
      </span>
    </span>
  );
}
