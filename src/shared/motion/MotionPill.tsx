"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";

interface MotionPillProps {
  href: string;
  children: ReactNode;
  className?: string;
  active?: boolean;
  "aria-current"?: "page" | "true" | undefined;
  "aria-label"?: string;
}

const SPRING = { type: "spring", stiffness: 380, damping: 22 } as const;

/**
 * Animated pill — `motion.span` wraps a Next `<Link>`. The wrapper handles
 * the spring transform on hover/tap; the Link handles routing + prefetch.
 *
 * The wrapper uses `display: inline-flex` so it sits inline with text and
 * inherits flex children spacing from the Link's class list.
 */
export function MotionPill({
  href,
  children,
  className,
  active,
  ...rest
}: MotionPillProps) {
  return (
    <motion.span
      className="inline-flex"
      whileHover={{ y: -1, scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={SPRING}
      data-active={active ? "true" : undefined}
    >
      <Link href={href} className={className} {...rest}>
        {children}
      </Link>
    </motion.span>
  );
}
