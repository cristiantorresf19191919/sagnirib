import type { HTMLAttributes } from "react";

import { MotionCard } from "@/shared/motion/MotionCard";

type Tone = "surface" | "elevated" | "muted";
type Padding = "none" | "sm" | "md" | "lg";

const TONE: Record<Tone, string> = {
  surface: "bg-[var(--color-surface)] border border-[var(--color-border)]/70",
  elevated:
    "bg-[var(--color-background-elevated)] border border-[var(--color-border)]/60",
  muted: "bg-[var(--color-surface-muted)] border border-[var(--color-border)]/60",
};

const PADDING: Record<Padding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  padding?: Padding;
  /** Adds a spring-eased hover lift used in clickable card grids. */
  interactive?: boolean;
}

/**
 * Base card primitive. All cards (catalog, profile, listings) share its
 * surface, radius, border and shadow scale so the visual rhythm stays
 * consistent. When `interactive`, a Framer Motion spring hover lift is
 * applied — replaces ad-hoc CSS translates.
 */
export function Card({
  tone = "surface",
  padding = "none",
  interactive = false,
  className = "",
  children,
  ...rest
}: CardProps) {
  const interactiveCls = interactive
    ? "transition-[box-shadow,border-color] duration-200 ease-[var(--ease-standard)] hover:shadow-[var(--shadow-md)] hover:border-[var(--color-brand-primary-soft)]"
    : "";
  const merged = `relative overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] ${TONE[tone]} ${PADDING[padding]} ${interactiveCls} ${className}`.trim();

  if (interactive) {
    return (
      <MotionCard className={merged} {...(rest as Record<string, unknown>)}>
        {children}
      </MotionCard>
    );
  }

  return (
    <div className={merged} {...rest}>
      {children}
    </div>
  );
}
