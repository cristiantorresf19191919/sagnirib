"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

interface BaseProps {
  label: string;
  hint?: string;
  /** Use when grouping multi-controls (chips, radios) under a single label. */
  children?: ReactNode;
}

export function FieldShell({ label, hint, children }: BaseProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
        {label}
      </span>
      {children}
      {hint && (
        <span className="text-[11px] text-[var(--color-text-subtle)]">
          {hint}
        </span>
      )}
    </label>
  );
}

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

const FIELD_BASE =
  "h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] transition-[border-color,box-shadow] duration-150 focus:border-[var(--color-brand-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]/30";

export function TextField({ label, hint, className = "", ...props }: TextFieldProps) {
  return (
    <FieldShell label={label} hint={hint}>
      <input className={`${FIELD_BASE} ${className}`.trim()} {...props} />
    </FieldShell>
  );
}

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  children: ReactNode;
}

export function SelectField({
  label,
  hint,
  className = "",
  children,
  ...props
}: SelectFieldProps) {
  return (
    <FieldShell label={label} hint={hint}>
      <span className="relative inline-flex w-full items-center">
        <select
          className={`${FIELD_BASE} appearance-none pr-10 ${className}`.trim()}
          {...props}
        >
          {children}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 inline-flex text-[var(--color-text-subtle)]"
        >
          ▾
        </span>
      </span>
    </FieldShell>
  );
}

export interface TextAreaFieldProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
}

export function TextAreaField({
  label,
  hint,
  className = "",
  rows = 4,
  ...props
}: TextAreaFieldProps) {
  return (
    <FieldShell label={label} hint={hint}>
      <textarea
        rows={rows}
        className={`min-h-[112px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm leading-relaxed text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] transition-[border-color,box-shadow] duration-150 focus:border-[var(--color-brand-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]/30 ${className}`.trim()}
        {...props}
      />
    </FieldShell>
  );
}

interface PillToggleProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

/** Filled-pill toggle that mimics the "Full time / Part time" controls. */
export function PillToggle({ label, active, onClick }: PillToggleProps) {
  const tone = active
    ? "bg-[var(--color-brand-primary)] text-[var(--color-surface)] border-[var(--color-brand-primary)] shadow-[var(--shadow-sm)]"
    : "bg-[var(--color-surface)] text-[var(--color-foreground)] border-[var(--color-border)] hover:border-[var(--color-brand-primary-soft)]";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold transition-[background,border-color,color,box-shadow] duration-150 ease-[var(--ease-standard)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${tone}`}
    >
      {label}
    </button>
  );
}

interface ChipChoiceProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

/** Soft pill used in chip rows (services, attention, etc). */
export function ChipChoice({ label, active, onClick }: ChipChoiceProps) {
  const tone = active
    ? "bg-[var(--color-brand-primary)]/10 border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] font-semibold"
    : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-foreground)] hover:border-[var(--color-brand-primary-soft)]";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-9 items-center rounded-full border px-3.5 text-xs font-medium transition-[background,border-color,color] duration-150 ease-[var(--ease-standard)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${tone}`}
    >
      {label}
    </button>
  );
}

interface ToggleSwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

/** Inline boolean switch — used for binary perks (face visible, card, now). */
export function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
}: ToggleSwitchProps) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-brand-primary-soft)]">
      <span className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-[var(--color-foreground)]">
          {label}
        </span>
        {description && (
          <span className="text-[12px] leading-relaxed text-[var(--color-text-muted)]">
            {description}
          </span>
        )}
      </span>
      <span className="relative inline-flex shrink-0 items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          aria-hidden
          className="block h-6 w-11 rounded-full bg-[var(--color-surface-muted)] transition-colors peer-checked:bg-[var(--color-brand-primary)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-brand-primary)] peer-focus-visible:ring-offset-2"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition-transform peer-checked:translate-x-5"
        />
      </span>
    </label>
  );
}
