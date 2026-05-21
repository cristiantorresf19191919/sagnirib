"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Compass,
  Crown,
  HeartHandshake,
  MapPin,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";
import { useClientMounted } from "@/shared/lib/use-client-mounted";

const STORAGE_KEY = "biringas:onboarding-quiz:v1";

// City names are proper nouns — kept literal. The "any" option's label
// is the only one we localise; everything else is a place.
const CITY_VALUES = [
  { value: "Bogotá", icon: MapPin },
  { value: "Medellín", icon: MapPin },
  { value: "Cartagena", icon: MapPin },
  { value: "Cali", icon: MapPin },
] as const;

const BUDGETS = [
  { value: "any", labelKey: "onboarding.budget.none", icon: Wallet, max: undefined },
  { value: "budget", labelKey: "onboarding.budget.up200", icon: Wallet, max: 200000 },
  { value: "premium", labelKey: "onboarding.budget.up400", icon: Wallet, max: 400000 },
  { value: "elite", labelKey: "onboarding.budget.unlimited", icon: Crown, max: undefined },
] as const;

const PLANS = [
  {
    value: "live",
    labelKey: "onboarding.plan.live",
    icon: Sparkles,
    href: "/explorar?available=1",
  },
  {
    value: "social",
    labelKey: "onboarding.plan.social",
    icon: HeartHandshake,
    href: "/explorar?meetingContexts=cena",
  },
  {
    value: "trip",
    labelKey: "onboarding.plan.trip",
    icon: Compass,
    href: "/explorar?meetingContexts=viaje",
  },
  {
    value: "general",
    labelKey: "onboarding.plan.general",
    icon: Sparkles,
    href: "/explorar",
  },
] as const;

/**
 * One-time onboarding quiz: 3 questions, pre-fills the catalog.
 *
 * Fires once per browser via localStorage, only on `/explorar`. Designed
 * to drop time-to-first-favorita dramatically — three taps and the user
 * lands on a filtered catalog that matches their stated intent.
 *
 * Skip / close also marks the quiz as completed so we never bother the
 * user again from this surface. A future "preferencias" page in the
 * account dashboard can reset the flag for users who want a redo.
 */
export function OnboardingQuiz() {
  const router = useRouter();
  const locale = useActiveLocale();
  const [open, setOpen] = useState(false);
  const mounted = useClientMounted();
  const [step, setStep] = useState(0);
  const [city, setCity] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  // Plan choice routes directly; no separate "submit" step.

  // Localised option lists — proper-noun city names stay verbatim,
  // everything else routes through `t()`.
  const cities = [
    ...CITY_VALUES.map((c) => ({ value: c.value, label: c.value, icon: c.icon })),
    {
      value: "any",
      label: t(locale, "onboarding.city.allColombia"),
      icon: Compass,
    },
  ];
  const budgets = BUDGETS.map((b) => ({
    value: b.value,
    label: t(locale, b.labelKey),
    icon: b.icon,
  }));
  const plans = PLANS.map((p) => ({
    value: p.value,
    label: t(locale, p.labelKey),
    icon: p.icon,
  }));

  // Hydrate visibility after mount so SSR markup stays empty. The timer
  // is deferred so setState happens from a timer callback (not the
  // effect body) — keeps `react-hooks/set-state-in-effect` happy.
  useEffect(() => {
    if (globalThis.window === undefined) return;
    try {
      if (globalThis.localStorage.getItem(STORAGE_KEY) === "done") return;
    } catch {
      return;
    }
    const timer = globalThis.setTimeout(() => setOpen(true), 900);
    return () => globalThis.clearTimeout(timer);
  }, []);

  const markDone = useMemo(
    () => () => {
      try {
        globalThis.localStorage.setItem(STORAGE_KEY, "done");
      } catch {
        // ignore
      }
    },
    [],
  );

  const close = () => {
    setOpen(false);
    markDone();
  };

  // While the dialog is visible, lock body scroll and let Escape dismiss it.
  // Without the lock, the user can scroll the catalog underneath the backdrop
  // and lose the modal off-screen.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    globalThis.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      globalThis.removeEventListener("keydown", onKeyDown);
    };
    // `close` is stable enough — the markDone dep would re-bind needlessly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const finish = (planHref: string) => {
    // Compose the final URL from the chosen city + budget + plan href.
    const url = new URL(
      planHref.startsWith("http") ? planHref : `http://x${planHref}`,
    );
    if (city && city !== "any") url.searchParams.set("city", city);
    const budgetEntry = BUDGETS.find((b) => b.value === budget);
    if (budgetEntry?.max) {
      url.searchParams.set("priceMax", String(budgetEntry.max));
    }
    const finalHref = `${url.pathname}${url.search}`;
    markDone();
    setOpen(false);
    router.push(finalHref);
  };

  // Render through a portal to `document.body` so the dialog escapes any
  // ancestor that has accidentally established a containing block for
  // `position: fixed` (transform, filter, container-type, etc.). Without
  // this, the modal can land far below the viewport even though it is
  // `fixed inset-0`.
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="onboarding-quiz"
          className="fixed inset-0 z-[140] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
        >
          <button
            type="button"
            aria-label={t(locale, "onboarding.close")}
            onClick={close}
            className="absolute inset-0 cursor-default bg-[rgba(20,28,24,0.55)] backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 28,
              mass: 0.6,
            }}
            className="relative z-10 m-0 flex w-full max-h-[92dvh] flex-col overflow-hidden rounded-t-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-background-elevated)] shadow-[var(--shadow-lg)] sm:m-4 sm:max-h-[88vh] sm:max-w-md sm:rounded-[var(--radius-2xl)]"
          >
            <header className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
              <div className="flex min-w-0 flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--color-gold-deep)]">
                  {t(locale, "onboarding.kicker")}
                </span>
                <h2
                  id="onboarding-title"
                  className="font-[var(--font-display)] text-lg font-[370] tracking-tight text-[var(--color-foreground)]"
                >
                  {t(locale, "onboarding.title.lead")}{" "}
                  <span className="italic text-[var(--color-brand-primary)]">
                    {t(locale, "onboarding.title.highlight")}
                  </span>
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label={t(locale, "onboarding.skip")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-6">
              {/* Step indicator */}
              <div
                aria-hidden
                className="mb-5 flex items-center gap-1.5"
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                      i <= step
                        ? "bg-[var(--color-brand-primary)]"
                        : "bg-[var(--color-border)]"
                    }`}
                  />
                ))}
              </div>

              {step === 0 && (
                <Step
                  title={t(locale, "onboarding.step1.title")}
                  subtitle={t(locale, "onboarding.step1.subtitle")}
                  options={cities}
                  selected={city}
                  onSelect={(v) => {
                    setCity(v);
                    setStep(1);
                  }}
                />
              )}

              {step === 1 && (
                <Step
                  title={t(locale, "onboarding.step2.title")}
                  subtitle={t(locale, "onboarding.step2.subtitle")}
                  options={budgets}
                  selected={budget}
                  onSelect={(v) => {
                    setBudget(v);
                    setStep(2);
                  }}
                />
              )}

              {step === 2 && (
                <Step
                  title={t(locale, "onboarding.step3.title")}
                  subtitle={t(locale, "onboarding.step3.subtitle")}
                  options={plans}
                  selected={null}
                  onSelect={(value) => {
                    const plan = PLANS.find((p) => p.value === value);
                    if (plan) finish(plan.href);
                  }}
                />
              )}
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface)]/70 px-5 py-3">
              <button
                type="button"
                onClick={close}
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-foreground)]"
              >
                {t(locale, "onboarding.skip")}
              </button>
              <span className="text-[10px] text-[var(--color-text-subtle)]">
                {t(locale, "onboarding.step.indicator", {
                  current: step + 1,
                  total: 3,
                })}
              </span>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

interface StepOption {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}

interface StepProps {
  title: string;
  subtitle: string;
  options: ReadonlyArray<StepOption>;
  selected: string | null;
  onSelect: (value: string) => void;
}

function Step({ title, subtitle, options, selected, onSelect }: Readonly<StepProps>) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-base font-semibold text-[var(--color-foreground)]">
          {title}
        </h3>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const Icon = opt.icon;
          const checked = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              className={`group flex items-center gap-3 rounded-[var(--radius-lg)] border p-3 text-left transition-[border-color,background,transform] duration-150 ease-[var(--ease-standard)] hover:-translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] ${
                checked
                  ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/8"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand-primary-soft)]"
              }`}
            >
              <span
                aria-hidden
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]"
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-sm font-semibold text-[var(--color-foreground)]">
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
