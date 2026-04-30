import type { InputHTMLAttributes, ReactNode } from "react";

type Size = "sm" | "md" | "lg";

const SIZE: Record<Size, string> = {
  sm: "h-9 text-sm",
  md: "h-11 text-sm",
  lg: "h-12 text-base",
};

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Size token — sm/md/lg. */
  size?: Size;
  /** Optional leading icon (e.g. lucide <Search />). */
  leadingIcon?: ReactNode;
  /** Optional trailing slot — useful for action buttons or hints. */
  trailing?: ReactNode;
  /** Pill or rounded-md shape. Defaults to pill. */
  shape?: "pill" | "soft";
}

const FIELD_BASE =
  "w-full bg-[var(--color-surface)] text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] border border-[var(--color-border)] focus:border-[var(--color-brand-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]/30 transition-colors";

/**
 * Pill-shaped text input — base for the search bar, booking forms, and any
 * other text capture. Wraps the `<input>` in a relative shell so leading
 * icons and trailing slots align without consumers reimplementing layout.
 */
export function Input({
  size = "md",
  shape = "pill",
  leadingIcon,
  trailing,
  className = "",
  ...rest
}: InputProps) {
  const radius = shape === "pill" ? "rounded-full" : "rounded-[var(--radius-md)]";
  const padX = leadingIcon ? "pl-11 pr-4" : "pl-4 pr-4";
  const padXTrailing = trailing ? "pr-12" : "";

  return (
    <span className="relative inline-flex w-full items-center">
      {leadingIcon && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-4 inline-flex h-4 w-4 items-center justify-center text-[var(--color-text-subtle)]"
        >
          {leadingIcon}
        </span>
      )}
      <input
        className={`${FIELD_BASE} ${SIZE[size]} ${radius} ${padX} ${padXTrailing} ${className}`.trim()}
        {...rest}
      />
      {trailing && (
        <span className="absolute right-2 inline-flex items-center">
          {trailing}
        </span>
      )}
    </span>
  );
}
