import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-[var(--color-brand-primary)] text-[var(--color-background)] hover:bg-[var(--color-brand-primary-strong)] focus-visible:ring-[var(--color-brand-primary-strong)]",
  secondary:
    "bg-[var(--color-surface)] text-[var(--color-foreground)] border border-[var(--color-border)] hover:border-[var(--color-brand-primary)] focus-visible:ring-[var(--color-brand-primary)]",
  ghost:
    "bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-surface)]/60 focus-visible:ring-[var(--color-brand-primary)]",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-base",
  lg: "h-14 px-8 text-base sm:text-lg",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-lg)] font-semibold tracking-tight transition-[background,border,box-shadow,transform] duration-200 ease-[var(--ease-standard)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-px";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  glow?: boolean;
  children: ReactNode;
  className?: string;
}

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | "href"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function classes(
  variant: Variant,
  size: Size,
  glow: boolean,
  className: string,
): string {
  const glowClass = glow ? "shadow-[var(--shadow-glow-primary)]" : "";
  return `${BASE} ${VARIANT[variant]} ${SIZE[size]} ${glowClass} ${className}`.trim();
}

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    glow = false,
    className = "",
    children,
  } = props;
  const cn = classes(variant, size, glow, className);

  if ("href" in props && props.href) {
    const { href, variant: _v, size: _s, glow: _g, className: _c, children: _ch, ...rest } =
      props;
    return (
      <Link href={href} className={cn} {...rest}>
        {children}
      </Link>
    );
  }

  const { variant: _v, size: _s, glow: _g, className: _c, children: _ch, ...rest } =
    props as ButtonAsButton;
  return (
    <button className={cn} {...rest}>
      {children}
    </button>
  );
}
