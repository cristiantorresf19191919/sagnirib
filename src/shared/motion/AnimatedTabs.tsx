"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";

interface TabItem {
  /** Stable identifier — used as React key. */
  id: string;
  href: string;
  label: ReactNode;
  active: boolean;
}

interface AnimatedTabsProps {
  /** Shared layoutId — every group of tabs needs a unique one if more than
   *  one set lives on the same page. */
  groupId: string;
  items: ReadonlyArray<TabItem>;
  /** Optional aria-label for the tablist wrapper. */
  ariaLabel?: string;
  className?: string;
}

const SPRING = { type: "spring", stiffness: 380, damping: 28 } as const;

/**
 * Underline-tab navigation — the active green dot animates between tabs
 * using shared `layoutId`. Inactive tabs stay quiet; hovering reveals the
 * dot in a faint state.
 */
export function AnimatedTabs({
  groupId,
  items,
  ariaLabel,
  className = "",
}: AnimatedTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex flex-wrap items-center gap-x-7 gap-y-3 ${className}`.trim()}
    >
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          role="tab"
          aria-current={item.active ? "true" : undefined}
          aria-selected={item.active}
          className={`relative inline-flex flex-col items-center gap-1.5 px-1 pb-1.5 pt-1 text-sm transition-colors duration-200 ease-[var(--ease-standard)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${
            item.active
              ? "font-bold text-[var(--color-foreground)]"
              : "font-medium text-[var(--color-text-muted)] hover:text-[var(--color-foreground)]"
          }`}
        >
          <span>{item.label}</span>
          {item.active && (
            <motion.span
              aria-hidden
              layoutId={`tab-indicator-${groupId}`}
              transition={SPRING}
              className="h-1 w-1 rounded-full bg-[var(--color-brand-primary)]"
            />
          )}
        </Link>
      ))}
    </div>
  );
}
