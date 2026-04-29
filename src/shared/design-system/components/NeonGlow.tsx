import type { ReactNode } from "react";

type Tone = "primary" | "secondary" | "accent";

const TONE: Record<Tone, string> = {
  primary:
    "bg-[radial-gradient(closest-side,rgba(255,43,181,0.45),rgba(255,43,181,0.0)_72%)]",
  secondary:
    "bg-[radial-gradient(closest-side,rgba(122,43,255,0.40),rgba(122,43,255,0.0)_72%)]",
  accent:
    "bg-[radial-gradient(closest-side,rgba(31,168,255,0.35),rgba(31,168,255,0.0)_72%)]",
};

interface NeonGlowProps {
  /** Glow tone — keep to one glow per element per design-direction. */
  tone?: Tone;
  /** Children sit on top of the glow halo. */
  children?: ReactNode;
  /** Adds a `motion-safe:animate-pulse` halo. */
  pulse?: boolean;
  className?: string;
}

/**
 * Decorative halo wrapper. Intentionally `aria-hidden` for the halo; the
 * children remain in the accessible tree. One halo per element rule lives
 * with the consumer — this component only knows how to draw a single tone.
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
