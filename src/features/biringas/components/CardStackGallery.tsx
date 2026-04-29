"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CardStackGalleryProps {
  images: ReadonlyArray<string>;
  altBase: string;
}

/**
 * Stacked "naipe" gallery — every image is rendered as a card stacked behind
 * the active one with subtle rotation and offset. Click any back card or use
 * the arrows / arrow keys to bring it to the front. The transition is a
 * lift + slide swap so the deck feels like a real card hand.
 */
export function CardStackGallery({ images, altBase }: Readonly<CardStackGalleryProps>) {
  const [activeIndex, setActiveIndex] = useState(0);
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

  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      <div
        className="relative mx-auto w-full max-w-[440px] aspect-[3/4] [perspective:1400px]"
        aria-roledescription="galería tipo naipes"
      >
        {images.map((src, i) => {
          // Position relative to the active card. Cards behind get progressive
          // rotation + offset so the stack reads as a fanned hand of naipes.
          const offset = (i - activeIndex + total) % total;
          const isFront = offset === 0;
          const depth = Math.min(offset, 3);

          // back cards fan out alternating left/right based on parity
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
              className="absolute inset-0 origin-center cursor-pointer rounded-[var(--radius-2xl)] border border-[var(--color-border)]/70 bg-[var(--color-surface)] shadow-[var(--shadow-lg)] transition-[transform,opacity,box-shadow,border-color] duration-500 ease-[var(--ease-standard)] focus:outline-none focus-visible:border-[var(--color-brand-primary)] focus-visible:shadow-[0_24px_60px_-12px_rgba(255,43,181,0.55)]"
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
                  src={src}
                  alt={`${altBase} — imagen ${i + 1}`}
                  fill
                  sizes="(max-width: 768px) 90vw, 440px"
                  priority={i === 0}
                  className="object-cover"
                />
                {/* Subtle gloss + bottom shade so it reads as a card */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-white/10 mix-blend-overlay"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[var(--color-background)]/85 via-[var(--color-background)]/30 to-transparent"
                />
                {/* Naipe corner marks on the active card only */}
                {isFront && (
                  <>
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-3 top-3 inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-[var(--color-background)]/70 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-brand-primary-soft)] backdrop-blur-sm"
                    >
                      {i + 1}/{total}
                    </span>
                    <span
                      aria-hidden
                      className="pointer-events-none absolute bottom-3 right-3 inline-flex h-7 min-w-7 rotate-180 items-center justify-center rounded-md bg-[var(--color-background)]/70 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-brand-primary-soft)] backdrop-blur-sm"
                    >
                      {i + 1}/{total}
                    </span>
                  </>
                )}
              </span>
              {/* Brand glow ring only on the active card */}
              {isFront && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute -inset-px rounded-[var(--radius-2xl)] ring-1 ring-[var(--color-brand-primary)]/40 shadow-[0_0_0_1px_rgba(255,43,181,0.18),0_24px_60px_-18px_rgba(255,43,181,0.55)]"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Imagen anterior"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/80 text-[var(--color-foreground)] transition-[border-color,background] duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary)]/60 hover:bg-[var(--color-surface)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
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
                    ? "w-7 bg-[var(--color-brand-primary)] shadow-[var(--shadow-glow-primary)]"
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
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/80 text-[var(--color-foreground)] transition-[border-color,background] duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary)]/60 hover:bg-[var(--color-surface)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
