"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface MosaicDragSurfaceProps {
  className?: string;
  children: ReactNode;
}

const MAX_BOOST = 9; // top speed multiplier while flinging
const VELOCITY_TO_BOOST = 90; // px/ms → extra multiplier
const EASE = 0.16; // per-frame approach toward the target boost
const IDLE_DECAY = 60; // ms without movement before the boost starts winding down

/**
 * Press-and-drag accelerator for the editorial hero's cinema-reel mosaic.
 *
 * The three reels animate via pure CSS keyframes (Server Component, perfectly
 * seamless). This thin client wrapper lets a curious visitor "scrub" through
 * the cards faster: press and drag up/down and the reels speed up in
 * proportion to the drag velocity, then ease back to their calm cruising pace
 * on release.
 *
 * Speed is changed by reaching the running CSS animations through the Web
 * Animations API (`element.getAnimations()`) and setting `playbackRate` — that
 * scales speed WITHOUT recomputing position, so there is never the jump a
 * naive `animation-duration` change causes. A single rAF loop eases the rate
 * toward a target so accel/decel feel buttery.
 *
 * Critically, the mosaic tiles are `<Link>`s wrapping `next/image`s, and both
 * anchors and images are natively draggable — a press-and-move would otherwise
 * start an OS drag-and-drop (ghost image) and swallow every `pointermove`,
 * which is exactly why the gesture felt dead. We cancel native drag on the
 * whole surface (`dragstart` → preventDefault) and disable text selection so
 * the pointer stream stays intact. Clicks still pass through, so tapping a tile
 * still opens its profile.
 *
 * Desktop/tablet only (caller mounts it on the `lg:` mosaic). `touch-action:
 * none` lets a tablet drag drive the reel instead of scrolling the page.
 */
export function MosaicDragSurface({ className, children }: MosaicDragSurfaceProps) {
  const ref = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    dragging: false,
    pointerId: -1,
    lastY: 0,
    lastT: 0,
    boost: 1,
    target: 1,
    raf: 0,
    reduced: false,
    moved: 0, // cumulative |dy| this gesture — used to suppress a stray click
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
    // Inline style outranks the utility class; cleared once we settle.
    function applyRate(rate: number, forceRunning: boolean) {
      for (const track of tracks()) {
        track.style.animationPlayState = forceRunning ? "running" : "";
        const anims = track.getAnimations();
        for (const anim of anims) {
          anim.playbackRate = rate;
        }
      }
    }

    function tick(now: number) {
      // If the pointer has gone quiet for a beat while still held, let the
      // boost relax so holding-still doesn't keep it pinned at full speed.
      if (st.dragging && now - st.lastT > IDLE_DECAY) {
        st.target += (1 - st.target) * EASE;
      }
      st.boost += (st.target - st.boost) * EASE;
      if (!st.dragging) {
        st.target += (1 - st.target) * EASE;
      }
      const settled =
        !st.dragging &&
        Math.abs(st.boost - 1) < 0.01 &&
        Math.abs(st.target - 1) < 0.01;
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
      if (e.button !== 0 && e.pointerType === "mouse") return;
      st.dragging = true;
      st.pointerId = e.pointerId;
      st.lastY = e.clientY;
      st.lastT = e.timeStamp;
      st.moved = 0;
      try {
        el?.setPointerCapture?.(e.pointerId);
      } catch {
        /* capture may be unavailable */
      }
      ensureLoop();
    }

    function onPointerMove(e: PointerEvent) {
      if (!st.dragging || e.pointerId !== st.pointerId) return;
      const dy = e.clientY - st.lastY;
      const dt = Math.max(1, e.timeStamp - st.lastT);
      st.lastY = e.clientY;
      st.lastT = e.timeStamp;
      st.moved += Math.abs(dy);
      const velocity = Math.abs(dy) / dt; // px/ms
      // Bias toward the new (faster) reading so quick flings feel snappy.
      const next = Math.min(MAX_BOOST, 1 + velocity * VELOCITY_TO_BOOST);
      st.target = Math.max(st.target, next);
      ensureLoop();
    }

    function endDrag(e: PointerEvent) {
      if (st.pointerId !== -1 && e.pointerId !== st.pointerId) return;
      st.dragging = false;
      st.pointerId = -1;
      try {
        el?.releasePointerCapture?.(e.pointerId);
      } catch {
        /* capture may already be gone */
      }
      ensureLoop();
    }

    // Kill native link/image drag so the pointer stream isn't hijacked.
    function onDragStart(e: Event) {
      e.preventDefault();
    }

    // If the gesture was a real drag (not a tap), swallow the click so the
    // tile underneath doesn't navigate to a profile mid-scrub.
    function onClickCapture(e: MouseEvent) {
      if (st.moved > 8) {
        e.preventDefault();
        e.stopPropagation();
        st.moved = 0;
      }
    }

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
    el.addEventListener("lostpointercapture", endDrag);
    el.addEventListener("dragstart", onDragStart);
    el.addEventListener("click", onClickCapture, true);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointercancel", endDrag);
      el.removeEventListener("lostpointercapture", endDrag);
      el.removeEventListener("dragstart", onDragStart);
      el.removeEventListener("click", onClickCapture, true);
      if (st.raf) cancelAnimationFrame(st.raf);
      applyRate(1, false);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`${className ?? ""} select-none [&_a]:[-webkit-user-drag:none] [&_img]:[-webkit-user-drag:none]`}
      style={{ touchAction: "none", cursor: "grab", WebkitUserSelect: "none", userSelect: "none" }}
    >
      {children}
    </div>
  );
}
