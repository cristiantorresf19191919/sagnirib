type Size = "sm" | "md" | "lg";

const SIZE: Record<Size, { value: string; original: string }> = {
  sm: { value: "text-sm", original: "text-xs" },
  md: { value: "text-base", original: "text-sm" },
  lg: { value: "text-2xl", original: "text-sm" },
};

interface PriceTagProps {
  /** Pre-formatted current price string (e.g. "$200.000 / hora"). */
  value: string;
  /** Optional pre-formatted original price — rendered struck-through. */
  original?: string;
  size?: Size;
  className?: string;
}

/**
 * Displays a current price with optional struck-through original price.
 * Formatting is the caller's responsibility — this component only owns the
 * visual treatment.
 */
export function PriceTag({
  value,
  original,
  size = "md",
  className = "",
}: PriceTagProps) {
  const s = SIZE[size];
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`.trim()}>
      <span className={`${s.value} font-bold text-[var(--color-foreground)]`}>
        {value}
      </span>
      {original && (
        <span
          className={`${s.original} font-medium text-[var(--color-text-subtle)] line-through`}
        >
          {original}
        </span>
      )}
    </span>
  );
}
