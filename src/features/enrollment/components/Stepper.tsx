"use client";

import type { CSSProperties } from "react";
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
 * Card-style stepper inspired by the reference image. Active card is
 * outlined in brand primary, the numeral sits in a coloured tile in the
 * bottom-right corner, completed steps swap the numeral for a check.
 *
 * On mobile the cards collapse into a single horizontal scroll row so the
 * user always sees their position without overflowing the viewport.
 */
export function Stepper({ steps, current, completed, onJump }: StepperProps) {
  const locale = useActiveLocale();
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
        const tone = isActive
          ? "border-[var(--color-brand-primary)] bg-[var(--color-surface)] shadow-[var(--shadow-glow-primary)]"
          : isDone
            ? "border-[var(--color-brand-primary-soft)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]"
            : "border-[var(--color-border)] bg-[var(--color-background-elevated)] shadow-[var(--shadow-sm)]";
        const ringTone = isActive
          ? "bg-[var(--color-brand-primary)] text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)]"
          : isDone
            ? "bg-[var(--color-brand-primary-soft)] text-[var(--color-foreground)]"
            : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] group-hover/step:bg-[var(--color-brand-primary-soft)] group-hover/step:text-[var(--color-foreground)]";

        // Active pill is a touch larger so the eye lands on the live step.
        const ringSize = isActive ? "h-10 w-10 text-base" : "h-9 w-9 text-sm";

        const baseCls = `group/step relative flex h-full flex-col gap-4 overflow-hidden rounded-[var(--radius-xl)] border p-5 text-left transition-[border-color,background,box-shadow,transform] duration-[240ms] ease-[var(--ease-standard)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] ${tone}`;
        const interactiveCls = isClickable
          ? "cursor-pointer hover:-translate-y-1 hover:border-[var(--color-brand-primary)] hover:shadow-[var(--shadow-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          : "cursor-default";

        const Inner = (
          <>
            {/* Active-card top accent: brand → gold hairline that "draws"
                in from the left when the card becomes active — gives the
                step change a crisp visual cue without extra copy. */}
            <span
              aria-hidden
              className={`pointer-events-none absolute inset-x-0 top-0 h-[3px] origin-left bg-gradient-to-r from-[var(--color-brand-primary)] via-[var(--color-gold)] to-transparent transition-transform duration-[400ms] ease-[var(--ease-standard)] ${
                isActive ? "scale-x-100" : "scale-x-0"
              }`}
            />

            {/* Hover sheen — same vocabulary as the header CTAs. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-1/3 block w-1/3 bg-gradient-to-r from-transparent via-[var(--color-gold)]/35 to-transparent opacity-0 group-hover/step:opacity-100 motion-safe:group-hover/step:motion-shimmer-sweep"
            />

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
              <span
                className={`text-lg font-semibold leading-tight tracking-tight ${
                  isActive
                    ? "text-[var(--color-foreground)]"
                    : "text-[var(--color-foreground)]/90"
                }`}
              >
                {step.title}
              </span>
              <span className="max-w-[18ch] text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                {step.description}
              </span>
            </span>
            {/* Footer row — number sits in flow (mt-auto) so the card hugs
                its copy instead of leaving a tall empty gap, while numbers
                still align to the bottom across the row. */}
            <span className="relative mt-auto flex items-center justify-end">
              <span
                aria-hidden
                className={`inline-flex items-center justify-center rounded-[var(--radius-md)] font-bold transition-all duration-[240ms] ease-[var(--ease-standard)] group-hover/step:scale-105 ${ringSize} ${ringTone}`}
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
            className="relative motion-step-rise"
            style={{ "--step-i": index } as CSSProperties}
          >
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
