"use client";

import { Lightbulb } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { useActiveLocale } from "@/core/i18n/use-active-locale";
import { t } from "@/core/i18n/messages";

interface UsefulTipProps {
  title?: string;
  children: ReactNode;
}

// Conversion metrics like "2.5×" / "2,5×" are the persuasive heart of a tip —
// emphasise them in place rather than letting them sit in plain body text.
// Purely presentational: it wraps the existing copy, it does not alter it.
const METRIC_PATTERN = /(\d+(?:[.,]\d+)?\s*×)/;

function emphasizeMetric(node: ReactNode): ReactNode {
  if (typeof node !== "string") return node;
  const parts = node.split(METRIC_PATTERN);
  if (parts.length === 1) return node;
  return parts.map((part, index) =>
    METRIC_PATTERN.test(part) ? (
      <strong
        key={index}
        className="font-bold text-[var(--color-brand-accent-strong)]"
      >
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

/**
 * Side-rail tip card — same role as the "Useful tip" panel in the
 * reference. Uses the elevated cream surface so it reads as advisory,
 * not part of the form.
 *
 * Treated as the gold "beacon" of the row: a soft accent halo behind the
 * bulb, a hairline accent bar on top, and a hover lift that nudges the icon
 * — all token-driven so it stays on-theme and respects reduced motion.
 */
export function UsefulTip({ title, children }: UsefulTipProps) {
  const locale = useActiveLocale();
  const resolvedTitle = title ?? t(locale, "publicar.tip.default");
  return (
    <aside
      aria-label={resolvedTitle}
      style={{ "--step-i": 4 } as CSSProperties}
      className="group/tip motion-step-rise relative flex flex-col gap-3 overflow-hidden rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5 shadow-[var(--shadow-sm)] transition-[transform,box-shadow,border-color] duration-[240ms] ease-[var(--ease-standard)] hover:-translate-y-0.5 hover:border-[var(--color-brand-accent)]/40 hover:shadow-[var(--shadow-md)]"
    >
      {/* Gold accent hairline on top. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[var(--color-brand-accent)] via-[var(--color-gold)] to-transparent opacity-70"
      />
      {/* Soft halo behind the bulb — the warm focal glow of the card. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[var(--color-brand-accent)]/15 blur-2xl transition-opacity duration-300 ease-[var(--ease-standard)] group-hover/tip:opacity-80"
      />

      {/* Keyed by the tip title so it remounts on each step change and
          replays the crossfade — the side card animates in step with the
          stepper and the form panel. */}
      <div
        key={resolvedTitle}
        className="motion-tip-swap relative flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-muted)]">
            {resolvedTitle}
          </span>
          <span
            aria-hidden
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-accent)]/15 text-[var(--color-brand-accent-strong)] shadow-[var(--shadow-glow-accent)] transition-transform duration-300 ease-[var(--ease-standard)] group-hover/tip:-rotate-6 group-hover/tip:scale-110"
          >
            <Lightbulb className="h-4 w-4" aria-hidden />
          </span>
        </div>
        <div className="text-[13px] leading-relaxed text-[var(--color-text-muted)]">
          {emphasizeMetric(children)}
        </div>
      </div>
    </aside>
  );
}
