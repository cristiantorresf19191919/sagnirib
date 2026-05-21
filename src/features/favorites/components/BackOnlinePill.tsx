"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useFavorites } from "@/features/favorites/store/use-favorites";

import {
  findOnlineFavorites,
  type OnlineFavorite,
} from "../actions/find-online-favorites";

const DISMISSED_KEY = "biringas:back-online:dismissed";
/** Poll interval — slow, ambient. Long enough that we don't hammer the
 *  catalog reader, short enough that a favorite flipping online
 *  surfaces within a minute. */
const POLL_INTERVAL_MS = 60_000;

function readDismissed(): ReadonlySet<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((s): s is string => typeof s === "string"));
  } catch {
    return new Set();
  }
}

function writeDismissed(ids: ReadonlySet<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
  } catch {
    // Quota / private-mode failures are non-fatal.
  }
}

/**
 * Floating retention pill — announces when a favorited listing flips
 * to `availableNow`. Mounted globally via `Providers` so the surface
 * is there on every route.
 *
 * Flow:
 *   1. Read favorites from the existing localStorage store.
 *   2. Ask the server-side `findOnlineFavorites(ids)` action which of
 *      those are currently online.
 *   3. Render up to 2 pills slide-in from below-right, deduped
 *      against a per-id dismissed set (also localStorage so a
 *      dismissal sticks across reloads for the same online event).
 *   4. Re-poll every 60s while the tab is visible so the surface
 *      stays fresh without spamming the server.
 *
 * Renders nothing when the user has zero favorites or none of them
 * are online — invisible by default.
 */
export function BackOnlinePill() {
  const { favorites, ready } = useFavorites();
  const [online, setOnline] = useState<ReadonlyArray<OnlineFavorite>>([]);
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(
    () => readDismissed(),
  );

  useEffect(() => {
    if (!ready) return;
    if (favorites.length === 0) return;

    let cancelled = false;
    let timeoutId: number | null = null;

    const tick = async () => {
      // Skip polling when the user has switched tabs — keeps mobile
      // battery happy and avoids the server thinking the catalog is
      // hotter than it is.
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        schedule();
        return;
      }
      try {
        const next = await findOnlineFavorites([...favorites]);
        if (!cancelled) setOnline(next);
      } catch {
        // Network blips are not surfaced — the pill is purely additive.
      }
      schedule();
    };

    const schedule = () => {
      if (cancelled) return;
      timeoutId = window.setTimeout(tick, POLL_INTERVAL_MS);
    };

    tick();
    return () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [ready, favorites]);

  // Filter against the current favorites list so stale online entries
  // (left over from a previous favorites set) never render after the
  // user un-favorites a listing. Cheaper than resetting state from
  // within the effect body, and side-steps `react-hooks/set-state-in-effect`.
  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);
  const visible = useMemo(
    () =>
      online
        .filter((o) => favoritesSet.has(o.id))
        .filter((o) => !dismissed.has(o.id))
        .slice(0, 2),
    [online, dismissed, favoritesSet],
  );

  const dismissOne = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    writeDismissed(next);
  };

  if (visible.length === 0) return null;

  return (
    <aside
      aria-live="polite"
      aria-label="Favoritas disponibles ahora"
      className="pointer-events-none fixed bottom-4 left-1/2 z-[110] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0 sm:px-0"
    >
      <AnimatePresence initial={false}>
        {visible.map((fav) => (
          <motion.div
            key={fav.id}
            layout
            initial={{ opacity: 0, y: 18, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 26,
              mass: 0.55,
            }}
            className="pointer-events-auto relative flex items-center gap-3 overflow-hidden rounded-full border border-[var(--color-brand-primary)]/35 bg-[var(--color-surface)] py-2 pl-3 pr-3 shadow-[var(--shadow-lg)] ring-1 ring-[var(--color-brand-primary)]/15"
          >
            {/* Live dot */}
            <span
              aria-hidden
              className="relative inline-flex h-2 w-2 shrink-0 items-center justify-center"
            >
              <span className="absolute inset-0 rounded-full bg-[var(--color-brand-primary)] opacity-70 motion-safe:motion-pulse-ring" />
              <span className="relative inline-block h-2 w-2 rounded-full bg-[var(--color-brand-primary)]" />
            </span>

            <Link
              href={`/p/${fav.slug}`}
              className="flex min-w-0 flex-1 items-center gap-2"
              onClick={() => dismissOne(fav.id)}
            >
              <Sparkles
                className="h-3.5 w-3.5 shrink-0 text-[var(--color-gold)]"
                aria-hidden
              />
              <span className="min-w-0 truncate text-sm text-[var(--color-foreground)]">
                <span className="font-semibold">{fav.name}</span>{" "}
                <span className="text-[var(--color-text-muted)]">
                  está en línea
                </span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => dismissOne(fav.id)}
              aria-label={`Ocultar aviso de ${fav.name}`}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </aside>
  );
}
