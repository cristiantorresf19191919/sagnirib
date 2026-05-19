"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useState, useTransition } from "react";

interface LuckyButtonProps {
  /** Pool of profile slugs to pick from on click. */
  slugs: ReadonlyArray<string>;
  /** Optional className override merged into the button. */
  className?: string;
}

/**
 * "Me siento con suerte" — picks a random profile from the provided
 * slug pool and routes to `/p/{slug}`. Mirrors the Google idiom but
 * keeps it editorial: a soft spark + sparkle icon, micro-spin while the
 * transition is pending, and full keyboard accessibility (Enter / Space
 * trigger the same code path as click).
 *
 * Strategy: the parent server component injects the visible mosaic /
 * featured listings as the slug pool, so the button always lands on
 * something the user has at least subliminally seen. The pick happens
 * on the client so each click is independently random — no stale RSC
 * cache, no shared "lucky pick".
 */
export function LuckyButton({ slugs, className }: Readonly<LuckyButtonProps>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Track which slug was *last* served so two consecutive clicks never
  // route to the same profile. Lives in component state so a refresh
  // resets the memory — by design.
  const [lastSlug, setLastSlug] = useState<string | null>(null);

  const disabled = slugs.length === 0;

  const handleClick = () => {
    if (disabled) return;
    // Pick a fresh slug. If the previous pick is the only option, just
    // use it; otherwise re-roll until we get a different one (cheap
    // because the pool is tiny).
    let next = slugs[Math.floor(Math.random() * slugs.length)] ?? slugs[0]!;
    if (slugs.length > 1 && lastSlug !== null) {
      while (next === lastSlug) {
        next = slugs[Math.floor(Math.random() * slugs.length)] ?? slugs[0]!;
      }
    }
    setLastSlug(next);
    startTransition(() => {
      router.push(`/p/${next}`);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isPending}
      data-testid="lucky-button"
      aria-label="Me siento con suerte — abrir un perfil aleatorio"
      className={
        className ??
        "group/lucky relative inline-flex h-11 items-center gap-2 overflow-hidden rounded-full border border-[var(--color-gold)]/45 bg-[var(--color-cream-soft)] px-4 text-[13px] font-semibold text-[var(--color-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_8px_22px_-12px_rgba(31,61,46,0.22)] transition-[transform,border-color,box-shadow,background-color] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:border-[var(--color-gold)] hover:bg-[var(--color-cream)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_12px_28px_-12px_rgba(31,61,46,0.28)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      {/* Gold shimmer sweep on hover — same vocabulary as the search CTA. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/3 block w-1/3 bg-gradient-to-r from-transparent via-[rgba(200,166,118,0.55)] to-transparent opacity-0 group-hover/lucky:opacity-100 motion-safe:group-hover/lucky:motion-shimmer-sweep"
      />
      <Sparkles
        className={`relative h-3.5 w-3.5 text-[var(--color-gold-deep)] transition-transform duration-500 ease-[var(--ease-standard)] group-hover/lucky:rotate-12 ${
          isPending ? "motion-safe:animate-spin" : ""
        }`}
        aria-hidden
      />
      <span className="relative">Me siento con suerte</span>
    </button>
  );
}
