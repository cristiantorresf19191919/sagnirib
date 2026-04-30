import { Lightbulb } from "lucide-react";
import type { ReactNode } from "react";

interface UsefulTipProps {
  title?: string;
  children: ReactNode;
}

/**
 * Side-rail tip card — same role as the "Useful tip" panel in the
 * reference. Uses the elevated cream surface so it reads as advisory,
 * not part of the form.
 */
export function UsefulTip({ title = "Consejo útil", children }: UsefulTipProps) {
  return (
    <aside
      aria-label={title}
      className="relative flex flex-col gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-background-elevated)] p-5 shadow-[var(--shadow-sm)]"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-muted)]">
          {title}
        </span>
        <span
          aria-hidden
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-accent)]/15 text-[var(--color-brand-accent-strong)]"
        >
          <Lightbulb className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <div className="text-[13px] leading-relaxed text-[var(--color-text-muted)]">
        {children}
      </div>
    </aside>
  );
}
