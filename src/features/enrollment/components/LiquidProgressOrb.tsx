"use client";

import { useId } from "react";
import { motion } from "framer-motion";

/**
 * Global liquid-fill progress orb for the enrollment wizard.
 *
 * One always-visible circle whose forest liquid rises and recedes with the
 * draft's field-level completion (see `computeCompletion`). Two layers:
 *
 * - **Fill level** is driven by framer-motion (`y` on the liquid group + the
 *   text-reveal clip). It is essential feedback — the whole point of the orb —
 *   so it animates regardless of `prefers-reduced-motion`, with a gentle slosh
 *   spring so adding/removing a field reads as liquid settling.
 * - **Wave drift** is a CSS animation (`.liquid-wave-a/-b`) running on the
 *   compositor; it's exempt from the global reduced-motion freeze (calmed, not
 *   stopped) because the ripple is the effect the user asked to see.
 *
 * A tiny percentage sits in the centre with the classic water-level reveal —
 * dark above the surface, light below — so it stays legible whether the liquid
 * is low or high. At 100% the number gives way to a check and a gold glow —
 * the "ready to publish" moment.
 *
 * Tokenised throughout (brand liquid, gold completion, muted track).
 */

// Wave geometry. Wavelength = 2 × half = 40 user units, matching the 40px CSS
// drift so the loop is seamless. Spans well past the 0–100 viewBox so no edge
// is ever exposed mid-drift.
function buildWave(amplitude: number, startUp: boolean): string {
  const from = -160;
  const to = 160;
  const depth = 220;
  const half = 20;
  let d = `M ${from} 0`;
  let dir = startUp ? -1 : 1;
  for (let x = from; x < to; x += half) {
    const controlX = x + half / 2;
    const controlY = dir * amplitude * 2;
    d += ` Q ${controlX} ${controlY} ${x + half} 0`;
    dir *= -1;
  }
  d += ` L ${to} ${depth} L ${from} ${depth} Z`;
  return d;
}

const WAVE_A = buildWave(3, true);
const WAVE_B = buildWave(2.2, false);

// Map fill fraction → surface Y in the 0–100 viewBox. Slight over-range so 0%
// is fully empty and 100% is fully covered despite the wave amplitude.
function surfaceY(fraction: number): number {
  const clamped = Math.min(1, Math.max(0, fraction));
  return -6 + (1 - clamped) * 112;
}

// Liquid settle — a touch of overshoot so a rising/falling level visibly
// "sloshes" home (the little impact that makes completing a field feel good).
const LIQUID_SPRING = {
  type: "spring",
  stiffness: 90,
  damping: 12,
  mass: 1,
} as const;

interface LiquidProgressOrbProps {
  /** Completion in [0, 1]. */
  fraction: number;
  /** Accessible description, e.g. "Perfil 62% completo". */
  ariaLabel: string;
}

export function LiquidProgressOrb({ fraction, ariaLabel }: LiquidProgressOrbProps) {
  const pct = Math.round(Math.min(1, Math.max(0, fraction)) * 100);
  const complete = fraction >= 0.999;
  const y = surfaceY(fraction);

  // Unique ids per instance so multiple orbs on a page never collide on their
  // gradient/clip/filter refs (colons stripped — invalid in some url() refs).
  const uid = useId().replace(/:/g, "");
  const fillId = `liquid-orb-fill-${uid}`;
  const clipId = `liquid-orb-clip-${uid}`;
  const textClipId = `liquid-orb-text-clip-${uid}`;
  const glowId = `liquid-orb-glow-${uid}`;

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      data-testid="liquid-progress-orb"
      className="relative h-[5.5rem] w-[5.5rem] shrink-0"
    >
      <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-brand-primary-strong)" />
            <stop offset="1" stopColor="var(--color-brand-primary)" />
          </linearGradient>
          <clipPath id={clipId}>
            <circle cx="50" cy="50" r="46" />
          </clipPath>
          <clipPath id={textClipId}>
            {/* Reveals the light numeral only below the water line (plain rect:
                clip geometry must come from the `y` attribute). Snaps per
                integer % while the liquid animates smoothly below. */}
            <rect x="0" y={y} width="100" height="120" />
          </clipPath>
          <filter
            id={glowId}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="2.6" />
          </filter>
        </defs>

        {/* Opaque track behind the liquid — keeps the floating orb solid so
            page content never bleeds through the empty portion. */}
        <circle cx="50" cy="50" r="46" fill="var(--color-surface-muted)" />

        {/* Liquid — rises/recedes (framer-motion), ripples (CSS), clipped to
            the orb circle so the waves never spill past the rim. */}
        <g clipPath={`url(#${clipId})`}>
          <motion.g
            initial={{ y: 106 }}
            animate={{ y }}
            transition={LIQUID_SPRING}
          >
            <g className="liquid-wave-b">
              <path d={WAVE_B} fill={`url(#${fillId})`} opacity="0.45" />
            </g>
            <g className="liquid-wave-a">
              <path d={WAVE_A} fill={`url(#${fillId})`} />
            </g>
          </motion.g>
        </g>

        {/* Completion celebration — the "ready to publish" moment. A gold glow
            eases in around the rim and a single gold ring bursts outward once
            (mounts only when complete flips true, so it plays exactly once).
            The svg is overflow-visible so the burst can expand past the orb. */}
        {complete && (
          <>
            <motion.circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="var(--color-gold)"
              strokeWidth="3"
              filter={`url(#${glowId})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.circle
              cx="50"
              cy="50"
              fill="none"
              stroke="var(--color-gold)"
              strokeWidth="2"
              initial={{ r: 42, opacity: 0.85 }}
              animate={{ r: 58, opacity: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </>
        )}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke={complete ? "var(--color-gold)" : "var(--color-border)"}
          strokeWidth="2"
        />

        {complete ? (
          // Ready-to-publish: a check over the full fill.
          <motion.path
            d="M 36 51 L 46 61 L 65 40"
            fill="none"
            stroke="var(--color-surface)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />
        ) : (
          <>
            {/* Tiny percentage with the water-level reveal: dark above the
                surface, light below, so it stays legible at any fill. */}
            <text
              x="50"
              y="51"
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-[var(--color-foreground)] font-semibold"
              style={{ fontSize: "17px" }}
            >
              {pct}
              <tspan style={{ fontSize: "9px" }}>%</tspan>
            </text>
            <text
              x="50"
              y="51"
              textAnchor="middle"
              dominantBaseline="central"
              clipPath={`url(#${textClipId})`}
              className="fill-[var(--color-surface)] font-semibold"
              style={{ fontSize: "17px" }}
            >
              {pct}
              <tspan style={{ fontSize: "9px" }}>%</tspan>
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
