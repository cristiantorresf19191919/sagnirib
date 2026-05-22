"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  Camera,
  CheckCircle2,
  Compass,
  Crown,
  Eye,
  Heart,
  Loader2,
  MessageCircle,
  Sparkles,
  Star,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";

interface MarketingTipsLoaderProps {
  /** When true, the loader overlays the page. */
  open: boolean;
  /** Big title above the rotating tip. */
  title?: string;
  /** Small caption beneath the title. */
  subtitle?: string;
}

interface Tip {
  icon: LucideIcon;
  key: string;
}

const TIPS: ReadonlyArray<Tip> = [
  { icon: Camera, key: "rbac.publisher.loader.tip.photos" },
  { icon: Star, key: "rbac.publisher.loader.tip.title" },
  { icon: TrendingUp, key: "rbac.publisher.loader.tip.verified" },
  { icon: MessageCircle, key: "rbac.publisher.loader.tip.telegram" },
  { icon: Heart, key: "rbac.publisher.loader.tip.responsive" },
  { icon: Eye, key: "rbac.publisher.loader.tip.description" },
  { icon: Compass, key: "rbac.publisher.loader.tip.location" },
  { icon: Crown, key: "rbac.publisher.loader.tip.premium" },
  { icon: Sparkles, key: "rbac.publisher.loader.tip.video" },
];

const ROTATION_MS = 3200;

/**
 * Full-screen overlay shown while a publisher profile is being submitted
 * to moderation. Instead of a generic spinner, surfaces rotating
 * marketing tips written like advice from a senior conversion specialist
 * — keeps the wait productive and primes the user to optimise their
 * listing for performance.
 *
 * Locks pointer events on the body so the user can't double-submit. Uses
 * AnimatePresence to cross-fade tips with motion-smooth easing. Respects
 * `prefers-reduced-motion`.
 */
export function MarketingTipsLoader({
  open,
  title,
  subtitle,
}: Readonly<MarketingTipsLoaderProps>) {
  const locale = useActiveLocale();
  const reducedMotion = useReducedMotion();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!open) return;
    const interval = window.setInterval(() => {
      setIdx((current) => (current + 1) % TIPS.length);
    }, ROTATION_MS);
    return () => window.clearInterval(interval);
  }, [open]);

  // Lock body scroll while open so the loader feels modal.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const tip = TIPS[idx]!;
  const Icon = tip.icon;
  const resolvedTitle = title ?? t(locale, "rbac.publisher.loader.title");
  const resolvedSubtitle =
    subtitle ?? t(locale, "rbac.publisher.loader.subtitle");

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-modal="true"
          aria-live="polite"
          aria-busy="true"
          aria-label={resolvedTitle}
          className="fixed inset-0 z-[60] flex items-center justify-center"
        >
          {/* Atmospheric backdrop */}
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-[var(--color-background)]/85 backdrop-blur-md"
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(47,93,67,0.20),transparent_65%)]" />
            <div className="absolute right-[20%] top-[40%] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_center,rgba(200,166,118,0.16),transparent_70%)]" />
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ scale: 0.96, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 12, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mx-4 flex w-full max-w-md flex-col items-center gap-7 overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-lg)]"
          >
            {/* Gold hairline + corner ornaments */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)]/60 to-transparent"
            />

            {/* Spinner — orbiting ring + center sparkle */}
            <div className="relative flex h-16 w-16 items-center justify-center">
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full border border-[var(--color-brand-primary)]/20"
              />
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--color-brand-primary)]"
                animate={reducedMotion ? undefined : { rotate: 360 }}
                transition={{ duration: 1.4, ease: "linear", repeat: Infinity }}
              />
              <motion.span
                aria-hidden
                className="absolute inset-2 rounded-full border-2 border-transparent border-t-[var(--color-gold)]"
                animate={reducedMotion ? undefined : { rotate: -360 }}
                transition={{ duration: 2.2, ease: "linear", repeat: Infinity }}
              />
              <Loader2
                className="hidden h-4 w-4 text-[var(--color-brand-primary)] motion-reduce:block"
                aria-hidden
              />
              <motion.span
                aria-hidden
                animate={
                  reducedMotion
                    ? undefined
                    : { scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }
                }
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/30 motion-reduce:hidden"
              >
                <Sparkles className="h-3 w-3" aria-hidden />
              </motion.span>
            </div>

            <div className="flex flex-col items-center gap-1.5 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-brand-primary)]">
                {t(locale, "rbac.publisher.loader.kicker")}
              </span>
              <h2 className="font-[var(--font-display)] text-2xl font-[370] leading-[1.1] tracking-[-0.02em] text-[var(--color-foreground)]">
                {resolvedTitle}
              </h2>
              <p className="max-w-xs text-sm text-[var(--color-text-muted)]">
                {resolvedSubtitle}
              </p>
            </div>

            <hr className="w-12 border-0 border-t border-[var(--color-gold)]/40" />

            {/* Rotating tip */}
            <div className="relative flex min-h-[110px] w-full items-start gap-3">
              <span
                aria-hidden
                className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-subtle)]"
              >
                {t(locale, "rbac.publisher.loader.tipsHeading")}
              </span>
            </div>
            <div className="relative -mt-4 flex w-full items-start gap-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="flex w-full items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background-elevated)] p-4"
                >
                  <span
                    aria-hidden
                    className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/25"
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <p className="flex-1 text-sm leading-relaxed text-[var(--color-foreground)]">
                    {t(locale, tip.key)}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress dots */}
            <div
              aria-hidden
              className="flex items-center gap-1.5"
            >
              {TIPS.map((_, i) => (
                <motion.span
                  key={i}
                  initial={false}
                  animate={{
                    scale: i === idx ? 1 : 0.7,
                    opacity: i === idx ? 1 : 0.35,
                    width: i === idx ? 18 : 6,
                  }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className={`h-1.5 rounded-full ${
                    i === idx
                      ? "bg-[var(--color-brand-primary)]"
                      : "bg-[var(--color-border)]"
                  }`}
                />
              ))}
            </div>

            <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              {t(locale, "rbac.publisher.loader.dontClose")}
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
