import type { ReactNode } from "react";

type Tone = "neutral" | "primary" | "secondary" | "accent" | "warn";

const TONE: Record<Tone, string> = {
  neutral:
    "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] border-[var(--color-border)]",
  primary:
    "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] border-[var(--color-brand-primary)]/30",
  secondary:
    "bg-[var(--color-brand-secondary)]/12 text-[var(--color-brand-secondary-strong)] border-[var(--color-brand-secondary)]/35",
  accent:
    "bg-[var(--color-brand-accent)]/15 text-[var(--color-brand-accent-strong)] border-[var(--color-brand-accent)]/35",
  warn:
    "bg-[var(--color-brand-warn)]/15 text-[var(--color-brand-accent-strong)] border-[var(--color-brand-warn)]/40",
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
