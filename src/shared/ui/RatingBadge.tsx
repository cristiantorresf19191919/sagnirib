import { Star } from "lucide-react";

type Tone = "default" | "onImage";
type Size = "sm" | "md";

const TONE: Record<Tone, string> = {
  default: "text-[var(--color-foreground)]",
  onImage:
    "rounded-full bg-[var(--color-surface)]/90 px-2 py-1 text-[var(--color-foreground)] backdrop-blur-sm shadow-[var(--shadow-sm)]",
};

const SIZE: Record<Size, { text: string; icon: string }> = {
  sm: { text: "text-xs", icon: "h-3 w-3" },
  md: { text: "text-sm", icon: "h-3.5 w-3.5" },
};

interface RatingBadgeProps {
  /** Numeric score, e.g. 4.4. Formatted to 1 decimal. */
  score: number;
  /** Optional review count — rendered in parentheses. */
  count?: number;
  tone?: Tone;
  size?: Size;
  className?: string;
}

/**
 * Star + value + (count) — used on cards, profile headers, listings.
 * The star color is locked to `--color-brand-warn` (honey gold).
 */
export function RatingBadge({
  score,
  count,
  tone = "default",
  size = "sm",
  className = "",
}: RatingBadgeProps) {
  const sizing = SIZE[size];
  return (
    <span
      className={`inline-flex items-center gap-1 ${sizing.text} font-medium ${TONE[tone]} ${className}`.trim()}
    >
      <Star
        className={`${sizing.icon} fill-[var(--color-brand-warn)] text-[var(--color-brand-warn)]`}
        aria-hidden
      />
      <span>{score.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-[var(--color-text-subtle)]">({count})</span>
      )}
    </span>
  );
}
