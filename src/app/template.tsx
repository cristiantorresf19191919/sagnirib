"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * App-level page transition.
 *
 * Next 16 template.tsx re-mounts on every navigation (unlike layout.tsx),
 * so a motion wrapper here fires on each route change. Subtle on purpose —
 * 4px rise + opacity fade, easing out in <300ms. Respects prefers-reduced-
 * motion: skips the animation entirely.
 *
 * The `key={pathname}` is belt-and-braces — template should already give us
 * a fresh instance per navigation, but if a future Next refactor changes
 * that, the key keeps the transition firing.
 */
export default function Template({ children }: Readonly<{ children: ReactNode }>) {
  const reduced = useReducedMotion();
  const pathname = usePathname();

  if (reduced) return <>{children}</>;

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
