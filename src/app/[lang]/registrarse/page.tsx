import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isSupportedLocale } from "@/core/i18n/constants";
import { t } from "@/core/i18n/messages";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { AccountTypeChooser } from "@/features/auth/components/AccountTypeChooser";
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
    title: t(locale, "rbac.chooser.metadata.title"),
    description: t(locale, "rbac.chooser.subtitle"),
    pathname: "/registrarse",
    locale,
    indexable: false,
  });
}

export default async function RegistrarsePage({
  params,
}: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  return (
    <>
      <Header hideCatalogCta />
      <main className="relative isolate bg-[var(--color-background)] py-20 sm:py-28">
        <EditorialAtmosphere intensity="rich" />
        <Container width="wide">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-10">
            <header className="flex flex-col items-center gap-5 text-center">
              <EditorialKicker label={t(lang, "rbac.chooser.kicker")} />
              <h1 className="font-[var(--font-display)] text-[clamp(36px,6vw,68px)] font-[340] leading-[1.02] tracking-[-0.03em] text-[var(--color-foreground)]">
                {t(lang, "rbac.chooser.title.lead")}{" "}
                <span className="italic font-[320] text-[var(--color-brand-primary)]">
                  {t(lang, "rbac.chooser.title.highlight")}
                </span>
                <span className="text-[var(--color-gold-deep)]">.</span>
              </h1>
              <span
                aria-hidden
                className="block h-px w-16 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent"
              />
              <p className="max-w-md font-[var(--font-serif)] text-[15px] leading-[1.65] tracking-[0.01em] text-[var(--color-text-muted)]">
                {t(lang, "rbac.chooser.subtitle")}
              </p>
            </header>

            <AccountTypeChooser />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
