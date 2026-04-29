"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId, useState, type ReactNode } from "react";

interface DisclosureProps {
  /**
   * Pre-rendered summary content. Style chevron rotation against
   * `group-aria-expanded:` since the trigger button carries
   * `aria-expanded`.
   */
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  /**
   * Class list for the trigger button. Consumers should include `group` so
   * descendants can react to `aria-expanded` via Tailwind's `group-aria-*`
   * variants.
   */
  triggerClassName?: string;
  contentClassName?: string;
  ariaLabel?: string;
}

const SPRING = { type: "spring", stiffness: 220, damping: 28, mass: 0.55 } as const;

/**
 * Animated, accessible disclosure. Replaces native `<details>` with a
 * controlled component so we get spring-eased height + opacity transitions.
 * `useReducedMotion` falls back to instant snap when the OS asks for
 * reduced motion.
 */
export function Disclosure({
  summary,
  children,
  defaultOpen = false,
  triggerClassName,
  contentClassName,
  ariaLabel,
}: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const reduceMotion = useReducedMotion();
  const regionId = useId();

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={regionId}
        aria-label={ariaLabel}
        className={triggerClassName}
      >
        {summary}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={regionId}
            key="content"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { ...SPRING, opacity: { duration: 0.18 } }
            }
            style={{ overflow: "hidden" }}
            className={contentClassName}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
