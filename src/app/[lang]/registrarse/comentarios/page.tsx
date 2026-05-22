import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isSupportedLocale } from "@/core/i18n/constants";
import { t } from "@/core/i18n/messages";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { CommentatorSignUpForm } from "@/features/auth/components/CommentatorSignUpForm";
import { Container } from "@/shared/design-system/components/Container";
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

/**
 * Flow B — comments-only registration. Per the PDF this surface has a
 * deliberately limited form (country + email + nickname + password) and
 * routes the user to the limited dashboard at `/mi-cuenta/comentarios`.
 */
export default async function RegistrarseComentariosPage({
  params,
}: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  return (
    <>
      <Header hideCatalogCta />
      <main className="relative isolate bg-[var(--color-background)] py-16 sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_50%_0%,rgba(47,93,67,0.10),transparent_60%),radial-gradient(circle_at_85%_18%,rgba(200,166,118,0.10),transparent_55%)]"
        />
        <Container width="narrow">
          <div className="mx-auto flex max-w-md flex-col items-center gap-6">
            <header className="flex flex-col items-center gap-3 text-center">
              <span className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-brand-primary)]">
                <span
                  aria-hidden
                  className="inline-block h-px w-8 bg-gradient-to-r from-[var(--color-gold)] to-transparent"
                />
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--color-gold)] shadow-[0_0_0_3px_rgba(200,166,118,0.18)]"
                />
                {t(lang, "rbac.commentator.kicker")}
              </span>
              <h1 className="font-[var(--font-display)] text-[clamp(28px,4vw,42px)] font-[370] leading-[1.05] tracking-[-0.025em] text-[var(--color-foreground)]">
                {t(lang, "rbac.commentator.title.lead")}{" "}
                <span className="italic font-[340] text-[var(--color-brand-primary)]">
                  {t(lang, "rbac.commentator.title.highlight")}
                </span>
                .
              </h1>
              <p className="max-w-sm font-[var(--font-serif)] text-[15px] leading-[1.55] text-[var(--color-text-muted)]">
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
