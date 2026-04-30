import type { ReactNode } from "react";

interface SectionShellProps {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  /** Optional slot rendered to the right of the heading (e.g. count). */
  aside?: ReactNode;
}

/**
 * The white card wrapper around a step's content. Mirrors the
 * "PUBLISHING DETAILS" panel in the reference image — title, supporting
 * sentence, then form fields below.
 */
export function SectionShell({
  eyebrow,
  title,
  description,
  children,
  aside,
}: SectionShellProps) {
  return (
    <section className="flex flex-col gap-6 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-brand-primary)]">
            {eyebrow}
          </span>
          <h2 className="text-2xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)] sm:text-[26px]">
            {title}
          </h2>
          {description && (
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
              {description}
            </p>
          )}
        </div>
        {aside}
      </header>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}
