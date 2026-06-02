"use client";

import type { CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
  /** Per-step completion fraction (0–1). The active step's ring fills with its
   *  own value, so the red border completes as the user fills that step. */
  stepProgress?: Record<StepId, number>;
}

// Draw-on easing for the ring/line — the "enter" curve from the UI-animation
// guide (cubic-bezier(0.22, 1, 0.36, 1)): a confident start that settles
// softly, so completion reads as arrival rather than a mechanical tick.
const DRAW_EASE = [0.22, 1, 0.36, 1] as const;

// How far the ring is drawn per state. The active step shows a short forest
// arc starting at 12 o'clock ("in progress / you are here"); finishing the
// step tweens that arc the rest of the way around to a full circle.
const RING_ACTIVE = 0.3;

/**
 * Card-style stepper. Three layered motions, all functional and all gated on
 * `prefers-reduced-motion`:
 *
 * 1. **Shared gliding highlight** (`layoutId="stepper-active"`): when the step
 *    changes, framer-motion glides the white highlight — its forest border and
 *    soft shadow — from the old card to the new one, so progress reads as one
 *    continuous motion rather than two cards blinking. The highlight lives at
 *    the `<li>` level (not inside the `overflow-hidden` card) so the slide is
 *    never clipped, and the active `<li>` is raised with `z-10`.
 *
 * 2. **Progress ring** around each badge (a thin donut, ~2.5px): pending shows
 *    only a faint track; the active step draws a short forest arc; completing
 *    the step tweens that arc to a full circle (`pathLength` 0.3 → 1) as the
 *    numeral pops into a check. Present at every breakpoint, so per-step
 *    completion is communicated even when the connecting rail is hidden.
 *
 * 3. **Connecting rail** between cards (replaces the old `>` chevron): a 2px
 *    line bridging the grid gap, aligned to the ring centres. Its forest fill
 *    grows left→right (`scaleX`) the moment the left step is done. Only the
 *    `lg` 4-in-a-row layout shows it; stacked / 2-col layouts hide it.
 *
 * `initial={false}` everywhere keeps the badges, rings and rails static on
 * first paint (the card entrance covers that) — resuming a saved draft doesn't
 * fire a burst of animations; motion only plays as you advance.
 *
 * Restrained palette by design — forest + cream + a single faint track.
 */
export function Stepper({
  steps,
  current,
  completed,
  onJump,
  stepProgress,
}: StepperProps) {
  const locale = useActiveLocale();
  const reduced = useReducedMotion();

  // The next step pulses an invitation once the current step is fully filled,
  // nudging the user toward "Siguiente" without a hard prompt.
  const currentIndex = steps.findIndex((s) => s.id === current);
  const currentFull = (stepProgress?.[current] ?? 0) >= 1;

  // Snappy pop for the number→check swap; instant under reduced motion.
  const badgeSpring = reduced
    ? { duration: 0 }
    : ({ type: "spring", stiffness: 520, damping: 24 } as const);

  // Smooth draw for ring + rail. Tween (not spring) so the stroke arrives
  // without an overshoot wobble; snaps when reduced motion is requested.
  const drawTransition = reduced
    ? { duration: 0 }
    : ({ duration: 0.6, ease: DRAW_EASE } as const);
  const railTransition = reduced
    ? { duration: 0 }
    : ({ duration: 0.5, ease: DRAW_EASE } as const);

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

        // Inner disc (the number/check). The ring around it carries progress;
        // the disc carries the live/done/pending state via fill + glow.
        const discTone = isActive
          ? "bg-[var(--color-brand-primary)] text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)]"
          : isDone
            ? "bg-[var(--color-brand-primary-soft)] text-[var(--color-foreground)]"
            : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] group-hover/step:bg-[var(--color-brand-primary-soft)] group-hover/step:text-[var(--color-foreground)]";

        // Ring fill target: full when done; while active it tracks THIS step's
        // own field completion (floored so the arc is always visible), so the
        // red border literally completes as the user fills the step; none when
        // pending. The tween between values is the "completion" motion.
        const activeRing = stepProgress
          ? Math.max(0.06, stepProgress[step.id] ?? 0)
          : RING_ACTIVE;
        const ringProgress = isDone ? 1 : isActive ? activeRing : 0;

        // Invite the next step once the current one is full (and still pending).
        const invite =
          index === currentIndex + 1 && currentFull && !isDone && !isActive;

        // Active card is transparent — the shared highlight behind it paints
        // the surface, border and glow so they can travel between cards.
        // Pending (neither active nor done) cards are dimmed via container
        // opacity rather than washed-out type, so their text stays legible
        // (WCAG AA) while the muted state still reads as "not yet here".
        const baseCls = `group/step relative z-[1] flex h-full flex-col gap-4 overflow-hidden rounded-[var(--radius-xl)] border p-5 text-left transition-[transform,box-shadow,opacity] duration-[240ms] ease-[var(--ease-standard)] ${
          isActive
            ? "border-transparent bg-transparent"
            : isDone
              ? "border-[var(--color-border)] bg-[var(--color-background-elevated)] shadow-[var(--shadow-sm)]"
              : "border-[var(--color-border)] bg-[var(--color-background-elevated)] opacity-[0.72] shadow-[var(--shadow-sm)]"
        }`;
        const interactiveCls = isClickable
          ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          : "cursor-default";

        const Inner = (
          <>
            {/* Header row — badge sits next to the step label so the number
                and its status read as one unit (no diagonal eye-zigzag). */}
            <span className="relative flex items-center gap-3">
              {/* Ring + disc. Fixed 44px box at every state so the ring
                  centres align across the row — that alignment is what lets
                  the connecting rail read as one continuous track. */}
              <span
                aria-hidden
                className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center"
              >
                {/* Progress ring. Rotated -90° so the arc starts at 12
                    o'clock. Track is always present; the forest stroke draws
                    via pathLength. round caps keep the leading edge soft. */}
                <svg
                  viewBox="0 0 44 44"
                  className="absolute inset-0 h-full w-full -rotate-90"
                  fill="none"
                >
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    strokeWidth="2.5"
                    className="stroke-[var(--color-border)]"
                  />
                  <motion.circle
                    cx="22"
                    cy="22"
                    r="18"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="stroke-[var(--color-brand-primary)]"
                    initial={false}
                    animate={{ pathLength: ringProgress }}
                    transition={drawTransition}
                  />
                </svg>

                {/* Inner disc — number → check. The swap is a small spring
                    pop on completion, the only motion that fires mid-form and
                    only on the step you just finished. */}
                <span
                  className={`relative inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-sm font-bold transition-[background,color,transform] duration-[240ms] ease-[var(--ease-standard)] group-hover/step:scale-105 ${discTone}`}
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    {isDone && !isActive ? (
                      <motion.span
                        key="check"
                        className="inline-flex"
                        initial={
                          reduced ? false : { scale: 0.3, opacity: 0, rotate: -40 }
                        }
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={reduced ? { opacity: 0 } : { scale: 0.3, opacity: 0 }}
                        transition={badgeSpring}
                      >
                        <Check className="h-4 w-4" aria-hidden />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="num"
                        className="inline-flex"
                        initial={reduced ? false : { scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={reduced ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
                        transition={badgeSpring}
                      >
                        {step.number}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </span>
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
            </span>
            <span className="relative flex flex-col gap-1.5">
              <span className="text-lg font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
                {step.title}
              </span>
              <span className="max-w-[18ch] text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                {step.description}
              </span>
            </span>
          </>
        );

        return (
          <li
            key={step.id}
            className={`relative motion-step-rise transition-[top] duration-[240ms] ease-[var(--ease-standard)] ${
              isActive ? "z-10 -top-1" : "top-0"
            }`}
            style={{ "--step-i": index } as CSSProperties}
          >
            {/* Shared, gliding highlight — only ever one in the DOM. The richer
                glow shadow (vs the flat cards) lifts the active step toward the
                user, reinforcing the -4px rise on the <li>. */}
            {isActive && (
              <motion.span
                layoutId="stepper-active"
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-brand-primary)] bg-[var(--color-surface)] shadow-[var(--shadow-glow-primary)]"
                transition={
                  reduced
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 300, damping: 30, mass: 0.9 }
                }
              />
            )}

            {isClickable ? (
              <button
                type="button"
                onClick={() => onJump?.(step.id)}
                className={`${baseCls} ${interactiveCls} ${invite ? "step-invite" : ""} w-full`}
                aria-current={isActive ? "step" : undefined}
              >
                {Inner}
              </button>
            ) : (
              <div
                className={`${baseCls} ${interactiveCls} ${invite ? "step-invite" : ""}`}
                aria-current={isActive ? "step" : undefined}
              >
                {Inner}
              </div>
            )}

            {/* Connecting rail — bridges the grid gap between cards, aligned to
                the ring centres (43px from the card top: 1px border + 20px
                padding + half the 44px ring box). The forest fill grows
                left→right once this step is done. Only meaningful on lg where
                the four cards form one row; stacked / 2-col layouts hide it. */}
            {index < steps.length - 1 && (
              <span
                aria-hidden
                className="pointer-events-none absolute left-full top-[43px] hidden w-4 -translate-y-1/2 lg:block"
              >
                <span className="block h-[2px] w-full rounded-full bg-[var(--color-border)]" />
                <motion.span
                  className="absolute inset-0 block h-[2px] origin-left rounded-full bg-[var(--color-brand-primary)]"
                  initial={false}
                  animate={{ scaleX: isDone ? 1 : 0 }}
                  transition={railTransition}
                />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
