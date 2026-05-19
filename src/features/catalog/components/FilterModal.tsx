"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Maximize2, Minimize2, X } from "lucide-react";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

interface FilterModalProps {
  /** Trigger card rendered inline on the page. Click toggles the overlay. */
  trigger: ReactNode;
  /** Modal title rendered in the header bar. */
  title: string;
  /** Optional descriptive subtitle under the title. */
  subtitle?: string;
  /** Modal body — typically the filter form. */
  children: ReactNode;
}

const SPRING = { type: "spring", stiffness: 280, damping: 28, mass: 0.6 } as const;

const MOBILE_MQ = "(max-width: 639px)";

function subscribeMobile(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const mq = window.matchMedia(MOBILE_MQ);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MOBILE_MQ).matches;
}

/**
 * Overlay-based filter panel. Replaces the inline Disclosure so the page
 * content does not jump when filters open. Supports a maximized state for
 * mobile / power-filter sessions and a centered "card" state otherwise.
 *
 * Renders the trigger inline; the overlay is portaled to `document.body` so
 * stacking is independent of the page flow. Portal is only mounted when
 * `open === true`, which keeps SSR markup empty and avoids the hydration
 * mismatch that a mounted-state guard would create.
 */
export function FilterModal({
  trigger,
  title,
  subtitle,
  children,
}: FilterModalProps) {
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setMaximized(false);
  }, []);

  // Mobile bottom-sheet vs desktop centered card — picked at runtime via
  // matchMedia. useSyncExternalStore is the canonical React 19 pattern for
  // subscribing to external state (vs useState+useEffect, which trips the
  // set-state-in-effect rule). SSR snapshot is `false` so server markup
  // ships the desktop-friendly default.
  const isMobile = useSyncExternalStore(subscribeMobile, getMobile, () => false);

  // ESC to close, scroll lock while open, restore focus to trigger on close.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Capture the ref now — the cleanup below runs after this component may
    // have unmounted or re-rendered, and React's lint rule warns if we read
    // .current straight from the ref inside the cleanup.
    const triggerEl = triggerRef.current;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      triggerEl?.focus();
    };
  }, [open, close]);

  const overlay =
    typeof document !== "undefined" ? (
      <AnimatePresence>
        {open && (
        <motion.div
          key="overlay"
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:items-stretch"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
          aria-modal="true"
          role="dialog"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            aria-label="Cerrar filtros"
            onClick={close}
            className="absolute inset-0 cursor-default bg-[rgba(27,26,23,0.55)] backdrop-blur-sm"
          />

          <motion.div
            key={maximized ? "maximized" : "centered"}
            layout
            // Mobile: slide up from below as a bottom sheet. Desktop:
            // scale-in from center as a card. Picked at runtime from
            // matchMedia so SSR ships the desktop-friendly default.
            initial={
              reduceMotion
                ? { opacity: 0 }
                : isMobile
                  ? { opacity: 0, y: "100%" }
                  : { opacity: 0, scale: 0.96, y: 12 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : isMobile
                  ? { opacity: 0, y: "100%" }
                  : { opacity: 0, scale: 0.97, y: 8 }
            }
            transition={reduceMotion ? { duration: 0 } : SPRING}
            className={
              maximized
                ? "relative z-10 flex h-[100dvh] w-full flex-col overflow-hidden bg-[var(--color-background-elevated)] shadow-[var(--shadow-lg)] ring-1 ring-[var(--color-border)]"
                : "relative z-10 m-0 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[var(--radius-2xl)] bg-[var(--color-background-elevated)] shadow-[var(--shadow-lg)] ring-1 ring-[var(--color-border)] sm:m-4 sm:max-h-[88vh] sm:max-w-3xl sm:rounded-[var(--radius-2xl)] lg:max-w-4xl"
            }
          >
            {/* Top gold hairline — sits just inside the modal border, a
                tiny editorial flourish that telegraphs "premium tools"
                without adding chrome. Hidden on mobile bottom-sheet. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 hidden h-px bg-gradient-to-r from-transparent via-[var(--color-gold)]/55 to-transparent sm:block"
            />
            {/* Drag-handle affordance — bottom sheets need a visible cue
                that the surface can dismiss. Hidden on desktop where the
                X button + maximize button carry the affordance. */}
            {!maximized && (
              <span
                aria-hidden
                className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[var(--color-border)] sm:hidden"
              />
            )}
            <header className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 sm:px-7">
              <div className="flex flex-col gap-0.5">
                <h2
                  id={titleId}
                  className="text-base font-semibold tracking-tight text-[var(--color-foreground)] sm:text-lg"
                >
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {subtitle}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMaximized((value) => !value)}
                  aria-label={
                    maximized ? "Restaurar tamaño" : "Maximizar filtros"
                  }
                  className="hidden h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] sm:inline-flex"
                >
                  {maximized ? (
                    <Minimize2 className="h-4 w-4" aria-hidden />
                  ) : (
                    <Maximize2 className="h-4 w-4" aria-hidden />
                  )}
                </button>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Cerrar"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </header>

            {/* Scrolling body. The wrapper carries the padding; the
                inner `<div>` carries the soft scroll-fade mask so
                content fades into the header instead of slicing cleanly.
                Using `mask-image` here keeps the fade purely visual
                (does not affect hit-testing). */}
            <div
              className="relative flex-1 overflow-y-auto bg-[var(--color-background-elevated)] px-5 py-5 sm:px-7 sm:py-6"
              style={{
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0px, #000 14px, #000 calc(100% - 24px), transparent calc(100% - 4px))",
                maskImage:
                  "linear-gradient(to bottom, transparent 0px, #000 14px, #000 calc(100% - 24px), transparent calc(100% - 4px))",
              }}
            >
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="block w-full text-left"
      >
        {trigger}
      </button>
      {typeof document !== "undefined" && createPortal(overlay, document.body)}
    </>
  );
}
