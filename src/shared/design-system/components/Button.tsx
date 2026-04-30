import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-[var(--color-brand-primary)] text-[var(--color-surface)] hover:bg-[var(--color-brand-primary-strong)] focus-visible:ring-[var(--color-brand-primary)]",
  secondary:
    "bg-[var(--color-surface-muted)] text-[var(--color-foreground)] hover:bg-[var(--color-surface)] hover:shadow-[var(--shadow-sm)] focus-visible:ring-[var(--color-brand-primary)]",
  outline:
    "bg-[var(--color-surface)] text-[var(--color-foreground)] border border-[var(--color-border)] hover:border-[var(--color-brand-primary-soft)] focus-visible:ring-[var(--color-brand-primary)]",
  ghost:
    "bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)] focus-visible:ring-[var(--color-brand-primary)]",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-base",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition-[background,border-color,box-shadow,transform,color] duration-200 ease-[var(--ease-standard)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-px";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  /** Adds the brand-primary soft drop shadow. */
  glow?: boolean;
  /** Make the button take 100% of its container width. */
  block?: boolean;
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
  block: boolean,
  className: string,
): string {
  const glowClass = glow ? "shadow-[var(--shadow-glow-primary)]" : "";
  const blockClass = block ? "w-full" : "";
  return `${BASE} ${VARIANT[variant]} ${SIZE[size]} ${glowClass} ${blockClass} ${className}`.trim();
}

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    glow = false,
    block = false,
    className = "",
    children,
  } = props;
  const cn = classes(variant, size, glow, block, className);

  if ("href" in props && props.href) {
    const { href, variant: _v, size: _s, glow: _g, block: _b, className: _c, children: _ch, ...rest } =
      props;
    return (
      <Link href={href} className={cn} {...rest}>
        {children}
      </Link>
    );
  }

  const { variant: _v, size: _s, glow: _g, block: _b, className: _c, children: _ch, ...rest } =
    props as ButtonAsButton;
  return (
    <button className={cn} {...rest}>
      {children}
    </button>
  );
}
