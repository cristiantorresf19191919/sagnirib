"use client";

import { Check, Gift, Sparkles, TrendingUp } from "lucide-react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";

import {
  ADD_ONS,
  type AddOnId,
  type BillingCycle,
  PACKAGES,
  type PackageId,
  PLANS_ENABLED,
  formatCop,
} from "../lib/pricing";
import type { PublishValues } from "../lib/types";
import { SectionShell } from "./SectionShell";

interface StepPublishProps {
  values: PublishValues;
  onChange: (next: PublishValues) => void;
}

export function StepPublish({ values, onChange }: StepPublishProps) {
  const locale = useActiveLocale();

  function update<K extends keyof PublishValues>(key: K, v: PublishValues[K]) {
    onChange({ ...values, [key]: v });
  }

  function selectPackage(id: PackageId) {
    if (!PLANS_ENABLED) return;
    update("packageId", id);
  }
  function toggleAddOn(id: AddOnId) {
    if (!PLANS_ENABLED) return;
    const has = values.addOnIds.includes(id);
    update(
      "addOnIds",
      has ? values.addOnIds.filter((x) => x !== id) : [...values.addOnIds, id],
    );
  }

  return (
    <SectionShell
      eyebrow={t(locale, "step.publish.eyebrow")}
      title={
        PLANS_ENABLED
          ? t(locale, "step.publish.title.paid")
          : t(locale, "step.publish.title.free")
      }
      description={
        PLANS_ENABLED
          ? t(locale, "step.publish.description.paid")
          : t(locale, "step.publish.description.free")
      }
    >
      {!PLANS_ENABLED && <FreeLaunchBanner locale={locale} />}

      {PLANS_ENABLED && (
        <BillingToggle
          locale={locale}
          billing={values.billing}
          onChange={(v) => update("billing", v)}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {PACKAGES.map((pkg) => (
          <PackageCard
            key={pkg.id}
            locale={locale}
            packageId={pkg.id}
            selected={PLANS_ENABLED && values.packageId === pkg.id}
            billing={values.billing}
            onSelect={selectPackage}
            disabled={!PLANS_ENABLED}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
            {t(locale, "step.publish.addons.title")}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-subtle)]">
            <TrendingUp className="h-3 w-3" aria-hidden />
            {PLANS_ENABLED
              ? t(locale, "step.publish.addons.hint.enabled")
              : t(locale, "step.publish.addons.hint.disabled")}
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {ADD_ONS.map((addOn) => (
            <AddOnCard
              key={addOn.id}
              locale={locale}
              id={addOn.id}
              name={addOn.name}
              description={addOn.description}
              priceLabel={`${formatCop(addOn.priceCop)} ${addOn.unit}`.trim()}
              family={addOn.family}
              selected={PLANS_ENABLED && values.addOnIds.includes(addOn.id)}
              onToggle={toggleAddOn}
              disabled={!PLANS_ENABLED}
            />
          ))}
        </div>
      </div>

      <fieldset className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background-elevated)] p-4">
        <legend className="px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
          {t(locale, "step.publish.terms.legend")}
        </legend>
        <CheckLine
          checked={values.acceptsAdult}
          onChange={(v) => update("acceptsAdult", v)}
          label={t(locale, "step.publish.terms.adult")}
        />
        <CheckLine
          checked={values.acceptsTerms}
          onChange={(v) => update("acceptsTerms", v)}
          label={t(locale, "step.publish.terms.terms")}
        />
      </fieldset>
    </SectionShell>
  );
}

function FreeLaunchBanner({ locale }: { locale: SupportedLocale }) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-[var(--radius-xl)] border border-[var(--color-brand-primary)]/40 bg-[var(--color-brand-primary)]/8 p-4"
    >
      <span
        aria-hidden
        className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)]"
      >
        <Gift className="h-4 w-4" aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-[var(--color-foreground)]">
          {t(locale, "step.publish.freeBanner.title")}
        </span>
        <span className="text-[12px] leading-relaxed text-[var(--color-text-muted)]">
          {t(locale, "step.publish.freeBanner.body")}
        </span>
      </div>
    </div>
  );
}

interface BillingToggleProps {
  locale: SupportedLocale;
  billing: BillingCycle;
  onChange: (next: BillingCycle) => void;
}

function BillingToggle({ locale, billing, onChange }: BillingToggleProps) {
  const options: ReadonlyArray<{ id: BillingCycle }> = [
    { id: "monthly" },
    { id: "quarterly" },
  ];
  return (
    <div
      role="radiogroup"
      aria-label={t(locale, "step.publish.billing.aria")}
      className="inline-flex w-full max-w-md self-start rounded-full border border-[var(--color-border)] bg-[var(--color-background-elevated)] p-1"
    >
      {options.map((opt) => {
        const active = billing === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.id)}
            className={`flex flex-1 flex-col items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-[background,color,box-shadow] duration-150 ease-[var(--ease-standard)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] ${
              active
                ? "bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-[var(--shadow-sm)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-foreground)]"
            }`}
          >
            <span>{t(locale, `step.publish.billing.${opt.id}.label`)}</span>
            <span
              className={`text-[11px] font-medium ${
                active
                  ? "text-[var(--color-brand-primary)]"
                  : "text-[var(--color-text-subtle)]"
              }`}
            >
              {t(locale, `step.publish.billing.${opt.id}.sublabel`)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface PackageCardProps {
  locale: SupportedLocale;
  packageId: PackageId;
  selected: boolean;
  billing: BillingCycle;
  onSelect: (id: PackageId) => void;
  disabled?: boolean;
}

function PackageCard({
  locale,
  packageId,
  selected,
  billing,
  onSelect,
  disabled = false,
}: PackageCardProps) {
  const pkg = PACKAGES.find((p) => p.id === packageId)!;
  const months = billing === "quarterly" ? 3 : 1;
  const discount = billing === "quarterly" ? pkg.quarterlyDiscountPct / 100 : 0;
  const total = Math.round(pkg.monthlyCop * months * (1 - discount));
  const monthly = Math.round(total / months);

  const tone = disabled
    ? "border-[var(--color-border)] bg-[var(--color-surface-muted)] opacity-60"
    : selected
      ? "border-[var(--color-brand-primary)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]"
      : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand-primary-soft)]";

  return (
    <button
      type="button"
      onClick={() => onSelect(packageId)}
      aria-pressed={selected}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      className={`relative flex flex-col gap-4 rounded-[var(--radius-xl)] border p-5 text-left transition-[border-color,background,box-shadow,transform] duration-200 ease-[var(--ease-standard)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${disabled ? "cursor-not-allowed" : ""} ${tone}`}
    >
      {disabled && (
        <span className="absolute -top-3 right-5 inline-flex items-center gap-1 rounded-full bg-[var(--color-foreground)]/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-surface)] shadow-[var(--shadow-sm)]">
          {t(locale, "step.publish.pkg.comingSoon")}
        </span>
      )}
      {pkg.recommended && !disabled && (
        <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-primary)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-surface)] shadow-[var(--shadow-sm)]">
          <Sparkles className="h-3 w-3" aria-hidden />
          {t(locale, "step.publish.pkg.recommended")}
        </span>
      )}
      <span
        aria-hidden
        className={`absolute right-4 top-4 inline-flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
          selected
            ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-[var(--color-surface)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)]"
        }`}
      >
        {selected && <Check className="h-3.5 w-3.5" aria-hidden />}
      </span>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-brand-primary)]">
          {pkg.name}
        </span>
        <span className="text-sm text-[var(--color-text-muted)]">
          {pkg.tagline}
        </span>
      </div>

      <div className="flex flex-col">
        <span className="flex items-baseline gap-2">
          <span className="text-3xl font-bold leading-none tracking-tight text-[var(--color-foreground)]">
            {formatCop(monthly)}
          </span>
          <span className="text-[12px] text-[var(--color-text-muted)]">
            {t(locale, "step.publish.pkg.perMonth")}
          </span>
        </span>
        {billing === "quarterly" && (
          <span className="mt-1 text-[11px] text-[var(--color-brand-primary)]">
            {t(locale, "step.publish.pkg.quarterly", {
              total: formatCop(total),
              pct: pkg.quarterlyDiscountPct,
            })}
          </span>
        )}
      </div>

      <ul className="flex flex-col gap-2 text-[13px] text-[var(--color-text-muted)]">
        {pkg.perks.map((perk) => (
          <li key={perk} className="flex items-start gap-2">
            <span
              aria-hidden
              className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)]"
            >
              <Check className="h-2.5 w-2.5" aria-hidden />
            </span>
            {perk}
          </li>
        ))}
      </ul>

      <span className="mt-auto text-[11px] italic text-[var(--color-text-subtle)]">
        {pkg.bestFor}
      </span>
    </button>
  );
}

interface AddOnCardProps {
  locale: SupportedLocale;
  id: AddOnId;
  name: string;
  description: string;
  priceLabel: string;
  family: "boost" | "content";
  selected: boolean;
  onToggle: (id: AddOnId) => void;
  disabled?: boolean;
}

function AddOnCard({
  locale,
  id,
  name,
  description,
  priceLabel,
  family,
  selected,
  onToggle,
  disabled = false,
}: AddOnCardProps) {
  const familyTone =
    family === "boost"
      ? "bg-[var(--color-brand-accent)]/15 text-[var(--color-brand-accent-strong)]"
      : "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]";
  const familyLabel = t(
    locale,
    family === "boost"
      ? "step.publish.addons.family.boost"
      : "step.publish.addons.family.content",
  );

  let stateTone: string;
  if (disabled) {
    stateTone =
      "border-[var(--color-border)] bg-[var(--color-surface-muted)] opacity-60 cursor-not-allowed";
  } else if (selected) {
    stateTone =
      "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5";
  } else {
    stateTone =
      "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand-primary-soft)]";
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={() => onToggle(id)}
      className={`flex flex-col gap-3 rounded-[var(--radius-md)] border p-4 text-left transition-[border-color,background,transform] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${stateTone}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span
            className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${familyTone}`}
          >
            {familyLabel}
          </span>
          <span className="text-sm font-semibold text-[var(--color-foreground)]">
            {name}
          </span>
        </div>
        <span
          aria-hidden
          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors ${
            selected
              ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-[var(--color-surface)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)]"
          }`}
        >
          {selected && <Check className="h-3 w-3" aria-hidden />}
        </span>
      </div>
      <p className="text-[12px] leading-relaxed text-[var(--color-text-muted)]">
        {description}
      </p>
      <span className="mt-auto text-sm font-semibold text-[var(--color-brand-primary)]">
        {priceLabel}
      </span>
    </button>
  );
}

interface CheckLineProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: React.ReactNode;
}

function CheckLine({ checked, onChange, label }: CheckLineProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-[var(--color-foreground)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2 border-[var(--color-border)] bg-[var(--color-surface)] transition-colors peer-checked:border-[var(--color-brand-primary)] peer-checked:bg-[var(--color-brand-primary)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-brand-primary)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--color-background)]"
      >
        {checked && (
          <Check className="h-3 w-3 text-[var(--color-surface)]" aria-hidden />
        )}
      </span>
      <span>{label}</span>
    </label>
  );
}
