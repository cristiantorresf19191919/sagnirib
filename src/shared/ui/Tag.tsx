import type { ReactNode } from "react";

type Tone = "neutral" | "primary" | "secondary" | "accent" | "warn";

const TONE: Record<Tone, string> = {
  neutral:
    "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]",
  primary:
    "bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary-strong)] border-[var(--color-brand-primary)]/40",
  secondary:
    "bg-[var(--color-brand-secondary)]/15 text-[var(--color-brand-secondary-strong)] border-[var(--color-brand-secondary)]/40",
  accent:
    "bg-[var(--color-brand-accent)]/12 text-[var(--color-brand-accent-strong)] border-[var(--color-brand-accent)]/40",
  warn:
    "bg-[var(--color-brand-warn)]/12 text-[var(--color-brand-warn)] border-[var(--color-brand-warn)]/40",
};

interface TagProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

export function Tag({ tone = "neutral", children, className = "" }: TagProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONE[tone]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
