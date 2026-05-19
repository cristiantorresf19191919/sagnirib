"use client";

import {
  motion,
  useInView,
  useReducedMotion,
  type TargetAndTransition,
  type Transition,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

interface CardRevealProps {
  children: ReactNode;
  /** Position of the card in the list — drives the per-row staircase delay. */
  index: number;
  /** Tag override. Defaults to `li` so it nests inside the catalog `<ul>`. */
  as?: "li" | "div" | "article";
  className?: string;
  "data-testid"?: string;
}

/*
 * Cascade tuning — a few values chosen carefully so the stagger reads as
 * one continuous wave rather than discrete steps:
 *  - TRAVEL is the vertical lift distance. 56 is large enough to feel like
 *    arrival but small enough that the user doesn't lose place.
 *  - The transition is a spring, not a bezier — gives the cards a slight
 *    settle that bezier ease-out lacks.
 *  - `index * STEP_DELAY` with no modulo. Past rows ~6 the visual cascade
 *    has already passed off-screen by the time later rows enter view, so
 *    bucketing was hiding cumulative drift. With viewport-triggered reveal
 *    (each card waits for IntersectionObserver), the per-row stagger only
 *    matters for the FIRST row above the fold — it's clamped by useInView
 *    waking each row independently afterward.
 */
const STEP_DELAY = 0.06;
const STEP_DELAY_CAP = 0.55;
const TRAVEL = 56;

const HIDDEN: TargetAndTransition = {
  opacity: 0,
  y: TRAVEL,
  scale: 0.96,
  filter: "blur(8px)",
};
const VISIBLE: TargetAndTransition = {
  opacity: 1,
  y: 0,
  scale: 1,
  filter: "blur(0px)",
};

const SPRING: Transition = {
  type: "spring",
  stiffness: 140,
  damping: 22,
  mass: 0.9,
};

/**
 * Per-card viewport-triggered cascade.
 *
 * Renders `motion.<tag>` unconditionally so SSR and CSR emit the same JSX
 * (otherwise `useReducedMotion()` returning `null` on server vs `true` on
 * a reduced-motion client diverges the markup and breaks hydration).
 *
 * Reveal logic:
 *  - Card is below the viewport → IntersectionObserver triggers on enter.
 *  - Card mounts already inside the viewport → revealed on next frame.
 *  - Card mounts ALREADY ABOVE the viewport (page reload mid-scroll, deep
 *    link, restored scroll position) → snap to visible immediately. Without
 *    this, IO never fires `isIntersecting: true` and the card sticks at
 *    `opacity: 0` forever — that's the "sometimes not running" case.
 *
 * Reduced-motion is honored by zeroing the transition duration; the cascade
 * still resolves to the visible state but with no perceptible motion.
 */
export function CardReveal({
  children,
  index,
  as = "li",
  className,
  "data-testid": testId,
}: CardRevealProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, {
    once: true,
    amount: 0.1,
    margin: "-60px 0px -60px 0px",
  });
  // `mountedAbove` is true only when the card was already past the viewport
  // top when it mounted — IntersectionObserver will never fire for it, so we
  // need to short-circuit to "visible" without running the cascade.
  const [mountedAbove, setMountedAbove] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    if (rect.bottom < 0) setMountedAbove(true);
    // Run once on mount; getBoundingClientRect is a one-time check.
  }, []);

  // Derived — no setState-in-effect cascade. The card reveals when IO fires
  // OR when we've detected it mounted above the viewport.
  const revealed = inView || mountedAbove;
  const skipAnimation = mountedAbove;

  // Delay capped so very long lists don't pile up: the cap means even a
  // 30th card waits at most ~0.55s instead of nearly two seconds.
  const delay = Math.min(index * STEP_DELAY, STEP_DELAY_CAP);

  const motionProps = {
    initial: HIDDEN,
    animate: revealed ? VISIBLE : HIDDEN,
    transition:
      reduced || skipAnimation
        ? { duration: 0 }
        : { ...SPRING, delay },
    style: { willChange: "transform, opacity, filter" } as const,
  };

  if (as === "div") {
    return (
      <motion.div
        ref={ref as unknown as React.RefObject<HTMLDivElement>}
        className={className}
        data-testid={testId}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
  if (as === "article") {
    return (
      <motion.article
        ref={ref as unknown as React.RefObject<HTMLElement>}
        className={className}
        data-testid={testId}
        {...motionProps}
      >
        {children}
      </motion.article>
    );
  }
  return (
    <motion.li
      ref={ref}
      className={className}
      data-testid={testId}
      {...motionProps}
    >
      {children}
    </motion.li>
  );
}
