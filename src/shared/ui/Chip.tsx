import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "outline" | "solid" | "ghost";
type Size = "sm" | "md";

const SIZE: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-3.5 text-sm",
};

const ACTIVE: Record<Variant, string> = {
  outline:
    "border border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] font-semibold",
  solid:
    "bg-[var(--color-brand-primary)] text-[var(--color-surface)] border border-[var(--color-brand-primary)] font-semibold shadow-[var(--shadow-glow-primary)]",
  ghost:
    "border border-transparent bg-[var(--color-brand-primary)]/8 text-[var(--color-brand-primary)] font-semibold",
};

const INACTIVE: Record<Variant, string> = {
  outline:
    "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-brand-primary-soft)] hover:text-[var(--color-foreground)]",
  solid:
    "border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]",
  ghost:
    "border border-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]",
};

const BASE =
  "inline-flex items-center gap-1.5 rounded-full font-medium transition-[background,border-color,color,box-shadow] duration-150 ease-[var(--ease-standard)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]";

interface CommonChipProps {
  active?: boolean;
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

type ChipAsLink = CommonChipProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | "href"> & {
    href: string;
  };

type ChipAsButton = CommonChipProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

export type ChipProps = ChipAsLink | ChipAsButton;

function classes(
  variant: Variant,
  size: Size,
  active: boolean,
  className: string,
): string {
  return `${BASE} ${SIZE[size]} ${active ? ACTIVE[variant] : INACTIVE[variant]} ${className}`.trim();
}

/**
 * Filter chip / pill — renders as an anchor when `href` is provided, button
 * otherwise. Active state is purely visual; behavior is up to the consumer.
 */
export function Chip(props: ChipProps) {
  const {
    active = false,
    variant = "outline",
    size = "md",
    className = "",
    children,
  } = props;
  const cn = classes(variant, size, active, className);

  if ("href" in props && props.href) {
    const {
      href,
      active: _a,
      variant: _v,
      size: _s,
      className: _c,
      children: _ch,
      ...rest
    } = props;
    return (
      <Link
        href={href}
        aria-current={active ? "true" : undefined}
        className={cn}
        {...rest}
      >
        {children}
      </Link>
    );
  }

  const {
    active: _a,
    variant: _v,
    size: _s,
    className: _c,
    children: _ch,
    ...rest
  } = props as ChipAsButton;
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn}
      {...rest}
    >
      {children}
    </button>
  );
}
