import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  Bell,
  Eye,
  Globe,
  Mail,
  ShieldCheck,
  Sparkles,
  UserCircle,
} from "lucide-react";

import { brandConfig } from "@/core/branding/brand-config";
import type { SupportedLocale } from "@/core/branding/brand-config";
import { isSupportedLocale } from "@/core/i18n/constants";
import { localizedHref } from "@/core/i18n/href";
import { LOCALE_LABELS } from "@/core/i18n/messages";
import { t } from "@/core/i18n/messages";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { getSession } from "@/server/auth";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";

import {
  AccountSectionCard,
  AccountShell,
  ExampleToggle,
  SettingRow,
} from "@/features/account/components/AccountShell";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isSupportedLocale(lang) ? lang : "es";
  return buildPageMetadata({
    title: t(locale, "account.config.metadata.title", { brand: brandConfig.name }),
    description: t(locale, "account.config.metadata.description"),
    pathname: "/mi-cuenta/configuracion",
    locale,
    indexable: false,
  });
}

/**
 * Example "Configuración" screen reached from the account dropdown. Scaffolds
 * the eventual settings surface (account · notifications · security) with a
 * visible "Vista previa" badge — controls are illustrative only. Auth-gated
 * like the rest of the account area.
 */
export default async function ConfiguracionPage({
  params,
}: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();
  const locale: SupportedLocale = lang;

  const session = await getSession().catch(() => null);
  if (!session) {
    const next = localizedHref(lang, "/mi-cuenta/configuracion");
    redirect(`${localizedHref(lang, "/ingresar")}?next=${encodeURIComponent(next)}`);
  }

  return (
    <>
      <Header hideCatalogCta />
      <AccountShell
        locale={locale}
        title={t(locale, "account.config.title")}
        subtitle={t(locale, "account.config.subtitle")}
      >
        <AccountSectionCard icon={UserCircle} title={t(locale, "account.config.account.title")}>
          <SettingRow
            icon={Mail}
            label={t(locale, "account.config.account.email")}
            value={session.email ?? "—"}
          />
          <SettingRow
            icon={Globe}
            label={t(locale, "account.config.account.language")}
            value={LOCALE_LABELS[locale]}
          />
          <SettingRow
            icon={Sparkles}
            label={t(locale, "account.config.account.type")}
            value={t(locale, "account.config.account.type.value")}
          />
        </AccountSectionCard>

        <AccountSectionCard icon={Bell} title={t(locale, "account.config.notifications.title")}>
          <SettingRow
            label={t(locale, "account.config.notifications.reviews")}
            hint={t(locale, "account.config.notifications.reviews.hint")}
            control={<ExampleToggle on />}
          />
          <SettingRow
            label={t(locale, "account.config.notifications.tips")}
            hint={t(locale, "account.config.notifications.tips.hint")}
            control={<ExampleToggle />}
          />
        </AccountSectionCard>

        <AccountSectionCard icon={ShieldCheck} title={t(locale, "account.config.security.title")}>
          <SettingRow
            label={t(locale, "account.config.security.password")}
            value="••••••••"
            action={t(locale, "account.config.security.password.action")}
          />
          <SettingRow
            icon={Eye}
            label={t(locale, "account.config.security.sessions")}
            action={t(locale, "account.config.security.sessions.action")}
          />
        </AccountSectionCard>
      </AccountShell>
      <Footer />
    </>
  );
}
