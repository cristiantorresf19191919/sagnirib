"use client";

import {
  AnimatePresence,
  motion,
  useAnimation,
  useReducedMotion,
} from "framer-motion";
import { AlertCircle } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  type ReactNode,
} from "react";

export interface ValidatedFieldHandle {
  /** Trigger a shake + scroll-into-view + focus on the wrapped input. */
  shake(): void;
  /** Resolve the underlying input element if mounted. */
  getInput(): HTMLElement | null;
}

export interface ValidatedFieldProps {
  /** id forwarded to the rendered input via `inputId`. */
  id?: string;
  label: string;
  /** Renders the asterisk + sets aria-required on the input. */
  required?: boolean;
  /** Optional leading icon. Positioned inside the input on the left. */
  icon?: ReactNode;
  /** Optional trailing helper text shown beneath the input (e.g. char count). */
  hint?: ReactNode;
  /** Error string. When this transitions from undefined → string, the field shakes. */
  error?: string;
  /** Required render-prop. Receives `{ inputId, aria-invalid, aria-describedby }`. */
  children: (api: {
    inputId: string;
    "aria-invalid": boolean | undefined;
    "aria-describedby": string | undefined;
    "aria-required": boolean | undefined;
  }) => ReactNode;
  /** Additional class on the outer wrapper. */
  className?: string;
}

const SHAKE_KEYFRAMES = [0, -8, 8, -6, 6, -3, 3, 0];

/**
 * Reusable form field wrapper with motion-driven validation feedback.
 *
 * Renders a label (with optional required asterisk), an optional leading
 * icon slot inside the input, an animated error message, and a hint row.
 * When the `error` prop transitions from empty → set, the wrapper shakes
 * horizontally with a 7-keyframe cubic-out sequence so the eye is pulled
 * to the offending field. Respects `prefers-reduced-motion`.
 *
 * Wires accessibility:
 *   - error message gets `role="alert"` for screen readers
 *   - input receives `aria-invalid`, `aria-describedby={errorId}`, and
 *     `aria-required` so the field is read correctly by assistive tech
 *
 * Exposes a `shake()` imperative handle so parent forms can shake fields
 * on submit-time validation (e.g. when no error was present until the
 * user clicked submit).
 */
export const ValidatedField = forwardRef<ValidatedFieldHandle, ValidatedFieldProps>(
  function ValidatedField(
    { id, label, required, icon, hint, error, children, className },
    ref,
  ) {
    const reducedMotion = useReducedMotion();
    const fallbackId = useId();
    const inputId = id ?? fallbackId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const controls = useAnimation();
    const prevError = useRef<string | undefined>(error);

    useEffect(() => {
      // Trigger shake when error transitions from undefined → string,
      // or when a different error replaces an old one.
      if (error && error !== prevError.current) {
        if (!reducedMotion) {
          controls.start({
            x: SHAKE_KEYFRAMES,
            transition: { duration: 0.5, ease: [0.36, 0.07, 0.19, 0.97] },
          });
        }
      }
      prevError.current = error;
    }, [error, reducedMotion, controls]);

    useImperativeHandle(ref, () => ({
      shake() {
        if (!reducedMotion) {
          controls.start({
            x: SHAKE_KEYFRAMES,
            transition: { duration: 0.5, ease: [0.36, 0.07, 0.19, 0.97] },
          });
        }
        const input = wrapperRef.current?.querySelector<HTMLElement>(
          "input, textarea, select",
        );
        if (input) {
          input.scrollIntoView({
            behavior: reducedMotion ? "auto" : "smooth",
            block: "center",
          });
          input.focus({ preventScroll: true });
        }
      },
      getInput() {
        return (
          wrapperRef.current?.querySelector<HTMLElement>(
            "input, textarea, select",
          ) ?? null
        );
      },
    }));

    const describedBy = [error ? errorId : null, hint ? hintId : null]
      .filter((v): v is string => Boolean(v))
      .join(" ");

    return (
      <motion.div
        ref={wrapperRef}
        animate={controls}
        className={`flex flex-col gap-1.5 ${className ?? ""}`.trim()}
      >
        <label
          htmlFor={inputId}
          className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]"
        >
          {label}
          {required ? (
            <span
              aria-hidden
              className="text-[var(--color-brand-highlight)]"
            >
              *
            </span>
          ) : null}
        </label>
        {icon ? (
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)]"
            >
              {icon}
            </span>
            {children({
              inputId,
              "aria-invalid": error ? true : undefined,
              "aria-describedby": describedBy || undefined,
              "aria-required": required || undefined,
            })}
          </div>
        ) : (
          children({
            inputId,
            "aria-invalid": error ? true : undefined,
            "aria-describedby": describedBy || undefined,
            "aria-required": required || undefined,
          })
        )}
        <AnimatePresence initial={false}>
          {error ? (
            <motion.p
              key="error"
              id={errorId}
              role="alert"
              initial={{ opacity: 0, height: 0, y: -4 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-1.5 overflow-hidden text-[11px] text-[var(--color-brand-highlight)]"
            >
              <AlertCircle className="h-3 w-3 shrink-0" aria-hidden />
              <span>{error}</span>
            </motion.p>
          ) : null}
        </AnimatePresence>
        {hint && !error ? (
          <span id={hintId} className="text-[10px] text-[var(--color-text-subtle)]">
            {hint}
          </span>
        ) : null}
      </motion.div>
    );
  },
);
