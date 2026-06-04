"use client";

import Image from "next/image";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";

interface CardStackGalleryProps {
  images: ReadonlyArray<string>;
  altBase: string;
}

/**
 * Slow auto-advance interval (ms). Deliberately ambient — long enough
 * that the user does NOT register it as a slideshow (which would feel
 * intrusive on a profile page) but short enough that a passive viewer
 * sees the image rotate once before they look away. Paired with the
 * 1.6s slide transition below so the swap itself is unhurried.
 */
const AUTO_ADVANCE_MS = 12_000;

/**
 * "Abanico" (hand-fan) variants for the active card. Instead of sliding a
 * photo through a static window, the whole framed card SWINGS on a pivot at
 * its bottom edge — like a fan blade / a card being dealt off a deck. The
 * outgoing card fans away to one side while the incoming card swings up into
 * place from the opposite side, so the rotation we already show on the
 * stacked peek cards becomes the transition itself.
 *
 * `direction` is +1 for "next" and -1 for "prev". Paired with
 * `transform-origin: bottom center` on the card and the container's
 * perspective so the swing reads with a touch of depth.
 */
const FAN_VARIANTS: Variants = {
  enter: (direction: number) => ({
    rotate: direction > 0 ? 17 : -17,
    x: direction > 0 ? "26%" : "-26%",
    y: "6%",
    scale: 0.85,
    opacity: 0,
  }),
  center: {
    rotate: 0,
    x: "0%",
    y: "0%",
    scale: 1,
    opacity: 1,
  },
  exit: (direction: number) => ({
    rotate: direction > 0 ? -19 : 19,
    x: direction > 0 ? "-22%" : "22%",
    y: "5%",
    scale: 0.86,
    opacity: 0,
    transition: {
      rotate: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
      x: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
      y: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
      scale: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
      opacity: { duration: 0.42, ease: "easeIn" as const },
    },
  }),
};

const FAN_TRANSITION = {
  // Spring on the geometry so the incoming card settles with a soft, tactile
  // "snap" home (the satisfying bit of a fan opening); opacity is a plain
  // fade so the card is solid well before it finishes settling.
  rotate: { type: "spring", stiffness: 150, damping: 19, mass: 0.9 },
  x: { type: "spring", stiffness: 150, damping: 19, mass: 0.9 },
  y: { type: "spring", stiffness: 150, damping: 19, mass: 0.9 },
  scale: { type: "spring", stiffness: 150, damping: 19, mass: 0.9 },
  opacity: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
} as const;

/**
 * Card-stack gallery with an "abanico" (hand-fan) swing on photo change.
 *
 * Visual structure:
 *  - Back peek cards fan to one side behind the front card (a hand of cards),
 *    pivoting at their bottom edge; clicking one brings it forward.
 *  - The front layer holds the active CARD — its own rounded/bordered/shadowed
 *    frame with the photo inside. On change the whole card SWINGS on a
 *    bottom-edge pivot: the outgoing card fans away to one side while the
 *    incoming card swings up into place from the other (Framer Motion
 *    `AnimatePresence`, `mode="sync"` so the two overlap mid-swing).
 *
 * Direction is tracked in state so:
 *  - Arrow ► / auto-advance → card swings in from the RIGHT.
 *  - Arrow ◄ → card swings in from the LEFT.
 * Dot-tab navigation picks the shorter rotation distance.
 *
 * The geometry springs home for a tactile fan "snap"; opacity is a plain fade
 * so the card is solid before it settles. Honors `prefers-reduced-motion`
 * (the app-wide MotionConfig reduces the transforms).
 */
export function CardStackGallery({ images, altBase }: Readonly<CardStackGalleryProps>) {
  const locale = useActiveLocale();
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const total = images.length;

  const goNext = useCallback(() => {
    setDirection(1);
    setActiveIndex((i) => (i + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setActiveIndex((i) => (i - 1 + total) % total);
  }, [total]);

  /** Jump to a specific index, choosing the shorter rotation direction. */
  const goTo = useCallback(
    (target: number) => {
      if (target === activeIndex) return;
      const forwardDistance = (target - activeIndex + total) % total;
      const backwardDistance = (activeIndex - target + total) % total;
      setDirection(forwardDistance <= backwardDistance ? 1 : -1);
      setActiveIndex(target);
    },
    [activeIndex, total],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    }
    globalThis.addEventListener("keydown", onKey);
    return () => globalThis.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  // Auto-advance — same pause-on-hover/focus/hidden + reduced-motion guard
  // as before. Always advances right (direction = +1).
  const userPrefersReducedMotion = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    userPrefersReducedMotion.current = mq.matches;
    const onChange = () => {
      userPrefersReducedMotion.current = mq.matches;
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (total <= 1) return;
    if (userPrefersReducedMotion.current) return;
    if (paused) return;

    const id = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      setDirection(1);
      setActiveIndex((i) => (i + 1) % total);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [paused, total]);

  if (total === 0) return null;
  const activeSrc = images[activeIndex]!;

  return (
    <div className="flex flex-col gap-6">
      <div
        className="group/gallery relative mx-auto w-full max-w-[440px] aspect-[3/4] [perspective:1400px]"
        aria-roledescription={t(locale, "cardStackGallery.role")}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setPaused(false);
          }
        }}
      >
        {/* Back peek cards — decorative naipe stack behind the front
            frame. Click brings to front; the slide direction is chosen
            so the rotation feels natural (forward for upcoming images,
            backward for past ones). */}
        {images.map((src, i) => {
          if (i === activeIndex) return null;
          const offset = (i - activeIndex + total) % total;
          if (offset > 3) return null;
          const depth = Math.min(offset, 3);
          // Fan the upcoming cards to ONE side (abanico) instead of an
          // alternating shuffle, pivoting at the bottom so they spread like a
          // hand of cards — the same direction the next card swings in from.
          const rotate = 3 + depth * 4.5;
          const translateX = depth * 17;
          const translateY = depth * 6;
          const scale = 1 - depth * 0.05;

          return (
            <button
              key={`back-${i}`}
              type="button"
              aria-label={t(locale, "cardStackGallery.bringToFront.aria", {
                index: i + 1,
              })}
              onClick={() => goTo(i)}
              className="absolute inset-0 cursor-pointer rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)] transition-[transform,opacity,box-shadow,border-color] duration-700 ease-[var(--ease-standard)] focus:outline-none focus-visible:border-[var(--color-brand-primary)] focus-visible:shadow-[var(--shadow-glow-primary)]"
              style={{
                transformOrigin: "bottom center",
                transform: `translate3d(${translateX}px, ${translateY}px, ${
                  -depth * 40
                }px) rotate(${rotate}deg) scale(${scale})`,
                zIndex: total - depth,
              }}
            >
              <span className="absolute inset-0 overflow-hidden rounded-[var(--radius-2xl)]">
                <Image
                  src={src}
                  alt=""
                  aria-hidden
                  fill
                  sizes="(max-width: 768px) 90vw, 440px"
                  className="object-cover opacity-90"
                />
              </span>
            </button>
          );
        })}

        {/* Front layer — the whole framed CARD swings (abanico), so each
            card carries its own border/shadow/clip and pivots at its bottom
            edge. `preserve-3d` + the container perspective give the swing a
            hint of depth. Two cards co-exist mid-transition (one fanning out,
            one swinging in) — that overlap IS the fan. */}
        <div
          className="absolute inset-0 z-20 [transform-style:preserve-3d]"
        >
          <AnimatePresence custom={direction} initial={false} mode="sync">
            <motion.div
              key={activeIndex}
              custom={direction}
              variants={FAN_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={FAN_TRANSITION}
              // Pivot at the bottom edge so the card swings like a fan blade.
              style={{ transformOrigin: "bottom center" }}
              // Touch-swipe: drag horizontally past a threshold OR with enough
              // velocity → advance / rewind. Below it the spring snaps back.
              // Vertical drag is disabled so the page still scrolls.
              drag={total > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.35}
              dragMomentum={false}
              onDragEnd={(_, info) => {
                if (total <= 1) return;
                const SWIPE_DISTANCE = 80; // px
                const SWIPE_VELOCITY = 350; // px/s
                const off =
                  Math.abs(info.offset.x) * Math.abs(info.velocity.x);
                if (
                  info.offset.x < -SWIPE_DISTANCE ||
                  info.velocity.x < -SWIPE_VELOCITY ||
                  (info.offset.x < 0 && off > 28_000)
                ) {
                  goNext();
                } else if (
                  info.offset.x > SWIPE_DISTANCE ||
                  info.velocity.x > SWIPE_VELOCITY ||
                  (info.offset.x > 0 && off > 28_000)
                ) {
                  goPrev();
                }
              }}
              className="absolute inset-0 cursor-grab touch-pan-y overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)] will-change-[transform,opacity] [backface-visibility:hidden] active:cursor-grabbing"
            >
              <Image
                src={activeSrc}
                alt={t(locale, "cardStackGallery.image.alt", {
                  base: altBase,
                  index: activeIndex + 1,
                })}
                fill
                sizes="(max-width: 768px) 90vw, 440px"
                priority
                draggable={false}
                // Ken-burns pan rides on the image element; the card element
                // owns the fan transform — two transforms on separate
                // elements never conflict.
                className="select-none object-cover motion-safe:motion-gallery-pan-right"
              />

              {/* Inner ring — travels with the card so the frame stays
                  premium throughout the swing. */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[var(--radius-2xl)] ring-1 ring-inset ring-[var(--color-brand-primary)]/30"
              />

              {/* Hover affordance gradient. */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-20 bg-gradient-to-t from-[rgba(20,28,24,0.45)] via-[rgba(20,28,24,0.18)] to-transparent opacity-0 transition-opacity duration-500 ease-[var(--ease-standard)] group-hover/gallery:opacity-100"
              />

              <span
                aria-label={t(locale, "cardStackGallery.indicator", {
                  index: activeIndex + 1,
                  total,
                })}
                className="pointer-events-none absolute left-3 top-3 z-[6] inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[var(--color-surface)]/95 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-brand-primary)] shadow-[var(--shadow-sm)] backdrop-blur-sm"
              >
                {activeIndex + 1}/{total}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Ambient auto-advance progress hairline. Re-keys on every
            nav (manual or auto) so the fill restarts cleanly with the
            new slide. Hidden under prefers-reduced-motion. */}
        {total > 1 && (
          <span
            key={`auto-${activeIndex}`}
            aria-hidden
            data-paused={paused ? "true" : "false"}
            className="pointer-events-none absolute inset-x-6 bottom-3 z-[30] block h-px overflow-hidden rounded-full bg-[var(--color-surface)]/40 motion-reduce:hidden"
          >
            <span
              className="block h-full origin-left bg-gradient-to-r from-[var(--color-brand-primary)] via-[var(--color-gold)] to-[var(--color-brand-primary)]"
              style={{
                animation: `gallery-progress ${AUTO_ADVANCE_MS}ms linear forwards`,
                animationPlayState: paused ? "paused" : "running",
              }}
            />
          </span>
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={goPrev}
          aria-label={t(locale, "cardStackGallery.prev.aria")}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-[var(--shadow-sm)] transition-[border-color,background] duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>

        <div
          className="flex items-center gap-1.5"
          role="tablist"
          aria-label={t(locale, "cardStackGallery.tablist.aria")}
        >
          {images.map((src, i) => {
            const active = i === activeIndex;
            return (
              <button
                key={`${src}-dot-${i}`}
                role="tab"
                aria-selected={active}
                aria-label={t(locale, "cardStackGallery.tab.aria", {
                  index: i + 1,
                })}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ease-[var(--ease-standard)] ${
                  active
                    ? "w-7 bg-[var(--color-brand-primary)]"
                    : "w-2.5 bg-[var(--color-border)] hover:bg-[var(--color-text-subtle)]"
                }`}
              />
            );
          })}
        </div>

        <button
          type="button"
          onClick={goNext}
          aria-label={t(locale, "cardStackGallery.next.aria")}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-[var(--shadow-sm)] transition-[border-color,background] duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
