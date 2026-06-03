import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { isSupportedLocale } from "@/core/i18n/constants";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { EnrollmentWizard } from "@/features/enrollment/components/EnrollmentWizard";
import type { EnrollmentCatalogs } from "@/features/enrollment/lib/catalogs";
import { getSession } from "@/server/auth";
import { ACCOUNT_TYPE_COMMENTATOR, getMyAccountType } from "@/server/users";
import {
  APPEARANCE_CATALOG,
  ATTENTION_CATALOG,
  COLOMBIA_LOCATIONS,
  CONTACT_CATALOG,
  LANGUAGE_CATALOG,
  MEETING_CONTEXT_CATALOG,
  SERVICE_CATALOG,
  SUPPORTED_CITIES,
} from "@/server/biringas";
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
    title: t(locale, "publicar.metadata.title"),
    description: t(locale, "publicar.metadata.description"),
    pathname: "/publicar",
    locale,
    // Page is funnel-only — never indexable, even when global indexing flips on.
    indexable: false,
  });
}

export default async function PublicarPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ personId?: string | string[] }>;
}>) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  // Auth gate. The wizard submits via a Server Action that already calls
  // `requireAuth()` — this redirect just gives an anonymous user a friendly
  // entry point instead of letting them fill the entire form and get
  // rejected at submit time.
  const session = await getSession().catch(() => null);
  if (!session) {
    const next = localizedHref(lang, "/publicar");
    redirect(`${localizedHref(lang, "/ingresar")}?next=${encodeURIComponent(next)}`);
  }

  // ADR-019 — commentator-locked accounts cannot publish. Send them to
  // their dashboard instead of letting them fill the wizard and hit the
  // `requirePublisher` throw at submit time. The DB doc is the
  // authority; we read it here so a stale cookie can't slip a
  // commentator past the gate.
  const accountType = await getMyAccountType().catch(() => null);
  if (accountType === ACCOUNT_TYPE_COMMENTATOR) {
    redirect(localizedHref(lang, "/mi-cuenta/comentarios"));
  }

  // ADR-018 — KYC is a per-person concern, not a publish-time gate.
  // Drafts can be created for a freshly minted person whose KYC is
  // still `not_submitted`; the gate is enforced on the admin side
  // before a draft is promoted to a live listing. The dashboard's
  // per-person card surfaces the "Verificar identidad" CTA so the
  // publisher knows what's outstanding.
  //
  // `?personId=…` is the per-card "publicar este perfil" CTA from
  // `ProfileList`. Forwarded to the wizard so the server action
  // attaches the draft to that specific person instead of minting a
  // fresh one.
  const personIdParam = await searchParams
    .then((sp) => sp.personId)
    .catch(() => undefined);
  const targetPersonId =
    typeof personIdParam === "string" ? personIdParam : undefined;

  const catalogs: EnrollmentCatalogs = {
    cities: SUPPORTED_CITIES,
    locations: COLOMBIA_LOCATIONS,
    services: SERVICE_CATALOG,
    meetingContexts: MEETING_CONTEXT_CATALOG,
    attention: ATTENTION_CATALOG,
    contact: CONTACT_CATALOG,
    appearance: APPEARANCE_CATALOG,
    languages: LANGUAGE_CATALOG,
  };

  return (
    <>
      <Header />
      <main className="bg-[var(--color-background)] pb-20 pt-8 sm:pt-10">
        <Container width="wide" className="flex flex-col gap-8">
          <header className="flex flex-col gap-2">
            <Link
              href={localizedHref(lang, "/explorar")}
              className="inline-flex w-fit items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-primary)] transition-colors hover:text-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              {t(lang, "publicar.back")}
            </Link>
            <h1 className="text-3xl font-bold leading-[1.05] tracking-tight text-[var(--color-foreground)] sm:text-4xl">
              {t(lang, "publicar.title")}
            </h1>
            {/* Trust badge integrated inline into the sentence that explains
                the onboarding, so it reads as part of the promise rather than
                a floating, step-card-like pill. */}
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
              {t(lang, "publicar.subtitle.pre")}
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--color-brand-primary)]/30 bg-[var(--color-surface)] px-2 py-0.5 align-baseline text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-primary)]">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-primary)]"
                />
                {t(lang, "publicar.badge.verification")}
              </span>
              {t(lang, "publicar.subtitle.post")}
            </p>
          </header>

          <EnrollmentWizard catalogs={catalogs} personId={targetPersonId} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
