import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Crown,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { isSupportedLocale } from "@/core/i18n/constants";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import type { SupportedLocale } from "@/core/branding/brand-config";
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
    title: t(locale, "planes.metadata.title"),
    description: t(locale, "planes.metadata.description"),
    pathname: "/publicar/planes",
    locale,
  });
}

interface Plan {
  slug: "essential" | "boost" | "elite";
  badge?: string;
  name: string;
  tagline: string;
  priceLabel: string;
  priceSubtitle: string;
  features: ReadonlyArray<{ label: string; included: boolean }>;
  cta: { label: string; href: string };
  highlight?: boolean;
}

function buildPlans(locale: SupportedLocale): ReadonlyArray<Plan> {
  return [
    {
      slug: "essential",
      name: t(locale, "planes.essential.name"),
      tagline: t(locale, "planes.essential.tagline"),
      priceLabel: t(locale, "planes.essential.priceLabel"),
      priceSubtitle: t(locale, "planes.essential.priceSubtitle"),
      features: [
        { label: t(locale, "planes.essential.feature.verified"), included: true },
        { label: t(locale, "planes.essential.feature.photos"), included: true },
        { label: t(locale, "planes.essential.feature.messaging"), included: true },
        { label: t(locale, "planes.essential.feature.reviews"), included: true },
        { label: t(locale, "planes.essential.feature.catalog"), included: true },
        { label: t(locale, "planes.essential.feature.heroSlot"), included: false },
        { label: t(locale, "planes.essential.feature.topBadge"), included: false },
        { label: t(locale, "planes.essential.feature.support"), included: false },
      ],
      cta: {
        label: t(locale, "planes.essential.cta"),
        href: localizedHref(locale, "/publicar"),
      },
    },
    {
      slug: "boost",
      badge: t(locale, "planes.boost.badge"),
      name: t(locale, "planes.boost.name"),
      tagline: t(locale, "planes.boost.tagline"),
      priceLabel: t(locale, "planes.boost.priceLabel"),
      priceSubtitle: t(locale, "planes.boost.priceSubtitle"),
      features: [
        { label: t(locale, "planes.boost.feature.allEssential"), included: true },
        { label: t(locale, "planes.boost.feature.photos"), included: true },
        { label: t(locale, "planes.boost.feature.ranking"), included: true },
        { label: t(locale, "planes.boost.feature.topFilter"), included: true },
        { label: t(locale, "planes.boost.feature.topBadge"), included: true },
        { label: t(locale, "planes.boost.feature.stories"), included: true },
        { label: t(locale, "planes.boost.feature.heroSlot"), included: false },
        { label: t(locale, "planes.boost.feature.support"), included: false },
      ],
      cta: {
        label: t(locale, "planes.boost.cta"),
        href: localizedHref(locale, "/publicar/planes/boost/checkout"),
      },
      highlight: true,
    },
    {
      slug: "elite",
      badge: t(locale, "planes.elite.badge"),
      name: t(locale, "planes.elite.name"),
      tagline: t(locale, "planes.elite.tagline"),
      priceLabel: t(locale, "planes.elite.priceLabel"),
      priceSubtitle: t(locale, "planes.elite.priceSubtitle"),
      features: [
        { label: t(locale, "planes.elite.feature.allBoost"), included: true },
        { label: t(locale, "planes.elite.feature.photos"), included: true },
        { label: t(locale, "planes.elite.feature.heroSlot"), included: true },
        { label: t(locale, "planes.elite.feature.testimonials"), included: true },
        { label: t(locale, "planes.elite.feature.analytics"), included: true },
        { label: t(locale, "planes.elite.feature.support"), included: true },
        { label: t(locale, "planes.elite.feature.photoshoot"), included: true },
        { label: t(locale, "planes.elite.feature.advisor"), included: true },
      ],
      cta: {
        label: t(locale, "planes.elite.cta"),
        href: localizedHref(locale, "/publicar/planes/elite/checkout"),
      },
    },
  ];
}

function buildFaq(locale: SupportedLocale) {
  return [
    { q: t(locale, "planes.faq.q1.q"), a: t(locale, "planes.faq.q1.a") },
    { q: t(locale, "planes.faq.q2.q"), a: t(locale, "planes.faq.q2.a") },
    { q: t(locale, "planes.faq.q3.q"), a: t(locale, "planes.faq.q3.a") },
    { q: t(locale, "planes.faq.q4.q"), a: t(locale, "planes.faq.q4.a") },
  ];
}

export default async function PlanesPage({
  params,
}: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  const plans = buildPlans(lang);
  const faq = buildFaq(lang);

  return (
    <>
      <Header />
      <main className="flex flex-col" data-testid="planes-page">
        <section
          aria-labelledby="planes-title"
          className="relative isolate border-b border-[var(--color-border)]/60 bg-[var(--color-background-elevated)]"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 motion-safe:motion-aurora opacity-60"
            style={{
              background:
                "radial-gradient(40% 50% at 18% 25%, rgba(200,166,118,0.16), transparent 70%), radial-gradient(45% 45% at 82% 75%, rgba(47,93,67,0.12), transparent 70%)",
            }}
          />
          <Container width="wide" className="py-20 sm:py-24 lg:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-3 rounded-full bg-[var(--color-surface)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)]">
                <Sparkles className="h-3 w-3 text-[var(--color-gold)]" aria-hidden />
                {t(lang, "planes.kicker")}
              </span>
              <h1
                id="planes-title"
                className="mt-5 font-[var(--font-display)] text-[clamp(34px,4.8vw,60px)] font-[370] leading-[1.02] tracking-[-0.028em] text-[var(--color-foreground)]"
              >
                {t(lang, "planes.title.lead")}{" "}
                <span className="italic font-[340] text-[var(--color-brand-primary)]">
                  {t(lang, "planes.title.highlight")}
                </span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl font-[var(--font-serif)] text-[17px] leading-[1.55] text-[var(--color-text-muted)]">
                {t(lang, "planes.subtitle")}
              </p>
            </div>
          </Container>
        </section>

        <section className="bg-[var(--color-background)] py-16 sm:py-20">
          <Container width="wide">
            <ul className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-7">
              {plans.map((plan) => (
                <PlanCard key={plan.slug} plan={plan} />
              ))}
            </ul>

            <p className="mt-10 text-center text-xs text-[var(--color-text-subtle)]">
              {t(lang, "planes.footnote")}
            </p>
          </Container>
        </section>

        <section className="border-t border-[var(--color-border)]/60 bg-[var(--color-background-elevated)] py-16">
          <Container width="wide">
            <h2 className="mx-auto max-w-2xl text-center font-[var(--font-display)] text-[clamp(24px,3vw,36px)] font-[370] leading-[1.05] tracking-[-0.022em] text-[var(--color-foreground)]">
              {t(lang, "planes.faq.title")}
            </h2>
            <dl className="mx-auto mt-10 flex max-w-3xl flex-col gap-3">
              {faq.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-[border-color,background] duration-200 ease-[var(--ease-standard)] open:border-[var(--color-brand-primary)]/40 open:bg-[var(--color-background)]"
                >
                  <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--color-foreground)]">
                    {item.q}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                    {item.a}
                  </p>
                </details>
              ))}
            </dl>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}

interface PlanCardProps {
  plan: Plan;
}

function PlanCard({ plan }: Readonly<PlanCardProps>) {
  const Icon = plan.slug === "elite" ? Crown : plan.slug === "boost" ? TrendingUp : Sparkles;
  const surfaceCls = plan.highlight
    ? "border-[var(--color-brand-primary)]/45 bg-gradient-to-br from-[var(--color-cream-soft)] via-[var(--color-cream)] to-[#E6DBC1] shadow-[var(--shadow-lg)] lg:-translate-y-2"
    : "border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]";
  return (
    <li
      data-testid={`plan-card-${plan.slug}`}
      className={`relative flex h-full flex-col rounded-[var(--radius-2xl)] border p-7 transition-[transform,box-shadow] duration-300 ease-[var(--ease-standard)] hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] sm:p-8 ${surfaceCls}`}
    >
      {plan.badge && (
        <span
          className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
            plan.highlight
              ? "bg-[var(--color-brand-primary)] text-[var(--color-cream)] shadow-[var(--shadow-glow-primary)]"
              : "bg-[var(--color-gold)] text-[var(--color-ink)]"
          }`}
        >
          {plan.badge}
        </span>
      )}

      <span
        aria-hidden
        className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
          plan.highlight
            ? "bg-[var(--color-brand-primary)] text-[var(--color-cream)]"
            : "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]"
        }`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>

      <h3 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
        {plan.name}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-muted)]">
        {plan.tagline}
      </p>

      <div className="mt-5">
        <span className="text-3xl font-bold tracking-tight text-[var(--color-foreground)]">
          {plan.priceLabel}
        </span>
        <span className="ml-1 text-xs text-[var(--color-text-muted)]">
          {plan.priceSubtitle}
        </span>
      </div>

      <ul className="mt-6 flex flex-1 flex-col gap-2.5">
        {plan.features.map((f) => (
          <li key={f.label} className="flex items-start gap-2 text-sm">
            <Check
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                f.included
                  ? "text-[var(--color-brand-primary)]"
                  : "text-[var(--color-text-subtle)]/40"
              }`}
              aria-hidden
            />
            <span
              className={
                f.included
                  ? "text-[var(--color-foreground)]"
                  : "text-[var(--color-text-subtle)] line-through"
              }
            >
              {f.label}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={plan.cta.href}
        data-testid={`plan-card-${plan.slug}-cta`}
        className={`mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-[background,transform,box-shadow] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${
          plan.highlight
            ? "bg-[var(--color-brand-primary)] text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] hover:bg-[var(--color-brand-primary-strong)] focus-visible:ring-[var(--color-brand-primary)]"
            : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)] focus-visible:ring-[var(--color-brand-primary)]"
        }`}
      >
        {plan.cta.label}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </li>
  );
}
