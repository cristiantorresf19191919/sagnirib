"use client";

import { Heart } from "lucide-react";
import { useState } from "react";

interface HeartButtonProps {
  /** Initial pressed state. Defaults to off. */
  initialActive?: boolean;
  /** Optional aria label override. */
  label?: string;
  className?: string;
}

/**
 * Favorite toggle. Presentational only — wires to mutations in a follow-up
 * PR. The pressed state lives locally so the affordance feels responsive
 * even before the action handler exists.
 */
export function HeartButton({
  initialActive = false,
  label = "Guardar en favoritos",
  className = "",
}: HeartButtonProps) {
  const [active, setActive] = useState(initialActive);
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={() => setActive((v) => !v)}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface)]/95 text-[var(--color-foreground)] shadow-[var(--shadow-sm)] backdrop-blur-sm transition-[color,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-px hover:text-[var(--color-brand-highlight)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${className}`.trim()}
    >
      <Heart
        className={`h-4 w-4 transition-colors ${
          active
            ? "fill-[var(--color-brand-highlight)] text-[var(--color-brand-highlight)]"
            : ""
        }`}
        aria-hidden
      />
    </button>
  );
}
