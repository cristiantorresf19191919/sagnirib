import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { localizedHref } from "@/core/i18n/href";
import { isSupportedLocale } from "@/core/i18n/constants";
import { t } from "@/core/i18n/messages";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { AccountTypeLockedScreen } from "@/features/auth/components/AccountTypeLockedScreen";
import { PublisherSignUpWizard } from "@/features/auth/components/PublisherSignUpWizard";
import { getSession } from "@/server/auth";
import {
  ACCOUNT_TYPE_COMMENTATOR,
  ACCOUNT_TYPE_PUBLISHER,
  getMyAccountType,
} from "@/server/users";
import { Container } from "@/shared/design-system/components/Container";
import {
  EditorialAtmosphere,
  EditorialKicker,
} from "@/shared/design-system/components/EditorialAtmosphere";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isSupportedLocale(lang) ? lang : "es";
  return buildPageMetadata({
    title: t(locale, "rbac.publisher.metadata.title"),
    description: t(locale, "rbac.publisher.subtitle"),
    pathname: "/registrarse/publicador",
    locale,
    indexable: false,
  });
}

export default async function RegistrarsePublicadorPage({
  params,
}: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  // ADR-019 gate. The chooser at /registrarse already refuses to route
  // here when the doc is locked to the opposite type, but this page is
  // reachable by direct URL too — without this branch an authenticated
  // commentator could fill the whole wizard and silently bounce back to
  // /mi-cuenta with no state change (the wizard's submit short-circuits
  // `signUpWithEmail` for already-authenticated callers).
  const session = await getSession().catch(() => null);
  if (session) {
    const accountType = await getMyAccountType().catch(() => null);
    if (accountType === ACCOUNT_TYPE_PUBLISHER) {
      redirect(localizedHref(lang, "/mi-cuenta"));
    }
    if (accountType === ACCOUNT_TYPE_COMMENTATOR) {
      return (
        <>
          <Header hideCatalogCta />
          <main className="relative isolate bg-[var(--color-background)] py-20 sm:py-28">
            <EditorialAtmosphere intensity="soft" />
            <Container width="narrow">
              <AccountTypeLockedScreen
                locale={lang}
                currentAccountType={ACCOUNT_TYPE_COMMENTATOR}
              />
            </Container>
          </main>
          <Footer />
        </>
      );
    }
    // accountType === null → authenticated but undecided (post-OAuth
    // before the chooser). The dashboard's AccountTypeFallbackModal
    // owns that resolution, so route there.
    redirect(localizedHref(lang, "/mi-cuenta"));
  }

  return (
    <>
      <Header hideCatalogCta />
      <main className="relative isolate bg-[var(--color-background)] py-20 sm:py-28">
        <EditorialAtmosphere />
        <Container width="narrow">
          <div className="mx-auto flex max-w-2xl flex-col gap-8">
            <header className="flex flex-col items-center gap-5 text-center">
              <EditorialKicker label={t(lang, "rbac.publisher.kicker")} />
              <h1 className="font-[var(--font-display)] text-[clamp(32px,5vw,56px)] font-[340] leading-[1.04] tracking-[-0.028em] text-[var(--color-foreground)]">
                {t(lang, "rbac.publisher.title.lead")}{" "}
                <span className="italic font-[320] text-[var(--color-brand-primary)]">
                  {t(lang, "rbac.publisher.title.highlight")}
                </span>
                <span className="text-[var(--color-gold-deep)]">.</span>
              </h1>
              <span
                aria-hidden
                className="block h-px w-14 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent"
              />
              <p className="max-w-md font-[var(--font-serif)] text-[15px] leading-[1.65] tracking-[0.01em] text-[var(--color-text-muted)]">
                {t(lang, "rbac.publisher.subtitle")}
              </p>
            </header>

            <PublisherSignUpWizard />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
