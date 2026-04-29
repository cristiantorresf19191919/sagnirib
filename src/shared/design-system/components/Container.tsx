import type { HTMLAttributes } from "react";

type Width = "narrow" | "default" | "wide";

const WIDTH_CLASS: Record<Width, string> = {
  narrow: "max-w-[640px]",
  default: "max-w-[1200px]",
  wide: "max-w-[1440px]",
};

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  width?: Width;
}

export function Container({
  width = "default",
  className = "",
  children,
  ...rest
}: ContainerProps) {
  const merged = `mx-auto w-full px-4 sm:px-6 lg:px-8 ${WIDTH_CLASS[width]} ${className}`.trim();
  return (
    <div className={merged} {...rest}>
      {children}
    </div>
  );
}
