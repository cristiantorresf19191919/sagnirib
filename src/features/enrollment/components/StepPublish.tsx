"use client";

import { Fragment, type CSSProperties } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  Coffee,
  Gift,
  Lock,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { localizedHref } from "@/core/i18n/href";
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
  forceShowErrors: boolean;
  submitError: string | null;
}

export function StepPublish({ values, onChange, forceShowErrors, submitError }: StepPublishProps) {
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
      {/* During the free launch we don't tease prices at all — the step
          becomes a marketing showcase of what makes Biringas different and
          what's coming. The full pricing UI (packages + add-ons) below is
          preserved verbatim for when PLANS_ENABLED flips on. */}
      {PLANS_ENABLED ? (
        <>
          <BillingToggle
            locale={locale}
            billing={values.billing}
            onChange={(v) => update("billing", v)}
          />

          <div className="grid items-start gap-4 lg:grid-cols-3">
            {PACKAGES.map((pkg, index) => (
              <PackageCard
                key={pkg.id}
                index={index}
                locale={locale}
                packageId={pkg.id}
                selected={values.packageId === pkg.id}
                billing={values.billing}
                onSelect={selectPackage}
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
                {t(locale, "step.publish.addons.hint.enabled")}
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
                  selected={values.addOnIds.includes(addOn.id)}
                  onToggle={toggleAddOn}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <FreeLaunchBanner locale={locale} />
          <UpcomingDifferentials locale={locale} />
        </>
      )}

      <fieldset className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background-elevated)] p-4">
        <legend className="px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
          {t(locale, "step.publish.terms.legend")}
        </legend>
        <div className="flex flex-col gap-1">
          <CheckLine
            checked={values.acceptsAdult}
            onChange={(v) => update("acceptsAdult", v)}
            label={t(locale, "step.publish.terms.adult")}
          />
          {forceShowErrors && !values.acceptsAdult && (
            <p role="alert" className="pl-8 text-[11px] text-[var(--color-brand-highlight)]">
              {t(locale, "publicar.validation.adultConsent")}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <CheckLine
            checked={values.acceptsTerms}
            onChange={(v) => update("acceptsTerms", v)}
            label={<TermsConsentLabel locale={locale} />}
          />
          {forceShowErrors && !values.acceptsTerms && (
            <p role="alert" className="pl-8 text-[11px] text-[var(--color-brand-highlight)]">
              {t(locale, "publicar.validation.acceptTerms")}
            </p>
          )}
        </div>
      </fieldset>

      {/* Data-treatment disclaimer (LSSI) — collapsible, alongside the legal
          consent so it's available before submitting without crowding it. */}
      <details className="group/disc rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background-elevated)]/50 px-4 py-3">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[13px] font-semibold text-[var(--color-foreground)] [&::-webkit-details-marker]:hidden">
          {t(locale, "step.publish.dataTreatment.title")}
          <ChevronDown
            className="h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform duration-200 group-open/disc:rotate-180"
            aria-hidden
          />
        </summary>
        <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-[12.5px] leading-relaxed text-[var(--color-text-muted)] marker:text-[var(--color-brand-primary)]">
          <li>{t(locale, "step.publish.dataTreatment.b1")}</li>
          <li>{t(locale, "step.publish.dataTreatment.b2")}</li>
          <li>{t(locale, "step.publish.dataTreatment.b3")}</li>
          <li>{t(locale, "step.publish.dataTreatment.b4")}</li>
          <li>{t(locale, "step.publish.dataTreatment.b5")}</li>
          <li>{t(locale, "step.publish.dataTreatment.b6")}</li>
        </ul>
      </details>

      {submitError && (
        <div
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-brand-highlight)]/40 bg-[var(--color-brand-highlight)]/8 px-4 py-3 text-sm text-[var(--color-brand-highlight)]"
        >
          {submitError}
        </div>
      )}
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

/** One "what's coming" differentiator — icon + live/soon tag + copy. */
interface Differentiator {
  /** i18n key suffix under `step.publish.upcoming.<key>.{title,body}`. */
  key: "verify" | "content" | "dates" | "pay" | "reviews" | "boost";
  icon: LucideIcon;
  /** Already live during the launch vs a roadmap teaser. */
  live?: boolean;
}

const DIFFERENTIATORS: ReadonlyArray<Differentiator> = [
  { key: "verify", icon: ShieldCheck, live: true },
  { key: "content", icon: Lock },
  { key: "dates", icon: Coffee },
  { key: "pay", icon: Wallet },
  { key: "reviews", icon: Star },
  { key: "boost", icon: TrendingUp },
];

/**
 * Free-launch marketing showcase — replaces the priced plan cards while
 * `PLANS_ENABLED` is off. Sells what makes Biringas different (safe human
 * verification, exclusive content, virtual dates…) without quoting a single
 * price, framing the roadmap as "Próximamente" so nothing over-commits.
 */
function UpcomingDifferentials({ locale }: { locale: SupportedLocale }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
          <Sparkles className="h-4 w-4 text-[var(--color-brand-primary)]" aria-hidden />
          {t(locale, "step.publish.upcoming.title")}
        </span>
        <p className="text-[13px] leading-relaxed text-[var(--color-text-muted)]">
          {t(locale, "step.publish.upcoming.subtitle")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DIFFERENTIATORS.map((diff, index) => {
          const Icon = diff.icon;
          return (
            <article
              key={diff.key}
              style={{ "--step-i": index } as CSSProperties}
              className="motion-step-rise group/diff relative flex flex-col gap-3 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] transition-[transform,box-shadow,border-color] duration-200 ease-[var(--ease-standard)] hover:-translate-y-1 hover:border-[var(--color-brand-primary-soft)] hover:shadow-[var(--shadow-md)]"
            >
              {/* Soft brand wash in the corner — warms on hover. */}
              <span
                aria-hidden
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[var(--color-brand-primary)]/8 blur-2xl transition-opacity duration-300 ease-[var(--ease-standard)] group-hover/diff:opacity-80"
              />

              <div className="relative flex items-center justify-between">
                <span
                  aria-hidden
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/20"
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ring-1 ${
                    diff.live
                      ? "bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary)] ring-[var(--color-brand-primary)]/25"
                      : "bg-[var(--color-brand-accent)]/15 text-[var(--color-brand-accent-strong)] ring-[var(--color-brand-accent)]/30"
                  }`}
                >
                  {diff.live ? (
                    <>
                      <span aria-hidden className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 motion-safe:animate-ping" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
                      </span>
                      {t(locale, "step.publish.upcoming.tag.live")}
                    </>
                  ) : (
                    t(locale, "step.publish.pkg.comingSoon")
                  )}
                </span>
              </div>

              <div className="relative flex flex-col gap-1.5">
                <h3 className="text-[15px] font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
                  {t(locale, `step.publish.upcoming.${diff.key}.title`)}
                </h3>
                <p className="text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                  {t(locale, `step.publish.upcoming.${diff.key}.body`)}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
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
  index: number;
  locale: SupportedLocale;
  packageId: PackageId;
  selected: boolean;
  billing: BillingCycle;
  onSelect: (id: PackageId) => void;
  disabled?: boolean;
}

function PackageCard({
  index,
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

  // Hero card = the chosen plan, or the recommended one while plans are
  // still informational (coming-soon) — so "Destacada" stays the standout
  // even though nothing is selectable yet. No dull opacity: the cards read
  // as premium previews, not greyed-out placeholders.
  const highlighted = selected || (disabled && pkg.recommended);
  const tone = highlighted
    ? "border-[var(--color-brand-primary)]/45 bg-[var(--color-surface)] shadow-[var(--shadow-md)] lg:-translate-y-1"
    : "border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]";

  return (
    <button
      type="button"
      onClick={() => onSelect(packageId)}
      aria-pressed={selected}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      style={{ "--step-i": index } as CSSProperties}
      className={`motion-step-rise group/pkg relative flex h-full flex-col gap-4 overflow-hidden rounded-[var(--radius-xl)] border p-5 text-left transition-[border-color,box-shadow,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${disabled ? "cursor-not-allowed" : ""} ${tone}`}
    >
      {/* Gold → forest hairline marks the hero card. */}
      {highlighted && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[var(--color-brand-primary)] via-[var(--color-gold)] to-transparent"
        />
      )}
      {disabled ? (
        <span className="absolute right-5 top-4 inline-flex items-center gap-1 rounded-full bg-[var(--color-foreground)]/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-surface)] shadow-[var(--shadow-sm)]">
          {t(locale, "step.publish.pkg.comingSoon")}
        </span>
      ) : (
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
      )}
      {pkg.recommended && (
        <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-primary)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-surface)] shadow-[var(--shadow-sm)]">
          <Sparkles className="h-3 w-3" aria-hidden />
          {t(locale, "step.publish.pkg.recommended")}
        </span>
      )}

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

/**
 * Consent label with the two legal phrases rendered as real links to the
 * (existing) `/legal/terminos` + `/legal/privacidad` pages. The sentence lives
 * in i18n as a template with `{terms}` / `{privacy}` placeholders so each
 * locale can position the links naturally. Links open in a new tab and stop
 * propagation so tapping them reads the policy instead of toggling the box.
 */
function TermsConsentLabel({ locale }: { locale: SupportedLocale }) {
  const template = t(locale, "step.publish.terms.terms");
  const linkCls =
    "font-semibold text-[var(--color-brand-primary)] underline decoration-[var(--color-brand-primary)]/40 underline-offset-2 transition-colors hover:text-[var(--color-brand-primary-strong)] hover:decoration-[var(--color-brand-primary)]";
  const links: Record<string, { href: string; label: string }> = {
    "{terms}": {
      href: localizedHref(locale, "/legal/terminos"),
      label: t(locale, "step.publish.terms.termsLink"),
    },
    "{privacy}": {
      href: localizedHref(locale, "/legal/privacidad"),
      label: t(locale, "step.publish.terms.privacyLink"),
    },
  };
  return (
    <>
      {template.split(/(\{terms\}|\{privacy\})/).map((part, i) => {
        const link = links[part];
        if (link) {
          return (
            <Link
              // biome-ignore lint/suspicious/noArrayIndexKey: template parts are positionally stable.
              key={i}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={linkCls}
              onClick={(e) => e.stopPropagation()}
            >
              {link.label}
            </Link>
          );
        }
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: template parts are positionally stable.
          <Fragment key={i}>{part}</Fragment>
        );
      })}
    </>
  );
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
