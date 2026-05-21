import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isSupportedLocale } from "@/core/i18n/constants";
import { t } from "@/core/i18n/messages";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { Container } from "@/shared/design-system/components/Container";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";
import { SignUpForm } from "@/features/auth/components/SignUpForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isSupportedLocale(lang) ? lang : "es";
  return buildPageMetadata({
    title: t(locale, "auth.signup.metadata.title"),
    description: t(locale, "auth.signup.subtitle"),
    pathname: "/registrarse",
    locale,
    indexable: false,
  });
}

interface RegistrarsePageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ next?: string | string[] }>;
}

/**
 * Sign-up route. Funnel-only — never indexable.
 *
 * Forwards the optional `?next=` query param to `<SignUpForm>` so a
 * user who reached signup from a gated flow (e.g. /publicar) lands
 * back on that flow after creating the account. Validation that `next`
 * is a relative path happens inside the form.
 */
export default async function RegistrarsePage({
  params,
  searchParams,
}: Readonly<RegistrarsePageProps>) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();
  const searchParamsResolved = await searchParams;
  const raw = Array.isArray(searchParamsResolved.next)
    ? searchParamsResolved.next[0]
    : searchParamsResolved.next;
  const next = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : undefined;

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
                {t(lang, "auth.signup.kicker")}
              </span>
              <h1 className="font-[var(--font-display)] text-[clamp(28px,4vw,42px)] font-[370] leading-[1.05] tracking-[-0.025em] text-[var(--color-foreground)]">
                {t(lang, "auth.signup.title.lead")}{" "}
                <span className="italic font-[340] text-[var(--color-brand-primary)]">
                  {t(lang, "auth.signup.title.highlight")}
                </span>
                .
              </h1>
              <p className="max-w-sm font-[var(--font-serif)] text-[15px] leading-[1.55] text-[var(--color-text-muted)]">
                {t(lang, "auth.signup.subtitle")}
              </p>
            </header>

            <SignUpForm next={next} />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
