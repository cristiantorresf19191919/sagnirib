"use client";

import { animate, useInView, useMotionValue, useTransform } from "framer-motion";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

interface CountUpProps {
  /** Final value to animate to. */
  to: number;
  /** Animation duration in seconds. Defaults to 1.2s. */
  duration?: number;
  /** Optional className applied to the rendered span. */
  className?: string;
}

/**
 * Animates a number from 0 to `to` once when it scrolls into view. The
 * server still renders the final value as a fallback (announcing the right
 * count to screen readers and keeping SSR output meaningful).
 */
export function CountUp({ to, duration = 1.2, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => Math.round(latest));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionValue, to, {
      duration,
      ease: [0.2, 0.8, 0.2, 1],
    });
    return () => controls.stop();
  }, [inView, motionValue, to, duration]);

  return (
    <span ref={ref} className={className} aria-label={String(to)}>
      <motion.span aria-hidden>{rounded}</motion.span>
    </span>
  );
}
