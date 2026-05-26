import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  User,
} from "lucide-react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import type { PersonRecord } from "@/server/persons";
import type { VerificationStatus } from "@/server/verification";

import { CreatePersonCard } from "./CreatePersonCard";

interface PersonsKycListProps {
  locale: SupportedLocale;
  persons: ReadonlyArray<PersonRecord>;
}

/**
 * Dashboard surface for the per-person KYC summary (ADR-018).
 *
 * Replaces the single per-account KYC card with one card per person.
 * Solves the "starting a new modelo on the same account inherits
 * verified status" bug from the user's report by reading
 * `persons[].kyc.status` instead of a single account-level status.
 *
 * Empty state — when the partner has not created any model yet — only
 * surfaces the "Crear nueva modelo" affordance. No KYC card is shown
 * because KYC is per-person: with zero persons there is nothing to
 * verify, and a top-level "Verificá tu identidad" banner read as an
 * account-level KYC, contradicting ADR-018.
 */
export function PersonsKycList({
  locale,
  persons,
}: Readonly<PersonsKycListProps>) {
  if (persons.length === 0) {
    return (
      <div className="flex flex-col gap-3 rounded-[var(--radius-2xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/60 p-5">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/25"
          >
            <User className="h-5 w-5" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <span className="font-[var(--font-display)] text-base font-[420] tracking-[-0.01em] text-[var(--color-foreground)]">
              {t(locale, "miCuenta.persons.empty.title")}
            </span>
            <span className="text-sm leading-relaxed text-[var(--color-text-muted)]">
              {t(locale, "miCuenta.persons.empty.body")}
            </span>
          </div>
        </div>
        <CreatePersonCard locale={locale} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {persons.length > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
            {t(locale, "miCuenta.persons.listKicker", {
              count: persons.length,
            })}
          </span>
        </div>
      ) : null}
      {persons.map((person) => (
        <PersonKycCard key={person.id} locale={locale} person={person} />
      ))}
      <CreatePersonCard locale={locale} />
    </div>
  );
}

interface PersonKycCardProps {
  locale: SupportedLocale;
  person: PersonRecord;
}

/**
 * Single per-person KYC summary card. Mirrors the legacy KycStatusCard
 * shape (icon tile + title + body + optional meta + CTA) but binds
 * the status to a specific `personId` so the wizard updates the right
 * KYC doc.
 *
 * For partner accounts (N persons), each person's card shows her
 * displayName above the KYC status — that's the affordance the user
 * needs to tell the cards apart.
 */
function PersonKycCard({
  locale,
  person,
}: Readonly<PersonKycCardProps>) {
  const status: VerificationStatus = person.kyc.status;
  const presentation = buildKycPresentation(locale, person.id)[status];
  const Icon = presentation.icon;
  const animateIcon = status === "pending_review";
  const MetaIcon = presentation.meta?.icon;

  return (
    <div
      className={`relative flex flex-col gap-4 overflow-hidden rounded-[var(--radius-2xl)] border p-5 text-[var(--color-foreground)] sm:flex-row sm:items-center sm:justify-between sm:gap-5 ${presentation.surface} ${presentation.glow}`}
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className={`mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${presentation.iconTile}`}
        >
          <Icon
            className={`h-5 w-5 ${animateIcon ? "animate-spin" : ""}`}
            aria-hidden
          />
        </span>
        <div className="flex flex-col gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
            <User className="h-3 w-3" aria-hidden />
            {person.displayName}
          </span>
          <span className="font-[var(--font-display)] text-base font-[420] tracking-[-0.01em] text-[var(--color-foreground)]">
            {presentation.title}
          </span>
          <span className="text-sm leading-relaxed text-[var(--color-text-muted)]">
            {presentation.body}
          </span>
          {presentation.meta && MetaIcon ? (
            <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-surface)]/70 px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)]">
              <MetaIcon className="h-3 w-3" aria-hidden />
              {presentation.meta.label}
            </span>
          ) : null}
          {status === "rejected" && person.kyc.rejectionReason ? (
            <span className="mt-1 inline-block rounded-[var(--radius-sm)] bg-[var(--color-surface)]/80 px-2 py-1 text-[11px] text-[var(--color-foreground)] ring-1 ring-[var(--color-brand-highlight)]/20">
              <strong className="font-semibold">
                {t(locale, "miCuenta.kyc.rejected.reason")}
              </strong>{" "}
              {person.kyc.rejectionReason}
            </span>
          ) : null}
        </div>
      </div>
      {presentation.cta ? (
        <Link
          href={presentation.cta.href}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[var(--color-brand-primary)] px-4 text-xs font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          {presentation.cta.label}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

interface KycPresentation {
  icon: typeof ShieldCheck;
  surface: string;
  iconTile: string;
  glow: string;
  title: string;
  body: string;
  meta?: { icon: typeof Clock; label: string };
  cta?: { label: string; href: string };
}

function buildKycPresentation(
  locale: SupportedLocale,
  personId: string,
): Record<VerificationStatus, KycPresentation> {
  // The wizard at /verificacion/enviar today still operates per-uid;
  // we forward `?personId=…` so a future wizard PR can pick it up
  // without changing the dashboard links again.
  const verifyHref = `${localizedHref(locale, "/verificacion/enviar")}?personId=${encodeURIComponent(personId)}`;

  return {
    approved: {
      icon: ShieldCheck,
      surface:
        "border-[var(--color-brand-primary)]/35 bg-[var(--color-brand-primary)]/8",
      iconTile:
        "bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/35",
      glow: "shadow-[var(--shadow-glow-primary)]",
      title: t(locale, "miCuenta.kyc.approved.title"),
      body: t(locale, "miCuenta.kyc.approved.body"),
    },
    pending_review: {
      icon: Loader2,
      surface:
        "border-[var(--color-brand-accent)]/45 bg-[var(--color-brand-accent)]/10",
      iconTile:
        "bg-[var(--color-brand-accent)]/18 text-[var(--color-brand-accent-strong)] ring-1 ring-[var(--color-brand-accent)]/45",
      glow: "shadow-[var(--shadow-glow-accent)]",
      title: t(locale, "miCuenta.kyc.pending.title"),
      body: t(locale, "miCuenta.kyc.pending.body"),
      meta: { icon: Clock, label: t(locale, "miCuenta.kyc.pending.meta") },
    },
    rejected: {
      icon: ShieldAlert,
      surface:
        "border-[var(--color-brand-highlight)]/45 bg-[var(--color-brand-highlight)]/8",
      iconTile:
        "bg-[var(--color-brand-highlight)]/15 text-[var(--color-brand-highlight)] ring-1 ring-[var(--color-brand-highlight)]/45",
      glow: "shadow-[var(--shadow-md)]",
      title: t(locale, "miCuenta.kyc.rejected.title"),
      body: t(locale, "miCuenta.kyc.rejected.body"),
      cta: { label: t(locale, "miCuenta.kyc.rejected.cta"), href: verifyHref },
    },
    not_submitted: {
      icon: ShieldQuestion,
      surface:
        "border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/6",
      iconTile:
        "bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/25",
      glow: "shadow-[var(--shadow-glow-primary)]",
      title: t(locale, "miCuenta.kyc.notSubmitted.title"),
      body: t(locale, "miCuenta.kyc.notSubmitted.body"),
      cta: {
        label: t(locale, "miCuenta.kyc.notSubmitted.cta"),
        href: verifyHref,
      },
    },
  };
}
