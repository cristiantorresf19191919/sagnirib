"use client";

import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

import { useActiveLocale } from "@/core/i18n/use-active-locale";
import { t } from "@/core/i18n/messages";

import type { StepId } from "../lib/types";

export interface StepDescriptor {
  id: StepId;
  number: number;
  title: string;
  description: string;
}

interface StepperProps {
  steps: ReadonlyArray<StepDescriptor>;
  current: StepId;
  /** Steps that have been visited and validated. */
  completed: ReadonlyArray<StepId>;
  /** When provided, the user can jump to any visited step. */
  onJump?: (id: StepId) => void;
}

/**
 * Card-style stepper. The active state is a single shared element
 * (`layoutId="stepper-active"`): when the step changes, framer-motion glides
 * the white highlight — its forest border, glow and gold hairline — from the
 * old card to the new one, so progress reads as one continuous motion rather
 * than two cards blinking. Completed cards swap their numeral for a check.
 *
 * The highlight lives at the `<li>` level (not inside the `overflow-hidden`
 * card) so the slide is never clipped; the active `<li>` is raised with `z-10`
 * so the travelling highlight always passes over its neighbours.
 *
 * Restrained palette by design — forest + cream + a single gold hairline.
 * Honors `prefers-reduced-motion`: the highlight snaps instead of sliding.
 */
export function Stepper({ steps, current, completed, onJump }: StepperProps) {
  const locale = useActiveLocale();
  const reduced = useReducedMotion();

  return (
    <ol
      role="list"
      aria-label={t(locale, "publicar.stepper.aria")}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
    >
      {steps.map((step, index) => {
        const isActive = step.id === current;
        const isDone = completed.includes(step.id);
        const isClickable = Boolean(onJump) && (isDone || isActive);

        const ringTone = isActive
          ? "bg-[var(--color-brand-primary)] text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)]"
          : isDone
            ? "bg-[var(--color-brand-primary-soft)] text-[var(--color-foreground)]"
            : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] group-hover/step:bg-[var(--color-brand-primary-soft)] group-hover/step:text-[var(--color-foreground)]";

        // Active pill is a touch larger so the eye lands on the live step.
        const ringSize = isActive ? "h-10 w-10 text-base" : "h-9 w-9 text-sm";

        // Active card is transparent — the shared highlight behind it paints
        // the surface, border and glow so they can travel between cards.
        const baseCls = `group/step relative z-[1] flex h-full flex-col gap-4 overflow-hidden rounded-[var(--radius-xl)] border p-5 text-left transition-[transform,box-shadow] duration-[240ms] ease-[var(--ease-standard)] ${
          isActive
            ? "border-transparent bg-transparent"
            : "border-[var(--color-border)] bg-[var(--color-background-elevated)] shadow-[var(--shadow-sm)]"
        }`;
        const interactiveCls = isClickable
          ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          : "cursor-default";

        const Inner = (
          <>
            <span className="relative flex flex-col gap-1.5">
              <span
                className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${
                  isActive
                    ? "text-[var(--color-brand-primary)]"
                    : "text-[var(--color-text-subtle)]"
                }`}
              >
                {t(locale, "publicar.stepper.stepLabel", {
                  number: String(step.number).padStart(2, "0"),
                })}
              </span>
              <span className="text-lg font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
                {step.title}
              </span>
              <span className="max-w-[18ch] text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                {step.description}
              </span>
            </span>
            {/* Footer row — number hugs the bottom-right across the row. */}
            <span className="relative mt-auto flex items-center justify-end">
              <span
                aria-hidden
                className={`inline-flex items-center justify-center rounded-[var(--radius-md)] font-bold transition-[background,color,transform] duration-[240ms] ease-[var(--ease-standard)] group-hover/step:scale-105 ${ringSize} ${ringTone}`}
              >
                {isDone && !isActive ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : (
                  step.number
                )}
              </span>
            </span>
          </>
        );

        return (
          <li
            key={step.id}
            className={`relative motion-step-rise ${isActive ? "z-10" : ""}`}
            style={{ "--step-i": index } as CSSProperties}
          >
            {/* Shared, gliding highlight — only ever one in the DOM. */}
            {isActive && (
              <motion.span
                layoutId="stepper-active"
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-brand-primary)] bg-[var(--color-surface)] shadow-[var(--shadow-glow-primary)]"
                transition={
                  reduced
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 360, damping: 32 }
                }
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[var(--color-brand-primary)] via-[var(--color-gold)] to-transparent"
                />
              </motion.span>
            )}

            {isClickable ? (
              <button
                type="button"
                onClick={() => onJump?.(step.id)}
                className={`${baseCls} ${interactiveCls} w-full`}
                aria-current={isActive ? "step" : undefined}
              >
                {Inner}
              </button>
            ) : (
              <div
                className={`${baseCls} ${interactiveCls}`}
                aria-current={isActive ? "step" : undefined}
              >
                {Inner}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
