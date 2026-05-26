import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Lock,
  ShieldCheck,
  Video,
} from "lucide-react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { isSupportedLocale } from "@/core/i18n/constants";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { readAccountTypeCookie } from "@/features/auth/lib/account-type-cookie";
import { getSession } from "@/server/auth";
import { getMyPersons } from "@/server/persons";
import {
  ACCOUNT_TYPE_COMMENTATOR,
  getMyAccountType,
  type AccountType,
} from "@/server/users";
import { Container } from "@/shared/design-system/components/Container";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";

type CtaState = "anonymous" | "needs_kyc" | "pending" | "approved";

/**
 * Aggregate KYC state across all of the caller's persons (ADR-018).
 * Priority for the CTA chip:
 *   - approved → at least one person is verified
 *   - pending  → at least one person is awaiting review (and none
 *                approved yet)
 *   - needs_kyc → otherwise (no persons, or all `not_submitted` /
 *                 `rejected`)
 */
async function resolveCtaState(): Promise<CtaState> {
  const session = await getSession().catch(() => null);
  if (!session) return "anonymous";
  const persons = await getMyPersons().catch(() => []);
  if (persons.some((p) => p.kyc.status === "approved")) return "approved";
  if (persons.some((p) => p.kyc.status === "pending_review")) return "pending";
  return "needs_kyc";
}

/**
 * Returns the visitor's account type for CTA visibility. Same shape
 * as `Header.resolveAccountTypeForCta` — authenticated reads the DB
 * doc (authoritative), anonymous falls back to the cookie hint.
 */
async function resolveAccountTypeForCta(): Promise<AccountType | null> {
  const session = await getSession().catch(() => null);
  if (session) {
    return getMyAccountType().catch(() => null);
  }
  return readAccountTypeCookie();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isSupportedLocale(lang) ? lang : "es";
  return buildPageMetadata({
    title: t(locale, "verificacion.metadata.title"),
    description: t(locale, "verificacion.metadata.description"),
    pathname: "/verificacion",
    locale,
  });
}

function buildSteps(locale: SupportedLocale) {
  return [
    {
      icon: FileText,
      eyebrow: t(locale, "verificacion.step.identity.eyebrow"),
      title: t(locale, "verificacion.step.identity.title"),
      body: t(locale, "verificacion.step.identity.body"),
    },
    {
      icon: Video,
      eyebrow: t(locale, "verificacion.step.selfie.eyebrow"),
      title: t(locale, "verificacion.step.selfie.title"),
      body: t(locale, "verificacion.step.selfie.body"),
    },
    {
      icon: ShieldCheck,
      eyebrow: t(locale, "verificacion.step.result.eyebrow"),
      title: t(locale, "verificacion.step.result.title"),
      body: t(locale, "verificacion.step.result.body"),
    },
  ];
}

function buildFaq(locale: SupportedLocale) {
  return [
    { q: t(locale, "verificacion.faq.q1.q"), a: t(locale, "verificacion.faq.q1.a") },
    { q: t(locale, "verificacion.faq.q2.q"), a: t(locale, "verificacion.faq.q2.a") },
    { q: t(locale, "verificacion.faq.q3.q"), a: t(locale, "verificacion.faq.q3.a") },
    { q: t(locale, "verificacion.faq.q4.q"), a: t(locale, "verificacion.faq.q4.a") },
    { q: t(locale, "verificacion.faq.q5.q"), a: t(locale, "verificacion.faq.q5.a") },
  ];
}

export default async function VerificacionPage({
  params,
}: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();
  const [ctaState, accountType] = await Promise.all([
    resolveCtaState(),
    resolveAccountTypeForCta(),
  ]);
  const showPublishCta = accountType !== ACCOUNT_TYPE_COMMENTATOR;
  const steps = buildSteps(lang);
  const faq = buildFaq(lang);

  return (
    <>
      <Header />
      <main className="flex flex-col" data-testid="verificacion-page">
        {/* HERO */}
        <section
          aria-labelledby="verificacion-title"
          className="relative isolate overflow-hidden border-b border-[var(--color-border)]/60 bg-[var(--color-background-elevated)]"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 motion-safe:motion-aurora opacity-70"
            style={{
              background:
                "radial-gradient(45% 60% at 18% 20%, rgba(200,166,118,0.14), transparent 70%), radial-gradient(55% 55% at 82% 80%, rgba(47,93,67,0.12), transparent 70%)",
            }}
          />
          <Container width="wide" className="py-20 sm:py-24 lg:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-3 rounded-full bg-[var(--color-surface)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)]">
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--color-gold)] shadow-[0_0_0_3px_rgba(200,166,118,0.18)]"
                />
                {t(lang, "verificacion.kicker")}
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--color-brand-primary)]/70"
                />
              </span>

              <h1
                id="verificacion-title"
                className="mt-5 font-[var(--font-display)] text-[clamp(32px,4.5vw,56px)] font-[370] leading-[1.04] tracking-[-0.028em] text-[var(--color-foreground)]"
              >
                {t(lang, "verificacion.title.lead")}{" "}
                <span className="italic font-[340] text-[var(--color-brand-primary)]">
                  {t(lang, "verificacion.title.highlight")}
                </span>
                .
              </h1>

              <p className="mx-auto mt-5 max-w-2xl font-[var(--font-serif)] text-[17px] leading-[1.55] text-[var(--color-text-muted)]">
                {t(lang, "verificacion.subtitle")}
              </p>

              <ModeloCta state={ctaState} locale={lang} />
            </div>
          </Container>
        </section>

        {/* STEPS */}
        <section
          aria-labelledby="verificacion-steps-title"
          className="border-b border-[var(--color-border)]/60 bg-[var(--color-background)] py-20"
        >
          <Container width="wide">
            <header className="mx-auto max-w-2xl text-center">
              <h2
                id="verificacion-steps-title"
                className="font-[var(--font-display)] text-[clamp(26px,3.4vw,40px)] font-[370] leading-[1.05] tracking-[-0.022em] text-[var(--color-foreground)]"
              >
                {t(lang, "verificacion.steps.title")}
              </h2>
            </header>

            <ol className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <li
                    key={step.title}
                    className="flex h-full flex-col gap-4 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-7"
                  >
                    <span
                      aria-hidden
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/20"
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
                      {step.eyebrow}
                    </span>
                    <h3 className="text-xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                      {step.body}
                    </p>
                  </li>
                );
              })}
            </ol>
          </Container>
        </section>

        {/* PRIVACY PROMISE */}
        <section className="border-b border-[var(--color-border)]/60 bg-[var(--color-background-elevated)] py-16">
          <Container width="wide">
            <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-8 md:grid-cols-[auto_1fr]">
              <span
                aria-hidden
                className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)] text-[var(--color-cream)] shadow-[var(--shadow-glow-primary)]"
              >
                <Lock className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <h2 className="font-[var(--font-display)] text-[clamp(22px,2.8vw,32px)] font-[370] leading-[1.1] tracking-[-0.02em] text-[var(--color-foreground)]">
                  {t(lang, "verificacion.privacy.title")}
                </h2>
                <p className="mt-3 font-[var(--font-serif)] text-[15.5px] leading-[1.55] text-[var(--color-text-muted)]">
                  {t(lang, "verificacion.privacy.body")}
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* FAQ */}
        <section
          aria-labelledby="verificacion-faq-title"
          className="bg-[var(--color-background)] py-20"
        >
          <Container width="wide">
            <header className="mx-auto max-w-2xl text-center">
              <h2
                id="verificacion-faq-title"
                className="font-[var(--font-display)] text-[clamp(26px,3.4vw,40px)] font-[370] leading-[1.05] tracking-[-0.022em] text-[var(--color-foreground)]"
              >
                {t(lang, "verificacion.faq.title")}
              </h2>
            </header>
            <dl className="mx-auto mt-10 flex max-w-3xl flex-col gap-3">
              {faq.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-[border-color,background] duration-200 ease-[var(--ease-standard)] open:border-[var(--color-brand-primary)]/40 open:bg-[var(--color-background-elevated)]"
                >
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-sm font-semibold text-[var(--color-foreground)]">
                    <span className="flex-1">{item.q}</span>
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand-primary)] opacity-50 transition-transform duration-200 group-open:rotate-90 group-open:opacity-100"
                      aria-hidden
                    />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                    {item.a}
                  </p>
                </details>
              ))}
            </dl>

            {showPublishCta ? (
              <div className="mt-12 flex flex-col items-center gap-4 text-center">
                <p className="max-w-xl text-sm text-[var(--color-text-muted)]">
                  {t(lang, "verificacion.cta.publishQuestion")}
                </p>
                <Link
                  href={localizedHref(lang, "/publicar")}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-6 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
                >
                  {t(lang, "verificacion.cta.publishLink")}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            ) : null}
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}

function ModeloCta({
  state,
  locale,
}: {
  state: CtaState;
  locale: SupportedLocale;
}) {
  if (state === "anonymous") return null;

  if (state === "approved") {
    return (
      <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900">
        <CheckCircle2 className="h-4 w-4" aria-hidden />
        {t(locale, "verificacion.modeloCta.approved")}
      </div>
    );
  }

  if (state === "pending") {
    return (
      <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900">
        <Lock className="h-4 w-4" aria-hidden />
        {t(locale, "verificacion.modeloCta.pending")}
      </div>
    );
  }

  // needs_kyc
  return (
    <Link
      href={localizedHref(locale, "/verificacion/enviar")}
      className="mx-auto mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-6 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-colors hover:bg-[var(--color-brand-primary-strong)]"
    >
      {t(locale, "verificacion.modeloCta.start")}
      <ArrowRight className="h-4 w-4" aria-hidden />
    </Link>
  );
}
