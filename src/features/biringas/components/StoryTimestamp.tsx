"use client";

import { useEffect, useState } from "react";

interface StoryTimestampProps {
  /** ISO datetime of the story. */
  storyAt: string;
  /** Visual variant — "pill" (default, for grid cards) or "inline" (list view). */
  variant?: "pill" | "inline";
}

interface Relative {
  label: string;
  /** Recent enough to warrant a pulsing dot — under 30 minutes. */
  recent: boolean;
}

function compute(storyAt: string): Relative {
  const ms = Date.now() - new Date(storyAt).getTime();
  const minutes = Math.max(0, Math.floor(ms / 60000));
  if (minutes < 1) return { label: "ahora", recent: true };
  if (minutes < 60) return { label: `hace ${minutes} min`, recent: minutes < 30 };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { label: `hace ${hours} h`, recent: false };
  const days = Math.floor(hours / 24);
  return { label: `hace ${days} d`, recent: false };
}

/**
 * Story freshness pill — shows "hace X min/h/d" relative to the listing's
 * storyAt, with a brick-red pulsing dot when under 30 minutes old. Updates
 * every minute on the client; SSR renders the initial relative value (drift
 * vs. client clock is suppressed via suppressHydrationWarning since it's
 * cosmetic and self-corrects within a frame).
 */
export function StoryTimestamp({
  storyAt,
  variant = "pill",
}: Readonly<StoryTimestampProps>) {
  const [state, setState] = useState<Relative>(() => compute(storyAt));

  useEffect(() => {
    // Re-syncs every minute. setState inside an interval callback (rather
    // than directly in the effect body) is what the React 19 set-state-in-
    // effect rule allows — initial value comes from useState's lazy init.
    const id = setInterval(() => setState(compute(storyAt)), 60_000);
    return () => clearInterval(id);
  }, [storyAt]);

  if (variant === "inline") {
    return (
      <span
        className="inline-flex items-center gap-1.5"
        suppressHydrationWarning
      >
        {state.recent && (
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-brand-highlight)] motion-safe:motion-hero-pulse"
          />
        )}
        {state.label}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface)]/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-highlight)] shadow-[var(--shadow-sm)] backdrop-blur-sm"
      suppressHydrationWarning
    >
      {state.recent && (
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-brand-highlight)] motion-safe:motion-hero-pulse"
        />
      )}
      {state.label}
    </span>
  );
}
