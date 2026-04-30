"use client";

import { Check } from "lucide-react";

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
  return (
    <ol
      role="list"
      aria-label="Progreso de publicación"
      className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4"
    >
      {steps.map((step) => {
        const isActive = step.id === current;
        const isDone = completed.includes(step.id);
        const isClickable = Boolean(onJump) && (isDone || isActive);
        const tone = isActive
          ? "border-[var(--color-brand-primary)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]"
          : isDone
            ? "border-[var(--color-brand-primary-soft)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]"
            : "border-[var(--color-border)] bg-[var(--color-background-elevated)]";
        const ringTone = isActive
          ? "bg-[var(--color-brand-primary)] text-[var(--color-surface)]"
          : isDone
            ? "bg-[var(--color-brand-primary-soft)] text-[var(--color-foreground)]"
            : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]";

        const baseCls = `group relative flex h-full min-h-[120px] flex-col justify-between rounded-[var(--radius-xl)] border p-5 text-left transition-[border-color,background,box-shadow,transform] duration-200 ease-[var(--ease-standard)] ${tone}`;
        const interactiveCls = isClickable
          ? "cursor-pointer hover:-translate-y-0.5 hover:border-[var(--color-brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          : "cursor-default";

        const Inner = (
          <>
            <span className="flex flex-col gap-1.5">
              <span
                className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${
                  isActive
                    ? "text-[var(--color-brand-primary)]"
                    : "text-[var(--color-text-subtle)]"
                }`}
              >
                Paso {String(step.number).padStart(2, "0")}
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
              <span className="text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                {step.description}
              </span>
            </span>
            <span
              aria-hidden
              className={`pointer-events-none absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-sm font-bold transition-colors duration-200 ${ringTone}`}
            >
              {isDone && !isActive ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : (
                step.number
              )}
            </span>
          </>
        );

        return (
          <li key={step.id} className="relative">
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
