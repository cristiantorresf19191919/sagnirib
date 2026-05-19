import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface EmptyStateAction {
  label: string;
  href: string;
  /** Visual emphasis — primary (forest fill) or secondary (outline). */
  variant?: "primary" | "secondary";
}

interface EmptyStateProps {
  icon: LucideIcon;
  /** Short editorial headline (≈ 4–8 words). */
  title: string;
  /** One-sentence explainer; never a tone of failure. */
  body: string;
  /** Up to two suggested actions; first is primary by convention. */
  actions?: ReadonlyArray<EmptyStateAction>;
  /** Test/automation hook. */
  testId?: string;
  /** Optional visual override for the icon disc — uses brand-primary by default. */
  accent?: "primary" | "gold" | "secondary";
}

const ACCENT_CLS = {
  primary:
    "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] ring-[var(--color-brand-primary)]/20",
  gold: "bg-[var(--color-gold)]/15 text-[var(--color-gold-deep)] ring-[var(--color-gold)]/30",
  secondary:
    "bg-[var(--color-brand-secondary)]/12 text-[var(--color-brand-secondary-strong)] ring-[var(--color-brand-secondary)]/25",
} as const;

/**
 * Editorial empty state — used wherever a feed/list/inbox has no
 * content yet. Keeps the brand voice (warm, calm, helpful) and always
 * offers a next action instead of leaving the user staring at white.
 *
 * The icon disc sits in a soft halo to echo the home-page eyebrow
 * vocabulary; the action buttons reuse the primary/outline pill
 * patterns from the rest of the system.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  actions,
  testId,
  accent = "primary",
}: Readonly<EmptyStateProps>) {
  return (
    <div
      data-testid={testId ?? "empty-state"}
      className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center sm:py-16"
    >
      <span
        aria-hidden
        className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ${ACCENT_CLS[accent]}`}
      >
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="font-[var(--font-display)] text-[clamp(22px,2.6vw,28px)] font-[370] leading-[1.1] tracking-[-0.02em] text-[var(--color-foreground)]">
        {title}
      </h2>
      <p className="font-[var(--font-serif)] text-[15px] leading-[1.55] text-[var(--color-text-muted)]">
        {body}
      </p>
      {actions && actions.length > 0 && (
        <div className="mt-2 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          {actions.map((action, idx) => {
            const isPrimary = (action.variant ?? (idx === 0 ? "primary" : "secondary")) === "primary";
            return (
              <Link
                key={action.label}
                href={action.href}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-[background,transform,box-shadow] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${
                  isPrimary
                    ? "bg-[var(--color-brand-primary)] text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] hover:bg-[var(--color-brand-primary-strong)] focus-visible:ring-[var(--color-brand-primary)]"
                    : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)] focus-visible:ring-[var(--color-brand-primary)]"
                }`}
              >
                {action.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
