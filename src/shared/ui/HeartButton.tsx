"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
 *
 * Visual feedback on toggle-on:
 *   1. Icon scale-punch (1 → 1.3 → 1.1 spring)
 *   2. Brick-red ring that expands and fades out from the button
 * Both are skipped under prefers-reduced-motion.
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

  const { popKey, fire } = usePop();
  const reduced = useReducedMotion();

  return (
    <button
      type="button"
      aria-label={resolvedLabel}
      aria-pressed={active}
      onClick={(e) => {
        // Prevent parent <Link> overlays from intercepting the click.
        e.preventDefault();
        e.stopPropagation();
        const next = !active;
        toggleFavorite(listingId);
        // Only fire the pop when toggling ON — releasing a favorite
        // shouldn't celebrate.
        if (next && !reduced) fire();
      }}
      className={baseClasses(className)}
    >
      <HeartIcon active={active} popKey={popKey} reduced={!!reduced} />
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
  const { popKey, fire } = usePop();
  const reduced = useReducedMotion();

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setActive((v) => {
          const next = !v;
          if (next && !reduced) fire();
          return next;
        });
      }}
      className={baseClasses(className)}
    >
      <HeartIcon active={active} popKey={popKey} reduced={!!reduced} />
    </button>
  );
}

interface HeartIconProps {
  active: boolean;
  popKey: number;
  reduced: boolean;
}

function HeartIcon({ active, popKey, reduced }: Readonly<HeartIconProps>) {
  return (
    <span className="relative inline-flex h-4 w-4 items-center justify-center">
      <motion.span
        // Spring punch on every fire. Key bump remounts the motion node
        // so the animation re-fires reliably even when active state hasn't
        // flipped (e.g. rapid toggles).
        key={popKey}
        initial={reduced ? false : { scale: active ? 1 : 1 }}
        animate={
          reduced
            ? undefined
            : popKey > 0
              ? { scale: [1, 1.3, 1.1] }
              : { scale: active ? 1.1 : 1 }
        }
        transition={
          reduced
            ? undefined
            : popKey > 0
              ? { duration: 0.42, ease: [0.22, 1, 0.36, 1], times: [0, 0.5, 1] }
              : { type: "spring", stiffness: 320, damping: 20 }
        }
        className="inline-flex"
      >
        <Heart
          className={
            active
              ? "h-4 w-4 fill-[var(--color-brand-highlight)] text-[var(--color-brand-highlight)]"
              : "h-4 w-4 text-current"
          }
          aria-hidden
        />
      </motion.span>

      {/* Radiating ring — only on toggle-on. AnimatePresence handles
          the cleanup so the ring vanishes cleanly after one cycle. */}
      <AnimatePresence>
        {!reduced && popKey > 0 && (
          <motion.span
            key={`ring-${popKey}`}
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-[var(--color-brand-highlight)]"
            initial={{ scale: 0.6, opacity: 0.55 }}
            animate={{ scale: 2.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
    </span>
  );
}

/**
 * Tiny hook — emits a monotonically increasing key each time `fire()` is
 * called, so motion nodes that use the key remount and re-run their
 * animation. Resets back to 0 after the animation window so the next
 * mount of the parent doesn't auto-fire.
 */
function usePop() {
  const [popKey, setPopKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return {
    popKey,
    fire() {
      setPopKey((k) => k + 1);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setPopKey(0), 600);
    },
  };
}

function baseClasses(extra: string): string {
  // Mobile: 44x44 (touch target minimum). sm+: 36x36 (denser cards on desktop).
  return `inline-flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[var(--color-surface)]/95 text-[var(--color-foreground)] shadow-[var(--shadow-sm)] backdrop-blur-sm transition-[color,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-px hover:text-[var(--color-brand-highlight)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${extra}`.trim();
}
