"use client";

import Image from "next/image";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
 * Slide variants for the active image. `direction` is +1 for "next"
 * (the new image enters from the right) and -1 for "prev". Easing is
 * deliberately soft so the swap feels like a slow magazine page-turn
 * rather than a UI carousel.
 */
const SLIDE_VARIANTS: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "62%" : "-62%",
    opacity: 0,
    scale: 0.97,
    filter: "blur(6px)",
  }),
  center: {
    x: "0%",
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-62%" : "62%",
    opacity: 0,
    scale: 0.97,
    filter: "blur(6px)",
  }),
};

const SLIDE_TRANSITION = {
  // Unhurried — the slide takes ~1.6s with a soft blur-and-settle
  // ease so the swap feels like a magazine page-turn rather than a
  // UI carousel. Opacity peaks faster than the slide finishes so the
  // overlap reads as a fluid fade between two pages.
  x: { duration: 1.6, ease: [0.22, 1, 0.36, 1] as const },
  opacity: { duration: 1.1, ease: [0.22, 1, 0.36, 1] as const },
  scale: { duration: 1.6, ease: [0.22, 1, 0.36, 1] as const },
  filter: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
};

/**
 * Card-stack gallery with a seamless right-to-left slide on the active
 * image.
 *
 * Visual structure:
 *  - Back peek cards (decorative naipe stack) sit behind, slightly
 *    rotated; clicking one brings it forward.
 *  - A static "frame" (rounded, bordered, shadowed) sits on top of the
 *    stack. The active image lives INSIDE the frame, animated through
 *    Framer Motion `AnimatePresence`. The frame stays put while the
 *    image slides across it — the visual is "window onto a continuous
 *    reel of photos", not "shuffling cards on a table".
 *
 * Direction is tracked in state so:
 *  - Arrow ► / auto-advance → new image enters from the RIGHT.
 *  - Arrow ◄ → new image enters from the LEFT.
 * Dot-tab navigation picks the shorter rotation distance.
 *
 * Slow, subtle: ~1.2s slide with a soft blur-out / blur-in, opacity
 * fade peaking faster than the slide so the overlap reads as a fluid
 * page-turn instead of a hard swap.
 */
export function CardStackGallery({ images, altBase }: Readonly<CardStackGalleryProps>) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const [autoTick, setAutoTick] = useState(0);
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
      setAutoTick((t) => t + 1);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [paused, total]);

  // Re-key the progress hairline on every nav so the fill restarts.
  useEffect(() => {
    setAutoTick((t) => t + 1);
  }, [activeIndex]);

  if (total === 0) return null;
  const activeSrc = images[activeIndex]!;

  return (
    <div className="flex flex-col gap-6">
      <div
        className="group/gallery relative mx-auto w-full max-w-[440px] aspect-[3/4] [perspective:1400px]"
        aria-roledescription="galería"
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
          const stackDir = i % 2 === 0 ? -1 : 1;
          const rotate = stackDir * (4 + depth * 1.5);
          const translateX = stackDir * (depth * 14);
          const translateY = depth * 10;
          const scale = 1 - depth * 0.04;

          return (
            <button
              key={`back-${i}`}
              type="button"
              aria-label={`Traer imagen ${i + 1} al frente`}
              onClick={() => goTo(i)}
              className="absolute inset-0 origin-center cursor-pointer rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)] transition-[transform,opacity,box-shadow,border-color] duration-700 ease-[var(--ease-standard)] focus:outline-none focus-visible:border-[var(--color-brand-primary)] focus-visible:shadow-[var(--shadow-glow-primary)]"
              style={{
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

        {/* Static front frame — the slide container. `overflow-hidden`
            clips the sliding image so it appears to move through a
            window. The bordered/shadowed shell stays fixed in place. */}
        <div
          aria-hidden={false}
          className="absolute inset-0 z-20 overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]"
        >
          <AnimatePresence custom={direction} initial={false} mode="sync">
            <motion.div
              key={activeIndex}
              custom={direction}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={SLIDE_TRANSITION}
              // Touch-swipe: drag horizontally past 22% of the frame
              // width OR with enough velocity → advance / rewind. Below
              // the threshold the spring snaps back. Vertical drag is
              // disabled so the page can still scroll through the
              // gallery comfortably.
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
              className="absolute inset-0 cursor-grab touch-pan-y will-change-[transform,opacity,filter] [backface-visibility:hidden] active:cursor-grabbing"
            >
              <Image
                src={activeSrc}
                alt={`${altBase} — imagen ${activeIndex + 1}`}
                fill
                sizes="(max-width: 768px) 90vw, 440px"
                priority
                draggable={false}
                // Ken-burns pan rides on top of the slide so once the
                // image has settled at center, it continues to drift
                // slightly to the right until the next swap. Two
                // transforms on separate elements never conflict.
                className="select-none object-cover motion-safe:motion-gallery-pan-right"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute left-3 top-3 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[var(--color-surface)]/95 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-brand-primary)] shadow-[var(--shadow-sm)] backdrop-blur-sm"
              >
                {activeIndex + 1}/{total}
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Static inner ring overlay — gives the frame its premium
              feel without re-rendering on swap. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[var(--radius-2xl)] ring-1 ring-inset ring-[var(--color-brand-primary)]/30"
          />

          {/* Hover affordance — surfaces "Click to navigate" hint when
              the user mouses over the frame. Subtle; only on pointer. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-20 bg-gradient-to-t from-[rgba(20,28,24,0.45)] via-[rgba(20,28,24,0.18)] to-transparent opacity-0 transition-opacity duration-500 ease-[var(--ease-standard)] group-hover/gallery:opacity-100"
          />
        </div>

        {/* Ambient auto-advance progress hairline. Re-keys on every
            cycle (including manual nav) so the fill never "skips"
            mid-stride. Hidden under prefers-reduced-motion. */}
        {total > 1 && (
          <span
            key={`auto-${autoTick}`}
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
          aria-label="Imagen anterior"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-[var(--shadow-sm)] transition-[border-color,background] duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>

        <div
          className="flex items-center gap-1.5"
          role="tablist"
          aria-label="Seleccionar imagen"
        >
          {images.map((src, i) => {
            const active = i === activeIndex;
            return (
              <button
                key={`${src}-dot-${i}`}
                role="tab"
                aria-selected={active}
                aria-label={`Imagen ${i + 1}`}
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
          aria-label="Imagen siguiente"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-[var(--shadow-sm)] transition-[border-color,background] duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
