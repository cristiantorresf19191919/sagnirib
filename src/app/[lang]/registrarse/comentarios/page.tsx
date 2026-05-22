import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isSupportedLocale } from "@/core/i18n/constants";
import { t } from "@/core/i18n/messages";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { CommentatorSignUpForm } from "@/features/auth/components/CommentatorSignUpForm";
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
    title: t(locale, "rbac.commentator.metadata.title"),
    description: t(locale, "rbac.commentator.subtitle"),
    pathname: "/registrarse/comentarios",
    locale,
    indexable: false,
  });
}

export default async function RegistrarseComentariosPage({
  params,
}: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  return (
    <>
      <Header hideCatalogCta />
      <main className="relative isolate bg-[var(--color-background)] py-20 sm:py-28">
        <EditorialAtmosphere intensity="soft" />
        <Container width="narrow">
          <div className="mx-auto flex max-w-md flex-col items-center gap-8">
            <header className="flex flex-col items-center gap-5 text-center">
              <EditorialKicker label={t(lang, "rbac.commentator.kicker")} />
              <h1 className="font-[var(--font-display)] text-[clamp(32px,5vw,56px)] font-[340] leading-[1.04] tracking-[-0.028em] text-[var(--color-foreground)]">
                {t(lang, "rbac.commentator.title.lead")}{" "}
                <span className="italic font-[320] text-[var(--color-brand-primary)]">
                  {t(lang, "rbac.commentator.title.highlight")}
                </span>
                <span className="text-[var(--color-gold-deep)]">.</span>
              </h1>
              <span
                aria-hidden
                className="block h-px w-14 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent"
              />
              <p className="max-w-sm font-[var(--font-serif)] text-[15px] leading-[1.65] tracking-[0.01em] text-[var(--color-text-muted)]">
                {t(lang, "rbac.commentator.subtitle")}
              </p>
            </header>

            <CommentatorSignUpForm />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
