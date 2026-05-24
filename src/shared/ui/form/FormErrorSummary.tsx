"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ChevronRight } from "lucide-react";

interface SummaryItem {
  /** Field id matching the ValidatedField's `id` prop. */
  fieldId: string;
  /** Field label as it appears in the form. */
  label: string;
  /** Error message. */
  message: string;
}

interface FormErrorSummaryProps {
  /** When empty / undefined, the summary collapses out. */
  items: ReadonlyArray<SummaryItem>;
  /** Heading rendered above the list. */
  heading: string;
  /** Optional handler invoked when the user clicks a summary item. */
  onJumpTo?: (fieldId: string) => void;
}

/**
 * Compact list of validation errors shown at the top of a long form.
 *
 * Renders nothing when `items` is empty (collapses via AnimatePresence).
 * Each item is a button that focuses the corresponding field — used by
 * the publisher wizard to scroll-and-shake the offending control.
 */
export function FormErrorSummary({
  items,
  heading,
  onJumpTo,
}: Readonly<FormErrorSummaryProps>) {
  return (
    <AnimatePresence initial={false}>
      {items.length > 0 ? (
        <motion.div
          key="summary"
          role="alert"
          aria-live="polite"
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-brand-highlight)]/35 bg-[var(--color-brand-highlight)]/8 p-4"
        >
          <div className="flex items-start gap-2.5">
            <span
              aria-hidden
              className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-highlight)]/15 text-[var(--color-brand-highlight)] ring-1 ring-[var(--color-brand-highlight)]/30"
            >
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            </span>
            <div className="flex min-w-0 flex-col gap-2">
              <span className="text-sm font-semibold text-[var(--color-foreground)]">
                {heading}
              </span>
              <ul className="flex flex-col gap-1">
                {items.map((item) => (
                  <li key={item.fieldId}>
                    <button
                      type="button"
                      onClick={() => onJumpTo?.(item.fieldId)}
                      className="group inline-flex items-center gap-1.5 rounded-sm text-left text-[12px] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-highlight)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
                    >
                      <ChevronRight
                        className="h-3 w-3 text-[var(--color-brand-highlight)] transition-transform duration-200 group-hover:translate-x-0.5"
                        aria-hidden
                      />
                      <span className="font-semibold text-[var(--color-foreground)]">
                        {item.label}:
                      </span>
                      <span>{item.message}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
