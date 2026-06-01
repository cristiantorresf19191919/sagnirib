"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { t } from "@/core/i18n/messages";
import { useActiveLocale, useLocalizedHref } from "@/core/i18n/use-active-locale";

/**
 * Post-signup welcome screen — the celebratory onboarding moment shown
 * once right after a publisher creates their account, before they land on
 * the dashboard.
 *
 * It is NOT a route `loading.tsx` (those are Suspense fallbacks with no
 * controlled duration and would be yanked away mid-sequence). This is a
 * real screen with a deliberate, choreographed timeline:
 *
 *   intro  → header + blooming glowing star + concentric rings that draw
 *            in and spin, drifting particles, layered progress copy, and a
 *            rotating "next step" hint ticker.
 *   outro  → after ~SETUP_MS the central cluster scales down + fades, and
 *            "¡Tu perfil está listo!" + a "Ver mi perfil" CTA fade in.
 *
 * Honors `prefers-reduced-motion`: the bloom/draw/drift loops are dropped
 * and the screen advances to the ready state almost immediately so the
 * user is never trapped behind decorative motion.
 */

const SETUP_MS = 4200;
const SETUP_MS_REDUCED = 600;
const HINT_ROTATE_MS = 1800;

// 4-point Biringas sparkle, centred in a 200×200 viewBox.
const STAR_PATH =
  "M100 56 C103.5 86 114 96.5 144 100 C114 103.5 103.5 114 100 144 C96.5 114 86 103.5 56 100 C86 96.5 96.5 86 100 56 Z";

// Drifting particles around the cluster — deterministic so SSR/CSR agree.
const PARTICLES = [
  { x: 34, y: 30, size: 3, delay: 0.2, drift: 8 },
  { x: 166, y: 44, size: 2, delay: 0.5, drift: 6 },
  { x: 24, y: 120, size: 2.5, delay: 0.8, drift: 7 },
  { x: 176, y: 134, size: 3, delay: 0.35, drift: 9 },
  { x: 70, y: 178, size: 2, delay: 0.65, drift: 6 },
  { x: 138, y: 24, size: 2.5, delay: 1.0, drift: 8 },
] as const;

export function WelcomeExperience() {
  const locale = useActiveLocale();
  const reduced = useReducedMotion();
  const dashboardHref = useLocalizedHref("/mi-cuenta");

  const [ready, setReady] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);

  // Advance to the "ready" outro after the simulated setup window.
  useEffect(() => {
    const id = window.setTimeout(
      () => setReady(true),
      reduced ? SETUP_MS_REDUCED : SETUP_MS,
    );
    return () => window.clearTimeout(id);
  }, [reduced]);

  // Rotate the "next step" hint while the setup loops (intro only).
  useEffect(() => {
    if (ready) return;
    const id = window.setInterval(() => {
      setHintIndex((i) => (i + 1) % 2);
    }, HINT_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [ready]);

  const hints = [
    t(locale, "bienvenida.hint.verify"),
    t(locale, "bienvenida.hint.publish"),
  ];

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[var(--color-background)] px-6 text-center">
      {/* Ambient light leaks — token-tinted blurred orbs, no raw colour. */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[var(--color-brand-primary)]/12 blur-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-[var(--color-brand-accent)]/12 blur-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
      />

      <AnimatePresence mode="wait">
        {!ready ? (
          <motion.div
            key="intro"
            className="relative flex flex-col items-center gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={
              reduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, transition: { duration: 0.4 } }
            }
          >
            {/* Phase 1 — the welcome header. */}
            <motion.h1
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="font-[var(--font-display)] text-[clamp(30px,5vw,46px)] font-[360] leading-[1.05] tracking-[-0.025em] text-[var(--color-foreground)]"
            >
              {t(locale, "bienvenida.header")}
            </motion.h1>

            {/* Phases 2–3 — blooming star + activating rings + particles. */}
            <StarCluster reduced={reduced} />

            {/* Phase 4 — layered progress copy. */}
            <div className="flex max-w-md flex-col items-center gap-2">
              <motion.p
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: reduced ? 0 : 0.9 }}
                className="text-[15px] font-medium text-[var(--color-foreground)]"
              >
                {t(locale, "bienvenida.line1")}
              </motion.p>
              <motion.p
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: reduced ? 0 : 1.1 }}
                className="font-[var(--font-serif)] text-[15px] italic leading-[1.55] text-[var(--color-text-muted)]"
              >
                {t(locale, "bienvenida.line2")}
              </motion.p>

              {/* Phase 5 — hint ticker + the muted tip box. */}
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: reduced ? 0 : 1.4 }}
                className="mt-3 flex flex-col items-center gap-3"
              >
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface)]/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)] backdrop-blur-sm">
                  <span
                    aria-hidden
                    className="relative flex h-1.5 w-1.5"
                  >
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-brand-primary)] opacity-60 motion-safe:animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-brand-primary)]" />
                  </span>
                  {t(locale, "bienvenida.hint.label")}
                  <span className="relative inline-block min-w-[7.5rem] text-left text-[var(--color-brand-primary)]">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={hintIndex}
                        initial={reduced ? false : { opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0"
                      >
                        {hints[hintIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </span>
                <p className="max-w-sm rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-background-elevated)] px-4 py-2.5 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
                  {t(locale, "bienvenida.tip")}
                </p>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          // Phase 6 — the outro: setup complete.
          <motion.div
            key="outro"
            className="relative flex flex-col items-center gap-6"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <ReadyMark reduced={reduced} />
            <h1 className="font-[var(--font-display)] text-[clamp(28px,4.4vw,40px)] font-[360] leading-[1.05] tracking-[-0.025em] text-[var(--color-foreground)]">
              {t(locale, "bienvenida.ready")}
            </h1>
            <Link
              href={dashboardHref}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-6 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
            >
              {t(locale, "bienvenida.cta")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * The animated icon cluster: a blooming, glowing sparkle at the core ringed
 * by three concentric rings (one solid that draws in, two broken that fade
 * in) spinning at different speeds and directions, with drifting particles.
 */
function StarCluster({ reduced }: { reduced: boolean | null }) {
  return (
    <div className="relative h-44 w-44">
      {/* Soft breathing glow behind the star. */}
      <motion.span
        aria-hidden
        className="absolute inset-8 rounded-full bg-[var(--color-brand-primary)]/15 blur-2xl"
        animate={
          reduced ? undefined : { scale: [1, 1.2, 1], opacity: [0.5, 0.85, 0.5] }
        }
        transition={
          reduced ? undefined : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }
        }
      />

      <svg viewBox="0 0 200 200" fill="none" className="absolute inset-0 h-full w-full">
        {/* Ring 3 — outer, broken (sparse dashes), brand-soft, slow CW. */}
        <motion.circle
          cx="100"
          cy="100"
          r="88"
          stroke="var(--color-brand-primary-soft)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="2 22"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          initial={reduced ? { opacity: 1 } : { opacity: 0 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, rotate: 360 }}
          transition={
            reduced
              ? undefined
              : {
                  opacity: { duration: 0.6, delay: 0.7 },
                  rotate: { duration: 26, repeat: Infinity, ease: "linear" },
                }
          }
        />

        {/* Ring 2 — middle, broken (gold), faster CCW. */}
        <motion.circle
          cx="100"
          cy="100"
          r="68"
          stroke="var(--color-gold)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="14 20"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          initial={reduced ? { opacity: 1 } : { opacity: 0 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, rotate: -360 }}
          transition={
            reduced
              ? undefined
              : {
                  opacity: { duration: 0.6, delay: 0.5 },
                  rotate: { duration: 14, repeat: Infinity, ease: "linear" },
                }
          }
        />

        {/* Ring 1 — inner, solid (brand-primary), draws in then spins CW. */}
        <motion.circle
          cx="100"
          cy="100"
          r="50"
          stroke="var(--color-brand-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          initial={reduced ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
          animate={
            reduced
              ? { pathLength: 1, opacity: 1 }
              : { pathLength: 1, opacity: 1, rotate: 360 }
          }
          transition={
            reduced
              ? undefined
              : {
                  pathLength: { duration: 0.9, delay: 0.3, ease: "easeInOut" },
                  opacity: { duration: 0.4, delay: 0.3 },
                  rotate: { duration: 9, repeat: Infinity, ease: "linear", delay: 1.1 },
                }
          }
        />

        {/* Core star — blooms from a point, then breathes. */}
        <motion.path
          d={STAR_PATH}
          fill="var(--color-brand-primary)"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          initial={reduced ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          animate={
            reduced
              ? { scale: 1, opacity: 1 }
              : { scale: [0, 1.05, 1], opacity: 1 }
          }
          transition={
            reduced
              ? undefined
              : { duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }
          }
        />

        {/* Drifting particles. */}
        {PARTICLES.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={p.size}
            fill={i % 2 === 0 ? "var(--color-gold)" : "var(--color-brand-primary)"}
            initial={reduced ? { opacity: 0.7 } : { opacity: 0 }}
            animate={
              reduced
                ? { opacity: 0.7 }
                : { opacity: [0, 0.85, 0.4, 0.85], y: [0, -p.drift, 0] }
            }
            transition={
              reduced
                ? undefined
                : {
                    duration: 3 + (i % 3),
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: p.delay,
                  }
            }
          />
        ))}
      </svg>
    </div>
  );
}

/** Compact success mark for the outro — a filled brand star with a ring. */
function ReadyMark({ reduced }: { reduced: boolean | null }) {
  return (
    <div className="relative h-20 w-20">
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full bg-[var(--color-brand-primary)]/12 blur-xl"
        animate={
          reduced ? undefined : { scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }
        }
        transition={
          reduced ? undefined : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
        }
      />
      <svg viewBox="0 0 200 200" fill="none" className="absolute inset-0 h-full w-full">
        <circle
          cx="100"
          cy="100"
          r="78"
          stroke="var(--color-brand-primary)"
          strokeOpacity="0.3"
          strokeWidth="3"
        />
        <motion.path
          d={STAR_PATH}
          fill="var(--color-brand-primary)"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          initial={reduced ? false : { scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={
            reduced ? undefined : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
          }
        />
      </svg>
    </div>
  );
}
