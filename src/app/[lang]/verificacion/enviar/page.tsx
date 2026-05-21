import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { isSupportedLocale } from "@/core/i18n/constants";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { VerificationWizard } from "@/features/verification/components/VerificationWizard";
import { getSession } from "@/server/auth";
import { getMyVerification } from "@/server/verification";
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
    title: t(locale, "verificacion.enviar.metadata.title"),
    description: t(locale, "verificacion.enviar.metadata.description"),
    pathname: "/verificacion/enviar",
    locale,
    indexable: false,
  });
}

/**
 * 3-step wizard for KYC verification basic level (ADR-014).
 */
export default async function VerificacionEnviarPage({
  params,
}: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();
  const session = await getSession().catch(() => null);
  if (!session) {
    const next = localizedHref(lang, "/verificacion/enviar");
    redirect(`${localizedHref(lang, "/ingresar")}?next=${encodeURIComponent(next)}`);
  }
  const current = await getMyVerification();

  return (
    <>
      <Header />
      <main className="bg-[var(--color-background)] pb-20 pt-8 sm:pt-10">
        <Container width="wide" className="flex flex-col gap-8">
          <header className="flex flex-col gap-3">
            <h1 className="text-3xl font-bold leading-[1.05] tracking-tight text-[var(--color-foreground)] sm:text-4xl">
              {t(lang, "verificacion.enviar.title")}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
              {t(lang, "verificacion.enviar.subtitle")}
            </p>
          </header>

          <VerificationWizard
            initialStatus={current?.status ?? "not_submitted"}
            initialRecord={current ?? null}
          />
        </Container>
      </main>
      <Footer />
    </>
  );
}
