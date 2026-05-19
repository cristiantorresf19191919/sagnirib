"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CardStackGalleryProps {
  images: ReadonlyArray<string>;
  altBase: string;
}

/**
 * Slow auto-advance interval (ms). Tuned to feel ambient — long enough
 * that the user doesn't perceive it as a slideshow, short enough that
 * a passive viewer sees motion before they look away. Paired with a
 * 1px progress hairline so the pacing is visible without being noisy.
 */
const AUTO_ADVANCE_MS = 7000;

/**
 * Stacked "naipe" gallery — every image is rendered as a card stacked behind
 * the active one with subtle rotation and offset. Click any back card or use
 * the arrows / arrow keys to bring it to the front. The transition is a
 * lift + slide swap so the deck feels like a real card hand.
 */
export function CardStackGallery({ images, altBase }: Readonly<CardStackGalleryProps>) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [autoTick, setAutoTick] = useState(0);
  const total = images.length;

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    }
    globalThis.addEventListener("keydown", onKey);
    return () => globalThis.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  // Slow, ambient auto-advance to the right. Pauses while the user is
  // hovering or focused inside the deck, while the document is hidden,
  // and when prefers-reduced-motion is on. `autoTick` keeps the
  // progress hairline re-keying so it restarts its 7s fill on every
  // cycle (including manual navigation).
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
      setActiveIndex((i) => (i + 1) % total);
      setAutoTick((t) => t + 1);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [paused, total]);

  // Reset the progress hairline whenever the user manually navigates so
  // it doesn't appear to "skip" mid-fill.
  useEffect(() => {
    setAutoTick((t) => t + 1);
  }, [activeIndex]);

  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      <div
        className="group/gallery relative mx-auto w-full max-w-[440px] aspect-[3/4] [perspective:1400px]"
        aria-roledescription="galería tipo naipes"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(e) => {
          // Only unpause when focus actually leaves the gallery (not when
          // it jumps between siblings).
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setPaused(false);
          }
        }}
      >
        {images.map((src, i) => {
          const offset = (i - activeIndex + total) % total;
          const isFront = offset === 0;
          const depth = Math.min(offset, 3);

          const direction = i % 2 === 0 ? -1 : 1;
          const rotate = isFront ? 0 : direction * (4 + depth * 1.5);
          const translateX = isFront ? 0 : direction * (depth * 14);
          const translateY = isFront ? 0 : depth * 10;
          const scale = isFront ? 1 : 1 - depth * 0.04;
          const opacity = offset > 3 ? 0 : 1;

          return (
            <button
              key={`${src}-${i}`}
              type="button"
              aria-label={
                isFront
                  ? `Imagen ${i + 1} de ${total}`
                  : `Traer imagen ${i + 1} al frente`
              }
              aria-current={isFront}
              tabIndex={isFront ? -1 : 0}
              onClick={() => setActiveIndex(i)}
              className="absolute inset-0 origin-center cursor-pointer rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)] transition-[transform,opacity,box-shadow,border-color] duration-[900ms] ease-[var(--ease-standard)] focus:outline-none focus-visible:border-[var(--color-brand-primary)] focus-visible:shadow-[var(--shadow-glow-primary)]"
              style={{
                transform: `translate3d(${translateX}px, ${translateY}px, ${
                  -depth * 40
                }px) rotate(${rotate}deg) scale(${scale})`,
                opacity,
                zIndex: total - depth + (isFront ? 10 : 0),
                pointerEvents: opacity === 0 ? "none" : "auto",
              }}
            >
              <span className="absolute inset-0 overflow-hidden rounded-[var(--radius-2xl)]">
                <Image
                  key={isFront ? `front-${activeIndex}` : `back-${i}`}
                  src={src}
                  alt={`${altBase} — imagen ${i + 1}`}
                  fill
                  sizes="(max-width: 768px) 90vw, 440px"
                  priority={i === 0}
                  className={`object-cover ${
                    isFront
                      ? "motion-safe:motion-gallery-pan-right"
                      : ""
                  }`}
                />
                {isFront && (
                  <>
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-3 top-3 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[var(--color-surface)]/95 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-brand-primary)] shadow-[var(--shadow-sm)] backdrop-blur-sm"
                    >
                      {i + 1}/{total}
                    </span>
                  </>
                )}
              </span>
              {isFront && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute -inset-px rounded-[var(--radius-2xl)] ring-1 ring-[var(--color-brand-primary)]/30"
                />
              )}
            </button>
          );
        })}

        {/* Ambient auto-advance progress hairline. Sits at the very
            bottom of the active card; fades to gold as it fills. Re-keys
            on every cycle (including manual nav) so the fill never
            "skips" mid-stride. Hidden under prefers-reduced-motion. */}
        {total > 1 && (
          <span
            key={`auto-${autoTick}`}
            aria-hidden
            data-paused={paused ? "true" : "false"}
            className="pointer-events-none absolute inset-x-6 bottom-3 z-20 block h-px overflow-hidden rounded-full bg-[var(--color-surface)]/40 motion-reduce:hidden"
          >
            <span
              className="block h-full origin-left bg-gradient-to-r from-[var(--color-brand-primary)] via-[var(--color-gold)] to-[var(--color-brand-primary)] data-[paused=true]:animation-play-state-paused"
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
                onClick={() => setActiveIndex(i)}
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
