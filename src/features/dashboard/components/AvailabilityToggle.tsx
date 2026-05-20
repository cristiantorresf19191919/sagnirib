"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { toast } from "@/shared/ui/toast";

import { setListingAvailability } from "../actions/set-listing-availability";

interface AvailabilityToggleProps {
  listingSlug: string;
  /** Current `availableNow` value read from the listing by the SSR caller. */
  initialAvailable: boolean;
}

/**
 * Owner-facing toggle for `availableNow`.
 *
 * Optimistic UI: flips immediately, dispatches the Server Action in
 * the background, rolls back the visible state on failure. The
 * underlying listing read invalidates via `updateTag` in the barrel,
 * so the next page navigation already sees the fresh value without a
 * router refresh from this component.
 *
 * Design: pill switch — left half "Sí" (live) + right half "Off"
 * (pause). Mirrors the visual language of the catalog's "Disponible
 * ahora" badge so the modelo intuitively understands what she's
 * toggling.
 */
export function AvailabilityToggle({
  listingSlug,
  initialAvailable,
}: Readonly<AvailabilityToggleProps>) {
  const [available, setAvailable] = useState(initialAvailable);
  const [pending, startTransition] = useTransition();

  function flip(next: boolean) {
    if (pending || next === available) return;
    const previous = available;
    setAvailable(next);
    startTransition(async () => {
      const res = await setListingAvailability({
        slug: listingSlug,
        available: next,
      });
      if (res.ok) {
        toast.success(
          next
            ? "Estás visible como disponible ahora."
            : "Pausada — ya no aparecés como disponible ahora.",
        );
        return;
      }
      setAvailable(previous);
      toast.error(
        "No pudimos actualizar tu disponibilidad",
        res.error?.message ?? "Probá de nuevo en un momento.",
      );
    });
  }

  return (
    <div
      role="group"
      aria-label="Disponibilidad ahora"
      className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-[var(--shadow-sm)]"
    >
      <button
        type="button"
        aria-pressed={available}
        disabled={pending}
        onClick={() => flip(true)}
        className={
          "relative inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold transition-[background,color] " +
          (available
            ? "bg-[var(--color-brand-primary)] text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)]"
            : "text-[var(--color-text-muted)] hover:text-[var(--color-foreground)]")
        }
      >
        {available && pending ? (
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
        ) : (
          <span
            aria-hidden
            className={
              "h-1.5 w-1.5 rounded-full " +
              (available
                ? "bg-[var(--color-surface)] motion-safe:animate-pulse"
                : "bg-[var(--color-text-subtle)]")
            }
          />
        )}
        Disponible ahora
      </button>
      <button
        type="button"
        aria-pressed={!available}
        disabled={pending}
        onClick={() => flip(false)}
        className={
          "inline-flex h-7 items-center rounded-full px-3 text-[11px] font-semibold transition-[background,color] " +
          (!available
            ? "bg-[var(--color-foreground)] text-[var(--color-surface)]"
            : "text-[var(--color-text-muted)] hover:text-[var(--color-foreground)]")
        }
      >
        {!available && pending ? (
          <Loader2 className="mr-1.5 h-3 w-3 animate-spin" aria-hidden />
        ) : null}
        Pausada
      </button>
    </div>
  );
}
