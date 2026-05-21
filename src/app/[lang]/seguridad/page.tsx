import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Eye,
  Lock,
  MapPin,
  MessageSquare,
  PhoneCall,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { isSupportedLocale } from "@/core/i18n/constants";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";
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
    title: t(locale, "seguridad.metadata.title"),
    description: t(locale, "seguridad.metadata.description"),
    pathname: "/seguridad",
    locale,
  });
}

interface Rule {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
}

function buildPhases(locale: SupportedLocale) {
  const before: ReadonlyArray<Rule> = [
    {
      icon: ShieldCheck,
      title: t(locale, "seguridad.rule.badge.title"),
      body: t(locale, "seguridad.rule.badge.body"),
    },
    {
      icon: MessageSquare,
      title: t(locale, "seguridad.rule.chat.title"),
      body: t(locale, "seguridad.rule.chat.body"),
    },
    {
      icon: PhoneCall,
      title: t(locale, "seguridad.rule.call.title"),
      body: t(locale, "seguridad.rule.call.body"),
    },
  ];

  const during: ReadonlyArray<Rule> = [
    {
      icon: MapPin,
      title: t(locale, "seguridad.rule.location.title"),
      body: t(locale, "seguridad.rule.location.body"),
    },
    {
      icon: Wallet,
      title: t(locale, "seguridad.rule.noMoney.title"),
      body: t(locale, "seguridad.rule.noMoney.body"),
    },
    {
      icon: Eye,
      title: t(locale, "seguridad.rule.places.title"),
      body: t(locale, "seguridad.rule.places.body"),
    },
  ];

  const after: ReadonlyArray<Rule> = [
    {
      icon: Lock,
      title: t(locale, "seguridad.rule.delete.title"),
      body: t(locale, "seguridad.rule.delete.body"),
    },
    {
      icon: MessageSquare,
      title: t(locale, "seguridad.rule.review.title"),
      body: t(locale, "seguridad.rule.review.body"),
    },
    {
      icon: AlertTriangle,
      title: t(locale, "seguridad.rule.report.title"),
      body: t(locale, "seguridad.rule.report.body"),
    },
  ];

  const redFlags: ReadonlyArray<string> = [
    t(locale, "seguridad.redFlags.crypto"),
    t(locale, "seguridad.redFlags.changePlace"),
    t(locale, "seguridad.redFlags.noCall"),
    t(locale, "seguridad.redFlags.tooPolished"),
    t(locale, "seguridad.redFlags.substances"),
  ];

  return { before, during, after, redFlags };
}

export default async function SeguridadPage({
  params,
}: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();
  const { before, during, after, redFlags } = buildPhases(lang);

  return (
    <>
      <Header />
      <main className="flex flex-col" data-testid="seguridad-page">
        {/* HERO */}
        <section
          aria-labelledby="seguridad-title"
          className="relative isolate overflow-hidden border-b border-[var(--color-border)]/60 bg-[var(--color-background-elevated)]"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 motion-safe:motion-aurora opacity-70"
            style={{
              background:
                "radial-gradient(45% 60% at 18% 20%, rgba(200,166,118,0.14), transparent 70%), radial-gradient(55% 55% at 82% 80%, rgba(196,81,75,0.10), transparent 70%)",
            }}
          />
          <Container width="wide" className="py-20 sm:py-24 lg:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-3 rounded-full bg-[var(--color-surface)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)]">
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--color-gold)] shadow-[0_0_0_3px_rgba(200,166,118,0.18)]"
                />
                {t(lang, "seguridad.kicker")}
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--color-brand-primary)]/70"
                />
              </span>
              <h1
                id="seguridad-title"
                className="mt-5 font-[var(--font-display)] text-[clamp(32px,4.5vw,56px)] font-[370] leading-[1.04] tracking-[-0.028em] text-[var(--color-foreground)]"
              >
                {t(lang, "seguridad.title.lead")}{" "}
                <span className="italic font-[340] text-[var(--color-brand-primary)]">
                  {t(lang, "seguridad.title.highlight")}
                </span>
                .
              </h1>
              <p className="mx-auto mt-5 max-w-2xl font-[var(--font-serif)] text-[17px] leading-[1.55] text-[var(--color-text-muted)]">
                {t(lang, "seguridad.subtitle")}
              </p>
            </div>
          </Container>
        </section>

        {/* THREE PHASES */}
        <section className="bg-[var(--color-background)] py-20">
          <Container width="wide">
            <PhaseBlock
              kicker={t(lang, "seguridad.phase.before.kicker")}
              title={t(lang, "seguridad.phase.before.title")}
              rules={before}
            />
            <PhaseBlock
              kicker={t(lang, "seguridad.phase.during.kicker")}
              title={t(lang, "seguridad.phase.during.title")}
              rules={during}
            />
            <PhaseBlock
              kicker={t(lang, "seguridad.phase.after.kicker")}
              title={t(lang, "seguridad.phase.after.title")}
              rules={after}
            />
          </Container>
        </section>

        {/* RED FLAGS */}
        <section className="border-y border-[var(--color-border)]/60 bg-[var(--color-background-elevated)] py-16">
          <Container width="wide">
            <div className="mx-auto max-w-3xl">
              <div className="mb-6 flex items-center gap-3">
                <span
                  aria-hidden
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-brand-highlight)]/12 text-[var(--color-brand-highlight)] ring-1 ring-[var(--color-brand-highlight)]/30"
                >
                  <AlertTriangle className="h-5 w-5" aria-hidden />
                </span>
                <h2 className="font-[var(--font-display)] text-[clamp(22px,2.8vw,32px)] font-[370] leading-[1.1] tracking-[-0.02em] text-[var(--color-foreground)]">
                  {t(lang, "seguridad.redFlags.title")}
                </h2>
              </div>
              <ul className="grid grid-cols-1 gap-2 rounded-[var(--radius-2xl)] border border-[var(--color-brand-highlight)]/25 bg-[var(--color-surface)] p-6">
                {redFlags.map((flag) => (
                  <li
                    key={flag}
                    className="flex items-start gap-3 border-b border-[var(--color-border)]/50 py-2 last:border-b-0"
                  >
                    <span
                      aria-hidden
                      className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rotate-45 bg-[var(--color-brand-highlight)]"
                    />
                    <span className="text-sm leading-relaxed text-[var(--color-foreground)]">
                      {flag}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>

        {/* EMERGENCY + CTA */}
        <section className="bg-[var(--color-background)] py-20">
          <Container width="wide">
            <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-8 md:grid-cols-[auto_1fr]">
              <span
                aria-hidden
                className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)] text-[var(--color-cream)] shadow-[var(--shadow-glow-primary)]"
              >
                <PhoneCall className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <h2 className="font-[var(--font-display)] text-[clamp(22px,2.8vw,32px)] font-[370] leading-[1.1] tracking-[-0.02em] text-[var(--color-foreground)]">
                  {t(lang, "seguridad.emergency.title")}
                </h2>
                <p className="mt-3 font-[var(--font-serif)] text-[15.5px] leading-[1.55] text-[var(--color-text-muted)]">
                  {t(lang, "seguridad.emergency.body.lead")}{" "}
                  <strong>{t(lang, "seguridad.emergency.body.purpleLine")}</strong>{" "}
                  {t(lang, "seguridad.emergency.body.mid")}{" "}
                  <strong>{t(lang, "seguridad.emergency.body.emergencyLine")}</strong>
                  {t(lang, "seguridad.emergency.body.trailing")}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link
                    href={localizedHref(lang, "/verificacion")}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)]"
                  >
                    {t(lang, "seguridad.emergency.cta.verification")}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                  <Link
                    href={localizedHref(lang, "/explorar")}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-4 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)]"
                  >
                    {t(lang, "seguridad.emergency.cta.explore")}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}

interface PhaseBlockProps {
  kicker: string;
  title: string;
  rules: ReadonlyArray<Rule>;
}

function PhaseBlock({ kicker, title, rules }: Readonly<PhaseBlockProps>) {
  return (
    <article className="mb-16 last:mb-0">
      <header className="mx-auto mb-8 max-w-3xl">
        <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
          <span
            aria-hidden
            className="inline-block h-px w-6 bg-gradient-to-r from-[var(--color-gold)] to-transparent"
          />
          {kicker}
        </span>
        <h2 className="mt-2 font-[var(--font-display)] text-[clamp(24px,3.2vw,36px)] font-[370] leading-[1.1] tracking-[-0.022em] text-[var(--color-foreground)]">
          {title}
        </h2>
      </header>
      <ul className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
        {rules.map((rule) => {
          const Icon = rule.icon;
          return (
            <li
              key={rule.title}
              className="flex h-full flex-col gap-3 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
            >
              <span
                aria-hidden
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/20"
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <h3 className="text-base font-semibold tracking-tight text-[var(--color-foreground)]">
                {rule.title}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                {rule.body}
              </p>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
