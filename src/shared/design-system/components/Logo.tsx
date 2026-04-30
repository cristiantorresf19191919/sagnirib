import Image from "next/image";
import Link from "next/link";

import { brandAssets, hasAsset } from "@/core/branding/brand-assets";
import { brandConfig } from "@/core/branding/brand-config";

import { Sparkle } from "./Sparkle";

interface LogoProps {
  /** Render the logo as a link to "/". Defaults to true. */
  link?: boolean;
  /** Display size. */
  size?: "sm" | "md";
}

const SIZE_PX: Record<NonNullable<LogoProps["size"]>, number> = {
  sm: 28,
  md: 36,
};

/**
 * Wordmark logo. Falls back to a styled text mark when the SVG/PNG asset is
 * not available (per brand-intake.md the official logo asset is pending).
 */
export function Logo({ link = true, size = "md" }: LogoProps) {
  const px = SIZE_PX[size];
  const wordmarkClass =
    size === "sm"
      ? "text-lg font-bold tracking-tight"
      : "text-xl font-bold tracking-tight";

  const content = (
    <span className="inline-flex items-center gap-2 text-[var(--color-foreground)]">
      {hasAsset(brandAssets.logoPng) ? (
        <Image
          src={brandAssets.logoPng}
          alt={`${brandConfig.name} logo`}
          width={px}
          height={px}
          priority
          className="h-auto w-auto"
        />
      ) : (
        <Sparkle tone="primary" size={size === "sm" ? 18 : 22} />
      )}
      <span className={wordmarkClass}>{brandConfig.name}</span>
    </span>
  );

  if (!link) return content;
  return (
    <Link href="/" aria-label={`${brandConfig.name} — inicio`} className="inline-flex">
      {content}
    </Link>
  );
}
