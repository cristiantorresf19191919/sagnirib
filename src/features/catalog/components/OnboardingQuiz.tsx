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

const STORAGE_KEY = "biringas:onboarding-quiz:v1";

const CITIES = [
  { value: "Bogotá", label: "Bogotá", icon: MapPin },
  { value: "Medellín", label: "Medellín", icon: MapPin },
  { value: "Cartagena", label: "Cartagena", icon: MapPin },
  { value: "Cali", label: "Cali", icon: MapPin },
  { value: "any", label: "Toda Colombia", icon: Compass },
] as const;

const BUDGETS = [
  { value: "any", label: "Sin presupuesto", icon: Wallet, max: undefined },
  { value: "budget", label: "Hasta $200k", icon: Wallet, max: 200000 },
  { value: "premium", label: "Hasta $400k", icon: Wallet, max: 400000 },
  { value: "elite", label: "Sin tope", icon: Crown, max: undefined },
] as const;

const PLANS = [
  {
    value: "live",
    label: "Algo para hoy",
    icon: Sparkles,
    href: "/explorar?available=1",
  },
  {
    value: "social",
    label: "Cena / evento",
    icon: HeartHandshake,
    href: "/explorar?meetingContexts=cena",
  },
  {
    value: "trip",
    label: "Fin de semana",
    icon: Compass,
    href: "/explorar?meetingContexts=viaje",
  },
  {
    value: "general",
    label: "Solo estoy mirando",
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
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [city, setCity] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  // Plan choice routes directly; no separate "submit" step.

  // Hydrate visibility after mount so SSR markup stays empty.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "done") return;
    } catch {
      return;
    }
    const timer = window.setTimeout(() => setOpen(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  const markDone = useMemo(
    () => () => {
      try {
        window.localStorage.setItem(STORAGE_KEY, "done");
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

  return (
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
            aria-label="Cerrar"
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
                  Bienvenida
                </span>
                <h2
                  id="onboarding-title"
                  className="font-[var(--font-display)] text-lg font-[370] tracking-tight text-[var(--color-foreground)]"
                >
                  Encuentra tu Biringa en{" "}
                  <span className="italic text-[var(--color-brand-primary)]">
                    3 toques
                  </span>
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Saltar"
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
                  title="¿En qué ciudad estás?"
                  subtitle="Filtramos el catálogo para mostrarte sólo lo cercano."
                  options={CITIES}
                  selected={city}
                  onSelect={(v) => {
                    setCity(v);
                    setStep(1);
                  }}
                />
              )}

              {step === 1 && (
                <Step
                  title="¿Cuánto querés invertir por hora?"
                  subtitle="Sólo nos ayuda a ordenar. Podés cambiarlo después."
                  options={BUDGETS}
                  selected={budget}
                  onSelect={(v) => {
                    setBudget(v);
                    setStep(2);
                  }}
                />
              )}

              {step === 2 && (
                <Step
                  title="¿Qué plan tenés en mente?"
                  subtitle="Llevamos directo al catálogo con el filtro aplicado."
                  options={PLANS}
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
                Saltar
              </button>
              <span className="text-[10px] text-[var(--color-text-subtle)]">
                Paso {step + 1} de 3
              </span>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
