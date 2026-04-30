import type { SVGProps } from "react";

type Tone = "primary" | "muted" | "accent";

const TONE: Record<Tone, string> = {
  primary: "text-[var(--color-brand-primary)]",
  muted: "text-[var(--color-brand-primary-soft)]",
  accent: "text-[var(--color-brand-accent)]",
};

interface SparkleProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /** Color tone — defaults to primary forest green. */
  tone?: Tone;
  /** Square pixel size. */
  size?: number;
}

/**
 * Decorative 4-point starburst — the "sparkle" mark from the spa mockups.
 * Always `aria-hidden`; consumers add their own labels when meaningful.
 */
export function Sparkle({
  tone = "primary",
  size = 24,
  className = "",
  ...rest
}: SparkleProps) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`${TONE[tone]} ${className}`.trim()}
      {...rest}
    >
      <path d="M12 0c.4 4.5 1.6 7 3.5 8.5C17.4 10 19.9 11 24 12c-4.5.4-7 1.6-8.5 3.5C14 17.4 13 19.9 12 24c-.4-4.5-1.6-7-3.5-8.5C6.6 14 4.1 13 0 12c4.5-.4 7-1.6 8.5-3.5C10 6.6 11 4.1 12 0z" />
    </svg>
  );
}
