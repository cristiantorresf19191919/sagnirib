"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

const HOVER = { y: -4, transition: { type: "spring", stiffness: 320, damping: 22 } } as const;
const TAP = { scale: 0.985, transition: { duration: 0.12 } } as const;

interface MotionCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  /** Disable the hover spring (e.g. when the card is non-interactive). */
  disableHover?: boolean;
}

/**
 * Card surface wrapper that adds a subtle spring lift on hover. Replaces
 * raw CSS `hover:-translate-y-0.5` so cards feel responsive and physical
 * instead of stiff. Renders a `motion.div`; consumers keep full control of
 * their inner layout.
 */
export function MotionCard({
  children,
  disableHover = false,
  ...rest
}: MotionCardProps) {
  return (
    <motion.div
      whileHover={disableHover ? undefined : HOVER}
      whileTap={disableHover ? undefined : TAP}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
