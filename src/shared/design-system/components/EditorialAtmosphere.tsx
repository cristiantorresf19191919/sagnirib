"use client";

import { motion } from "framer-motion";

/**
 * Atmospheric background layer for editorial surfaces.
 *
 * Replaces the inline single-radial-gradient pattern (`bg-[radial-gradient(...)]`)
 * with a layered composition: forest glow at top-center, gold glow at the
 * upper-right, cream wash at the lower-left, faint vignette on the edges,
 * and a slow drift animation that breathes life into otherwise static
 * hero areas. All animation respects `prefers-reduced-motion`.
 *
 * Use at the top of `<main>` on auth / chooser / wizard pages. Sits behind
 * everything (`-z-10`), is purely decorative (`aria-hidden`), and never
 * intercepts pointer events.
 */
export function EditorialAtmosphere({
  intensity = "default",
}: Readonly<{ intensity?: "default" | "soft" | "rich" }>) {
  // Drift amplitudes — kept small (≤ 24px) so the motion reads as
  // ambient lighting, not parallax. Framer-motion respects
  // `prefers-reduced-motion` automatically via the surrounding
  // MotionConfig — branching on `useReducedMotion()` here causes
  // SSR/CSR hydration mismatches because the hook returns `null` on
  // the server and a boolean on the client's first paint.
  const amplitude =
    intensity === "rich" ? 28 : intensity === "soft" ? 12 : 20;
  const driftDuration =
    intensity === "rich" ? 18 : intensity === "soft" ? 28 : 24;

  const baseHeight =
    intensity === "rich" ? "min(720px, 80vh)" : "min(620px, 70vh)";

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-hidden"
      style={{ height: baseHeight }}
    >
      {/* Forest glow — anchors brand, top-center */}
      <motion.div
        className="absolute -top-32 left-1/2 h-[820px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(47,93,67,0.18),transparent_60%)]"
        animate={{ x: [-amplitude, amplitude, -amplitude], y: [0, amplitude / 2, 0] }}
        transition={{
          duration: driftDuration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Gold glow — accent, upper-right */}
      <motion.div
        className="absolute -top-16 right-[-10%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(200,166,118,0.18),transparent_65%)]"
        animate={{
          x: [amplitude, -amplitude / 2, amplitude],
          y: [-amplitude / 2, amplitude, -amplitude / 2],
        }}
        transition={{
          duration: driftDuration * 1.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        }}
      />
      {/* Cream wash — warm undertone, lower-left */}
      <motion.div
        className="absolute bottom-0 left-[-10%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(229,162,58,0.08),transparent_70%)]"
        animate={{ x: [0, amplitude / 2, 0], y: [0, -amplitude / 2, 0] }}
        transition={{
          duration: driftDuration * 1.4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      />
      {/* Gold thread — single horizontal hairline ~1/3 down the hero,
          reading as a typographic baseline marker */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{
          duration: 1.4,
          delay: 0.35,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{ originX: 0.5 }}
        className="absolute left-1/2 top-[34%] h-px w-[min(640px,60%)] -translate-x-1/2 bg-gradient-to-r from-transparent via-[var(--color-gold)]/55 to-transparent"
      />
      {/* Edge vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.06)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.25)_100%)]" />
    </div>
  );
}

/**
 * Editorial page kicker — a uniform "chapter marker" used above the H1 on
 * auth surfaces. Two hairlines flank a rotated gold rhombus that catches
 * the eye and reads as a typographic ornament rather than a label.
 */
export function EditorialKicker({
  label,
}: Readonly<{ label: string }>) {
  return (
    <motion.span
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--color-brand-primary)]"
    >
      <span
        aria-hidden
        className="inline-block h-px w-10 bg-gradient-to-r from-transparent via-[var(--color-gold)]/70 to-[var(--color-gold)]/90"
      />
      <motion.span
        aria-hidden
        animate={{ rotate: [45, 405] }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "linear",
        }}
        className="inline-block h-1.5 w-1.5 origin-center bg-[var(--color-gold)] shadow-[0_0_0_3px_rgba(200,166,118,0.18)]"
      />
      <span>{label}</span>
      <span
        aria-hidden
        className="inline-block h-px w-10 bg-gradient-to-l from-transparent via-[var(--color-gold)]/70 to-[var(--color-gold)]/90"
      />
    </motion.span>
  );
}

/**
 * Decorative L-bracket. Place four at the corners of a hero card to give
 * it an editorial frame without adding visual weight.
 */
export function CornerOrnament({
  position,
}: Readonly<{
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}>) {
  const placement = {
    "top-left": "left-3 top-3 border-l border-t",
    "top-right": "right-3 top-3 border-r border-t",
    "bottom-left": "left-3 bottom-3 border-l border-b",
    "bottom-right": "right-3 bottom-3 border-r border-b",
  }[position];
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute h-3 w-3 border-[var(--color-gold)]/45 ${placement}`}
    />
  );
}
