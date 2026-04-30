import type { ReactNode } from "react";

type Tone = "primary" | "secondary" | "accent";

const TONE: Record<Tone, string> = {
  primary:
    "bg-[radial-gradient(closest-side,rgba(47,93,67,0.18),rgba(47,93,67,0)_70%)]",
  secondary:
    "bg-[radial-gradient(closest-side,rgba(122,140,109,0.16),rgba(122,140,109,0)_70%)]",
  accent:
    "bg-[radial-gradient(closest-side,rgba(229,162,58,0.18),rgba(229,162,58,0)_70%)]",
};

interface NeonGlowProps {
  /** Halo tone — keep to one halo per element. */
  tone?: Tone;
  /** Children sit on top of the halo. */
  children?: ReactNode;
  /** Adds a `motion-safe:animate-pulse` halo. */
  pulse?: boolean;
  className?: string;
}

/**
 * Decorative ambient halo — soft tinted glow behind a focal element.
 * Renamed in spirit from "neon" to a calmer sage/forest blur, but the
 * component name stays for backwards-compat with existing call sites.
 */
export function NeonGlow({
  tone = "primary",
  children,
  pulse = false,
  className = "",
}: NeonGlowProps) {
  return (
    <span className={`relative isolate inline-flex ${className}`.trim()}>
      <span
        aria-hidden
        className={`pointer-events-none absolute -inset-8 -z-10 blur-3xl ${TONE[tone]} ${pulse ? "motion-safe:animate-pulse" : ""}`.trim()}
      />
      {children}
    </span>
  );
}
