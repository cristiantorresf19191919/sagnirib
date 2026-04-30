"use client";

import { Check, GitCompareArrows } from "lucide-react";

import {
  COMPARE_LIMIT,
  useFavorites,
} from "../store/use-favorites";

interface CompareToggleProps {
  listingId: string;
  /**
   * `pill` (default) — small floating chip suitable for overlays.
   * `block` — full-width action bar that sits cleanly below a card.
   */
  variant?: "pill" | "block";
}

/**
 * Toggle that adds a favorite to the side-by-side comparison tray. The tray
 * holds up to 3 listings; when full, the oldest gets bumped out so the
 * user always sees the perfiles they just acted on.
 */
export function CompareToggle({
  listingId,
  variant = "pill",
}: Readonly<CompareToggleProps>) {
  const { isComparing, toggleCompare, compareIds } = useFavorites();
  const active = isComparing(listingId);
  const bumpsOldest = !active && compareIds.length >= COMPARE_LIMIT;

  let title: string;
  if (active) {
    title = "Quitar de la comparación";
  } else if (bumpsOldest) {
    title = "Reemplaza la más antigua en la comparación";
  } else {
    title = "Comparar este perfil";
  }

  if (variant === "block") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleCompare(listingId);
        }}
        aria-pressed={active}
        title={title}
        className={`relative z-10 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[var(--radius-lg)] border text-[11px] font-semibold uppercase tracking-[0.18em] transition-[background,border-color,color] duration-200 ease-[var(--ease-standard)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${
          active
            ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:border-[var(--color-brand-primary)]/60 hover:bg-[var(--color-background-elevated)]"
        }`}
      >
        {active ? (
          <Check className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <GitCompareArrows className="h-3.5 w-3.5" aria-hidden />
        )}
        {active ? "En versus" : "Comparar"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleCompare(listingId);
      }}
      aria-pressed={active}
      title={title}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.16em] shadow-[var(--shadow-sm)] backdrop-blur-sm transition-[background,border-color,color] duration-200 ease-[var(--ease-standard)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${
        active
          ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-[var(--color-surface)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)]/95 text-[var(--color-foreground)] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)]"
      }`}
    >
      {active ? (
        <Check className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <GitCompareArrows className="h-3.5 w-3.5" aria-hidden />
      )}
      {active ? "En versus" : "Comparar"}
    </button>
  );
}
