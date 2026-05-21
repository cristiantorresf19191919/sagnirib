"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";
import { useState, useTransition } from "react";

import { useActiveLocale, useLocalizedHref } from "@/core/i18n/use-active-locale";
import { t } from "@/core/i18n/messages";
import { toast } from "@/shared/ui/toast";

/**
 * UI mirror of the server-side label dictionaries. Server is the
 * source of truth and rejects unknown values via the schema — keeping
 * copies here lets this client component stay free of any server-only
 * import. Sync with `src/server/biringas/checkout-types.ts` when a
 * new tier or cadence ships.
 */
type PlanTier = "boost" | "elite";
type BillingCadence = "monthly" | "quarterly";

import {
  completeMockCheckout,
  createCheckoutSession,
} from "../actions/create-checkout-session";

const COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const FADE: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, y: -4, transition: { duration: 0.2 } },
};

interface CheckoutFlowProps {
  tier: PlanTier;
  /** Pre-computed prices passed by the server so the summary renders
   *  without an extra fetch. The server still re-derives the total on
   *  submit; this is display-only. */
  pricing: { monthly: number; quarterly: number };
}

type Step = "review" | "paying" | "done";

/**
 * Mocked plan-checkout shell. Three steps:
 *   1. review  → user picks monthly vs quarterly, eyeballs total
 *   2. paying  → fake provider call (1.5s spinner)
 *   3. done    → success card + CTA back to /mi-cuenta
 *
 * The shell mirrors what a real Stripe Connect / MercadoPago flow
 * will look like — the only thing that changes when the real provider
 * lands is the action-layer "Pay" handler. The surface, copy, and
 * summary card stay byte-identical so we ship the look once.
 */
export function CheckoutFlow({ tier, pricing }: Readonly<CheckoutFlowProps>) {
  const router = useRouter();
  const locale = useActiveLocale();
  const accountHref = useLocalizedHref("/mi-cuenta");
  const plansHref = useLocalizedHref("/publicar/planes");
  const planLabel = t(locale, `checkout.tierLabel.${tier}`);
  const [billing, setBilling] = useState<BillingCadence>("monthly");
  const [step, setStep] = useState<Step>("review");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalCop = pricing[billing];

  const onPay = () => {
    setError(null);
    setStep("paying");
    startTransition(async () => {
      const created = await createCheckoutSession({ tier, billing });
      if (!created.ok || !created.data) {
        setError(
          created.error?.kind === "checkout-disabled"
            ? t(locale, "checkout.error.disabled")
            : created.error?.message ?? t(locale, "checkout.error.create"),
        );
        setStep("review");
        return;
      }
      // Simulated provider delay so the spinner has presence.
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const completed = await completeMockCheckout({ id: created.data.id });
      if (!completed.ok) {
        setError(
          completed.error?.message ?? t(locale, "checkout.error.complete"),
        );
        setStep("review");
        return;
      }
      toast.success(
        t(locale, "checkout.toast.success.title"),
        t(locale, "checkout.toast.success.body", { plan: planLabel }),
      );
      setStep("done");
    });
  };

  return (
    <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
      {/* Left: cycle picker + payment button OR success card */}
      <div className="flex flex-col gap-5">
        <AnimatePresence mode="wait">
          {step === "review" && (
            <motion.section
              key="review"
              variants={FADE}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col gap-5 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] sm:p-8"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/20"
                >
                  <CreditCard className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-[var(--color-foreground)]">
                    {t(locale, "checkout.review.title")}
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {t(locale, "checkout.review.subtitle")}
                  </p>
                </div>
              </div>

              {/* Billing cadence */}
              <fieldset className="flex flex-col gap-2">
                <legend className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                  {t(locale, "checkout.billing.legend")}
                </legend>
                {(["monthly", "quarterly"] as BillingCadence[]).map((value) => {
                  const active = billing === value;
                  const amount = pricing[value];
                  const perMonth = value === "quarterly" ? amount / 3 : amount;
                  return (
                    <label
                      key={value}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-lg)] border p-4 transition-[border-color,background] duration-150 ease-[var(--ease-standard)] ${
                        active
                          ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/8"
                          : "border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-brand-primary-soft)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="billing"
                        value={value}
                        checked={active}
                        onChange={() => setBilling(value)}
                        className="sr-only"
                      />
                      <div className="flex min-w-0 flex-col">
                        <span className="text-sm font-semibold text-[var(--color-foreground)]">
                          {t(locale, `checkout.billing.${value}.label`)}
                        </span>
                        <span className="text-[11px] text-[var(--color-text-muted)]">
                          {value === "quarterly"
                            ? t(locale, "checkout.billing.quarterly.subtitle", {
                                perMonth: COP.format(perMonth),
                              })
                            : t(locale, "checkout.billing.monthly.subtitle")}
                        </span>
                      </div>
                      <span className="text-base font-bold tabular-nums text-[var(--color-foreground)]">
                        {COP.format(amount)}
                      </span>
                    </label>
                  );
                })}
              </fieldset>

              {error && (
                <p
                  role="alert"
                  className="rounded-[var(--radius-md)] border border-[var(--color-brand-highlight)]/40 bg-[var(--color-brand-highlight)]/10 px-3 py-2 text-xs text-[var(--color-brand-highlight)]"
                >
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={onPay}
                disabled={isPending}
                className="btn-pulse inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Lock className="h-4 w-4" aria-hidden />
                {t(locale, "checkout.payButton", {
                  amount: COP.format(totalCop),
                })}
              </button>

              <p className="text-center text-[11px] text-[var(--color-text-subtle)]">
                <strong>{t(locale, "checkout.simulationNote.lead")}</strong>{" "}
                {t(locale, "checkout.simulationNote.body")}
              </p>
            </motion.section>
          )}

          {step === "paying" && (
            <motion.section
              key="paying"
              variants={FADE}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center gap-4 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center"
            >
              <Loader2
                className="h-10 w-10 animate-spin text-[var(--color-brand-primary)]"
                aria-hidden
              />
              <h2 className="font-[var(--font-display)] text-xl font-[370] text-[var(--color-foreground)]">
                {t(locale, "checkout.paying.title")}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                {t(locale, "checkout.paying.subtitle")}
              </p>
            </motion.section>
          )}

          {step === "done" && (
            <motion.section
              key="done"
              variants={FADE}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col gap-4 rounded-[var(--radius-2xl)] border border-[var(--color-brand-primary)]/40 bg-[var(--color-brand-primary)]/8 p-8 shadow-[var(--shadow-md)]"
            >
              <span
                aria-hidden
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)] text-[var(--color-surface)]"
              >
                <Check className="h-6 w-6" aria-hidden />
              </span>
              <h2 className="font-[var(--font-display)] text-2xl font-[370] leading-tight tracking-tight text-[var(--color-foreground)]">
                {t(locale, "checkout.done.titleLead")}{" "}
                <span className="italic text-[var(--color-brand-primary)]">
                  {planLabel}
                </span>{" "}
                {t(locale, "checkout.done.titleTrailing")}
              </h2>
              <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                {t(locale, "checkout.done.body")}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    router.push(accountHref);
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)]"
                >
                  {t(locale, "checkout.done.goToPanel")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("review");
                  }}
                  className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-foreground)]"
                >
                  {t(locale, "checkout.done.activateAnother")}
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => router.push(plansHref)}
          className="inline-flex items-center gap-1.5 self-start text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-foreground)]"
        >
          <ArrowLeft className="h-3 w-3" aria-hidden />
          {t(locale, "checkout.backToPlans")}
        </button>
      </div>

      {/* Right: plan summary */}
      <aside className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-background-elevated)] p-6 shadow-[var(--shadow-sm)]">
        <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-gold-deep)]">
          <Sparkles className="h-3 w-3" aria-hidden />
          {t(locale, "checkout.summary.kicker")}
        </span>
        <h3 className="mt-1 font-[var(--font-display)] text-xl font-[420] tracking-tight text-[var(--color-foreground)]">
          {t(locale, "checkout.summary.plan", { name: planLabel })}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {t(locale, `checkout.summary.description.${tier}`)}
        </p>
        <dl className="mt-6 flex flex-col gap-3 text-sm">
          <Row
            label={t(locale, "checkout.summary.row.cycle")}
            value={t(locale, `checkout.billing.${billing}.label`)}
          />
          <Row label={t(locale, "checkout.summary.row.plan")} value={planLabel} />
          <Row
            label={t(locale, "checkout.summary.row.total")}
            value={COP.format(totalCop)}
            emphasised
          />
        </dl>
        <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-border)]/70 bg-[var(--color-surface)] p-3 text-[11px] text-[var(--color-text-muted)]">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-foreground)]">
            <Lock className="h-3 w-3" aria-hidden />
            {t(locale, "checkout.summary.discreet.title")}
          </span>
          <p className="mt-1 leading-relaxed">
            {t(locale, "checkout.summary.discreet.body.lead")}{" "}
            <em>{t(locale, "checkout.summary.discreet.body.product")}</em>{" "}
            {t(locale, "checkout.summary.discreet.body.trailing")}
          </p>
        </div>
      </aside>
    </div>
  );
}

interface RowProps {
  label: string;
  value: string;
  emphasised?: boolean;
}

function Row({ label, value, emphasised }: Readonly<RowProps>) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
        {label}
      </dt>
      <dd
        className={`font-semibold tabular-nums ${
          emphasised
            ? "text-base text-[var(--color-foreground)]"
            : "text-sm text-[var(--color-foreground)]"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
