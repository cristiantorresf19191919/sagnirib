"use client";

import { GitCompare } from "lucide-react";

import { useFavorites } from "@/features/favorites/store/use-favorites";

interface CompareCheckboxProps {
  listingId: string;
  /** Optional label override; default is short. */
  label?: string;
  className?: string;
}

/**
 * Small inline "Comparar" affordance on catalog cards. Wraps the
 * existing `useFavorites().toggleCompare(id)` store API so the
 * comparison drawer (mounted on `/favoritas`) sees the toggle without
 * any new wiring. Renders a checkbox-style chip — when checked, the
 * card is in the comparison tray.
 *
 * Why surface this on every card: the compare drawer exists but was
 * previously only reachable via a hidden toggle on `/favoritas`. Adding
 * the checkbox to the card surface turns comparison from a buried
 * power-user feature into a one-tap action.
 */
export function CompareCheckbox({
  listingId,
  label = "Comparar",
  className,
}: Readonly<CompareCheckboxProps>) {
  const { isComparing, toggleCompare, ready } = useFavorites();
  const checked = ready && isComparing(listingId);

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      data-testid={`compare-checkbox-${listingId}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleCompare(listingId);
      }}
      className={
        className ??
        `inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-semibold transition-[border-color,background,color] duration-150 ease-[var(--ease-standard)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] ${
          checked
            ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)]/85 text-[var(--color-text-muted)] hover:border-[var(--color-brand-primary-soft)] hover:text-[var(--color-foreground)]"
        }`
      }
    >
      <GitCompare className="h-3 w-3" aria-hidden />
      {label}
    </button>
  );
}
