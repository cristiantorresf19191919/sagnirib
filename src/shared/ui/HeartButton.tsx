"use client";

import { Heart } from "lucide-react";
import { useState } from "react";

import { useFavorites } from "@/features/favorites/store/use-favorites";

interface HeartButtonProps {
  /**
   * Listing id this heart represents. When provided, the pressed state is
   * driven by the global favorites store (persisted across pages and tabs
   * via localStorage). When omitted, the button keeps the legacy local
   * state — useful in isolated previews / Storybook contexts.
   */
  listingId?: string;
  /** Initial pressed state (only used when `listingId` is omitted). */
  initialActive?: boolean;
  /** Optional aria label override. */
  label?: string;
  className?: string;
}

/**
 * Favorite toggle. Wires to the persistent favorites store when `listingId`
 * is provided so the heart state survives navigation and reloads.
 */
export function HeartButton({
  listingId,
  initialActive = false,
  label,
  className = "",
}: HeartButtonProps) {
  if (listingId) {
    return (
      <ConnectedHeart
        listingId={listingId}
        label={label}
        className={className}
      />
    );
  }
  return (
    <LocalHeart
      initialActive={initialActive}
      label={label}
      className={className}
    />
  );
}

interface ConnectedHeartProps {
  listingId: string;
  label?: string;
  className?: string;
}

function ConnectedHeart({
  listingId,
  label,
  className = "",
}: Readonly<ConnectedHeartProps>) {
  const { isFavorite, toggleFavorite, ready } = useFavorites();
  const active = ready && isFavorite(listingId);
  const resolvedLabel =
    label ?? (active ? "Quitar de favoritos" : "Guardar en favoritos");

  return (
    <button
      type="button"
      aria-label={resolvedLabel}
      aria-pressed={active}
      onClick={(e) => {
        // Prevent parent <Link> overlays from intercepting the click.
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(listingId);
      }}
      className={baseClasses(className)}
    >
      <Heart className={iconClasses(active)} aria-hidden />
    </button>
  );
}

interface LocalHeartProps {
  initialActive?: boolean;
  label?: string;
  className?: string;
}

function LocalHeart({
  initialActive = false,
  label = "Guardar en favoritos",
  className = "",
}: Readonly<LocalHeartProps>) {
  const [active, setActive] = useState(initialActive);
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setActive((v) => !v);
      }}
      className={baseClasses(className)}
    >
      <Heart className={iconClasses(active)} aria-hidden />
    </button>
  );
}

function baseClasses(extra: string): string {
  // Mobile: 44x44 (touch target minimum). sm+: 36x36 (denser cards on desktop).
  return `inline-flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[var(--color-surface)]/95 text-[var(--color-foreground)] shadow-[var(--shadow-sm)] backdrop-blur-sm transition-[color,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-px hover:text-[var(--color-brand-highlight)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${extra}`.trim();
}

function iconClasses(active: boolean): string {
  return `h-4 w-4 transition-transform duration-200 ease-[var(--ease-standard)] ${
    active
      ? "fill-[var(--color-brand-highlight)] text-[var(--color-brand-highlight)] scale-110"
      : ""
  }`.trim();
}
