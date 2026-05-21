"use client";

import { Check, Gift } from "lucide-react";

import { useActiveLocale } from "@/core/i18n/use-active-locale";
import { t } from "@/core/i18n/messages";

import {
  ADD_ONS,
  type BillingCycle,
  PACKAGES,
  type PackageId,
  PLANS_ENABLED,
  calculateTotal,
  formatCop,
  type AddOnId,
} from "../lib/pricing";

interface OrderSummaryProps {
  packageId: PackageId;
  addOnIds: ReadonlyArray<AddOnId>;
  billing: BillingCycle;
}

export function OrderSummary({ packageId, addOnIds, billing }: OrderSummaryProps) {
  const locale = useActiveLocale();
  if (!PLANS_ENABLED) {
    return <FreeLaunchSummary />;
  }

  const pkg = PACKAGES.find((p) => p.id === packageId)!;
  const totals = calculateTotal(packageId, addOnIds, billing);
  const months = billing === "quarterly" ? 3 : 1;
  const cycleLabel =
    billing === "quarterly"
      ? t(locale, "publicar.order.cycle.quarterly")
      : t(locale, "publicar.order.cycle.monthly");
  const monthLabel =
    months === 1
      ? t(locale, "publicar.order.cycle.month.singular")
      : t(locale, "publicar.order.cycle.month.plural");

  return (
    <aside className="sticky top-24 flex flex-col gap-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-muted)]">
          {t(locale, "publicar.order.kicker")}
        </span>
        <span className="text-base font-semibold text-[var(--color-foreground)]">
          {t(locale, "publicar.order.plan", { name: pkg.name })}
        </span>
        <span className="text-[12px] text-[var(--color-text-muted)]">
          {t(locale, "publicar.order.cycleNote", {
            months,
            monthLabel,
            cycle: cycleLabel,
          })}
        </span>
      </div>

      <ul className="flex flex-col gap-2 text-[12px] text-[var(--color-text-muted)]">
        <SummaryLine
          label={t(locale, "publicar.order.plan", { name: pkg.name })}
          amount={totals.packageCop}
        />
        {addOnIds.length > 0 ? (
          addOnIds.map((id) => {
            const addOn = ADD_ONS.find((a) => a.id === id)!;
            return (
              <SummaryLine
                key={id}
                label={addOn.name}
                amount={addOn.priceCop}
                hint={t(locale, "publicar.order.addOnHint")}
              />
            );
          })
        ) : (
          <li className="text-[12px] italic text-[var(--color-text-subtle)]">
            {t(locale, "publicar.order.noAddOns")}
          </li>
        )}
      </ul>

      <div className="flex flex-col gap-1 border-t border-[var(--color-border)] pt-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-[var(--color-foreground)]">
            {t(locale, "publicar.order.totalNow")}
          </span>
          <span className="text-xl font-bold tracking-tight text-[var(--color-foreground)]">
            {formatCop(totals.totalCop)}
          </span>
        </div>
        <span className="text-[11px] text-[var(--color-text-subtle)]">
          {t(locale, "publicar.order.effectivePerMonth", {
            amount: formatCop(totals.effectiveMonthlyCop),
          })}
        </span>
      </div>

      <ul className="flex flex-col gap-1.5 text-[11px] text-[var(--color-text-muted)]">
        <Reassurance>{t(locale, "publicar.order.reassure.cancel")}</Reassurance>
        <Reassurance>{t(locale, "publicar.order.reassure.support")}</Reassurance>
        <Reassurance>{t(locale, "publicar.order.reassure.privacy")}</Reassurance>
      </ul>
    </aside>
  );
}

function SummaryLine({
  label,
  amount,
  hint,
}: {
  label: string;
  amount: number;
  hint?: string;
}) {
  return (
    <li className="flex items-baseline justify-between gap-3">
      <span className="flex flex-col">
        <span>{label}</span>
        {hint && (
          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
            {hint}
          </span>
        )}
      </span>
      <span className="text-[12px] font-semibold text-[var(--color-foreground)]">
        {formatCop(amount)}
      </span>
    </li>
  );
}

/**
 * Side panel shown during MVP launch (PLANS_ENABLED === false). Replaces
 * pricing breakdown with a free-launch explainer so the modelo isn't
 * looking at strikethrough prices or zero totals.
 */
function FreeLaunchSummary() {
  const locale = useActiveLocale();
  return (
    <aside className="sticky top-24 flex flex-col gap-4 rounded-[var(--radius-xl)] border border-[var(--color-brand-primary)]/30 bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
      <div className="flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-brand-primary)]/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-primary)]">
          <Gift className="h-3 w-3" aria-hidden />
          {t(locale, "publicar.order.free.launchPill")}
        </span>
        <span className="text-base font-semibold text-[var(--color-foreground)]">
          {t(locale, "publicar.order.free.title")}
        </span>
        <span className="text-[12px] leading-relaxed text-[var(--color-text-muted)]">
          {t(locale, "publicar.order.free.body")}
        </span>
      </div>

      <div className="flex flex-col gap-1 border-t border-[var(--color-border)] pt-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-[var(--color-foreground)]">
            {t(locale, "publicar.order.totalNow")}
          </span>
          <span className="text-xl font-bold tracking-tight text-[var(--color-brand-primary)]">
            {t(locale, "publicar.submitted.totalFree")}
          </span>
        </div>
        <span className="text-[11px] text-[var(--color-text-subtle)]">
          {t(locale, "publicar.order.free.note")}
        </span>
      </div>

      <ul className="flex flex-col gap-1.5 text-[11px] text-[var(--color-text-muted)]">
        <Reassurance>
          {t(locale, "publicar.order.free.reassure.review")}
        </Reassurance>
        <Reassurance>
          {t(locale, "publicar.order.free.reassure.edit")}
        </Reassurance>
        <Reassurance>{t(locale, "publicar.order.reassure.privacy")}</Reassurance>
      </ul>
    </aside>
  );
}

function Reassurance({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span
        aria-hidden
        className="mt-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)]"
      >
        <Check className="h-2 w-2" aria-hidden />
      </span>
      {children}
    </li>
  );
}
