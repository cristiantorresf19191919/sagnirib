import Link from "next/link";
import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  /** Optional eyebrow above the title (small uppercase). */
  eyebrow?: string;
  /** Optional "See all" / action link rendered on the right. */
  actionHref?: string;
  actionLabel?: string;
  /** Free-form trailing slot (e.g. counter chip) — rendered before the action. */
  trailing?: ReactNode;
  className?: string;
}

/**
 * Standard section header — title on the left, optional "Ver todo" link on
 * the right. Mirrors the "See all" pattern from the spa mockups.
 */
export function SectionHeader({
  title,
  eyebrow,
  actionHref,
  actionLabel = "Ver todo",
  trailing,
  className = "",
}: SectionHeaderProps) {
  return (
    <div
      className={`flex items-end justify-between gap-4 ${className}`.trim()}
    >
      <div>
        {eyebrow && (
          <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
            {eyebrow}
          </span>
        )}
        <h2 className="text-xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-2xl">
          {title}
        </h2>
      </div>
      <div className="inline-flex items-center gap-3">
        {trailing}
        {actionHref && (
          <Link
            href={actionHref}
            className="text-sm font-medium text-[var(--color-brand-primary)] transition-colors hover:text-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:underline"
          >
            {actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
