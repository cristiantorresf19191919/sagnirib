"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface MosaicDragSurfaceProps {
  className?: string;
  children: ReactNode;
}

const MAX_BOOST = 7; // top speed multiplier while flinging
const VELOCITY_TO_BOOST = 0.06; // px/ms → extra multiplier
const EASE = 0.18; // per-frame approach toward the target boost

/**
 * Press-and-drag accelerator for the editorial hero's cinema-reel mosaic.
 *
 * The three reels animate via pure CSS keyframes (Server Component, perfectly
 * seamless). This thin client wrapper lets a curious visitor "scrub" through
 * the cards faster: press and drag up/down and the reels speed up in
 * proportion to the drag velocity, then ease back to their calm cruising pace
 * on release.
 *
 * We do this by reaching the running CSS animations through the Web Animations
 * API (`element.getAnimations()`) and setting `playbackRate`. Crucially, that
 * scales speed WITHOUT recomputing position — so there is never the jump a
 * naive `animation-duration` change would cause. A single rAF loop eases the
 * applied rate toward a target so accel/decel feel buttery, never twitchy.
 *
 * Desktop/tablet only (the caller mounts it on the `lg:` mosaic). `touch-action:
 * none` lets a tablet drag drive the reel instead of scrolling the page —
 * scoped to this surface so the rest of the page scrolls normally.
 */
export function MosaicDragSurface({ className, children }: MosaicDragSurfaceProps) {
  const ref = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    dragging: false,
    pointerId: -1,
    lastY: 0,
    lastT: 0,
    boost: 1, // currently applied multiplier
    target: 1, // multiplier we're easing toward
    raf: 0,
    reduced: false,
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const st = stateRef.current;
    st.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (st.reduced) return; // honor the preference — no scrub acceleration

    function tracks(): HTMLElement[] {
      return el
        ? (Array.from(el.querySelectorAll("[data-reel-track]")) as HTMLElement[])
        : [];
    }

    // `running` forces the reel to keep moving even while the mouse hovers a
    // column (the hover-to-pause class would otherwise freeze it mid-fling).
    // Inline style outranks the utility class; cleared once we settle so the
    // normal hover-to-pause behaviour returns.
    function applyRate(rate: number, forceRunning: boolean) {
      for (const track of tracks()) {
        track.style.animationPlayState = forceRunning ? "running" : "";
        for (const anim of track.getAnimations()) {
          anim.playbackRate = rate;
        }
      }
    }

    function tick() {
      // Ease the live boost toward the target; when released the target is 1.
      st.boost += (st.target - st.boost) * EASE;
      if (!st.dragging) {
        // Decay the target back to rest so a fling winds down on its own.
        st.target += (1 - st.target) * EASE;
      }
      const settled = !st.dragging && Math.abs(st.boost - 1) < 0.01 && Math.abs(st.target - 1) < 0.01;
      if (settled) {
        st.boost = 1;
        st.target = 1;
        applyRate(1, false);
        st.raf = 0;
        return;
      }
      applyRate(st.boost, st.dragging);
      st.raf = requestAnimationFrame(tick);
    }

    function ensureLoop() {
      if (!st.raf) st.raf = requestAnimationFrame(tick);
    }

    function onPointerDown(e: PointerEvent) {
      // Primary button / touch / pen only.
      if (e.button !== 0 && e.pointerType === "mouse") return;
      st.dragging = true;
      st.pointerId = e.pointerId;
      st.lastY = e.clientY;
      st.lastT = e.timeStamp;
      el?.setPointerCapture?.(e.pointerId);
      ensureLoop();
    }

    function onPointerMove(e: PointerEvent) {
      if (!st.dragging || e.pointerId !== st.pointerId) return;
      const dy = e.clientY - st.lastY;
      const dt = Math.max(1, e.timeStamp - st.lastT);
      st.lastY = e.clientY;
      st.lastT = e.timeStamp;
      const velocity = Math.abs(dy) / dt; // px/ms
      st.target = Math.min(MAX_BOOST, 1 + velocity * VELOCITY_TO_BOOST * 1000);
      ensureLoop();
    }

    function endDrag(e: PointerEvent) {
      if (e.pointerId !== st.pointerId) return;
      st.dragging = false;
      st.pointerId = -1;
      try {
        el?.releasePointerCapture?.(e.pointerId);
      } catch {
        /* capture may already be gone */
      }
      ensureLoop();
    }

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
    el.addEventListener("lostpointercapture", endDrag);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointercancel", endDrag);
      el.removeEventListener("lostpointercapture", endDrag);
      if (st.raf) cancelAnimationFrame(st.raf);
      applyRate(1, false);
    };
  }, []);

  return (
    <div ref={ref} className={className} style={{ touchAction: "none", cursor: "grab" }}>
      {children}
    </div>
  );
}
