"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
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

const STAGGER_BUCKET = 6;
const STEP_DELAY = 0.11;
const TRAVEL = 48;
const DURATION = 0.7;
const EASE = [0.22, 0.61, 0.36, 1] as const;

const HIDDEN = { opacity: 0, y: TRAVEL, scale: 0.97 } as const;
const VISIBLE = { opacity: 1, y: 0, scale: 1 } as const;

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
    amount: 0.15,
    margin: "-40px 0px -40px 0px",
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

  const motionProps = {
    initial: HIDDEN,
    animate: revealed ? VISIBLE : HIDDEN,
    transition:
      reduced || skipAnimation
        ? { duration: 0 }
        : {
            duration: DURATION,
            ease: EASE,
            delay: (index % STAGGER_BUCKET) * STEP_DELAY,
          },
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
