import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isSupportedLocale } from "@/core/i18n/constants";
import { t } from "@/core/i18n/messages";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { Container } from "@/shared/design-system/components/Container";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

/**
 * Password recovery route. Funnel-only — never indexable.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isSupportedLocale(lang) ? lang : "es";
  return buildPageMetadata({
    title: t(locale, "auth.reset.metadata.title"),
    description: t(locale, "auth.reset.subtitle"),
    pathname: "/recuperar",
    locale,
    indexable: false,
  });
}

export default async function RecuperarPage({
  params,
}: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();
  return (
    <>
      <Header hideCatalogCta />
      <main className="relative isolate bg-[var(--color-background)] py-20 sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_50%_0%,rgba(47,93,67,0.08),transparent_60%)]"
        />
        <Container width="narrow">
          <div className="mx-auto flex max-w-sm flex-col gap-7">
            <header className="flex flex-col gap-3">
              <span className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-brand-primary)]">
                <span
                  aria-hidden
                  className="inline-block h-px w-8 bg-gradient-to-r from-[var(--color-gold)] to-transparent"
                />
                {t(lang, "auth.reset.kicker")}
              </span>
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-[var(--color-foreground)] sm:text-4xl">
                {t(lang, "auth.reset.title")}
              </h1>
              <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                {t(lang, "auth.reset.subtitle")}
              </p>
            </header>

            <ResetPasswordForm />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
