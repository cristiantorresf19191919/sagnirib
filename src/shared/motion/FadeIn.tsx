"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

interface FadeInProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  /** Pixel travel on the y axis. Defaults to 8px. */
  y?: number;
  /** Animation delay in seconds. */
  delay?: number;
  /** Duration in seconds. */
  duration?: number;
  /** Wait for element to scroll into view. */
  whenInView?: boolean;
}

/**
 * Lightweight single-element fade-up. Use for page entrances or section
 * intros where Reveal/RevealItem would be overkill (no children stagger
 * needed). Subtle by design: 8px travel, 0.45s duration.
 */
export function FadeIn({
  children,
  y = 8,
  delay = 0,
  duration = 0.45,
  whenInView = false,
  ...rest
}: FadeInProps) {
  const animation = whenInView
    ? {
        initial: { opacity: 0, y },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-40px" },
      }
    : {
        initial: { opacity: 0, y },
        animate: { opacity: 1, y: 0 },
      };

  return (
    <motion.div
      {...animation}
      transition={{ duration, delay, ease: [0.2, 0.8, 0.2, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
