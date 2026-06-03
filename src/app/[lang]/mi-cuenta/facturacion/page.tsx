import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CreditCard, Gift, Receipt } from "lucide-react";

import { brandConfig } from "@/core/branding/brand-config";
import type { SupportedLocale } from "@/core/branding/brand-config";
import { isSupportedLocale } from "@/core/i18n/constants";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { getSession } from "@/server/auth";
import { ACCOUNT_TYPE_COMMENTATOR, getMyAccountType } from "@/server/users";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";

import {
  AccountSectionCard,
  AccountShell,
} from "@/features/account/components/AccountShell";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isSupportedLocale(lang) ? lang : "es";
  return buildPageMetadata({
    title: t(locale, "account.billing.metadata.title", { brand: brandConfig.name }),
    description: t(locale, "account.billing.metadata.description"),
    pathname: "/mi-cuenta/facturacion",
    locale,
    indexable: false,
  });
}

/**
 * Example "Facturación" screen reached from the account dropdown. Scaffolds
 * the eventual billing surface (plan · payment method · invoices) with a
 * visible "Vista previa" badge. During the free launch there's nothing to
 * charge, so it reads as a calm, empty-but-intentional state. Auth-gated.
 */
export default async function FacturacionPage({
  params,
}: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();
  const locale: SupportedLocale = lang;

  const session = await getSession().catch(() => null);
  if (!session) {
    const next = localizedHref(lang, "/mi-cuenta/facturacion");
    redirect(`${localizedHref(lang, "/ingresar")}?next=${encodeURIComponent(next)}`);
  }

  // ADR-019 — billing is a publisher-only surface. Commentators never pay, so
  // read the authoritative `users/{uid}.accountType` (NOT the role claim) and
  // bounce them to their own dashboard, mirroring the `/mi-cuenta` guard.
  const accountType = await getMyAccountType().catch(() => null);
  if (accountType === ACCOUNT_TYPE_COMMENTATOR) {
    redirect(localizedHref(lang, "/mi-cuenta/comentarios"));
  }

  return (
    <>
      <Header hideCatalogCta />
      <AccountShell
        locale={locale}
        title={t(locale, "account.billing.title")}
        subtitle={t(locale, "account.billing.subtitle")}
      >
        <AccountSectionCard icon={Gift} title={t(locale, "account.billing.plan.title")}>
          <div className="flex flex-wrap items-start justify-between gap-3 py-1">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-sm font-semibold text-[var(--color-foreground)]">
                {t(locale, "account.billing.plan.name")}
              </span>
              <span className="max-w-md text-xs leading-relaxed text-[var(--color-text-muted)]">
                {t(locale, "account.billing.plan.desc")}
              </span>
            </div>
            <span className="inline-flex shrink-0 items-center rounded-full bg-[var(--color-brand-primary)]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/25">
              {t(locale, "account.billing.plan.badge")}
            </span>
          </div>
        </AccountSectionCard>

        <AccountSectionCard
          icon={CreditCard}
          title={t(locale, "account.billing.method.title")}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 py-1">
            <span className="text-sm text-[var(--color-text-muted)]">
              {t(locale, "account.billing.method.empty")}
            </span>
            <span className="inline-flex shrink-0 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-foreground)] opacity-70">
              {t(locale, "account.billing.method.action")}
            </span>
          </div>
        </AccountSectionCard>

        <AccountSectionCard
          icon={Receipt}
          title={t(locale, "account.billing.history.title")}
        >
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <span
              aria-hidden
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-subtle)]"
            >
              <Receipt className="h-5 w-5" aria-hidden />
            </span>
            <span className="max-w-sm text-xs leading-relaxed text-[var(--color-text-muted)]">
              {t(locale, "account.billing.history.empty")}
            </span>
          </div>
        </AccountSectionCard>
      </AccountShell>
      <Footer />
    </>
  );
}
