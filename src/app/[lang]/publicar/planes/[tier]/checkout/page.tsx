import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { isSupportedLocale } from "@/core/i18n/constants";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { CheckoutFlow } from "@/features/checkout/components/CheckoutFlow";
import { getSession } from "@/server/auth";
import { PLAN_PRICING, type PlanTier } from "@/server/biringas";
import { Container } from "@/shared/design-system/components/Container";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";

interface CheckoutPageProps {
  params: Promise<{ tier: string; lang: string }>;
}

export async function generateMetadata({
  params,
}: Readonly<CheckoutPageProps>): Promise<Metadata> {
  const { tier, lang } = await params;
  const locale = isSupportedLocale(lang) ? lang : "es";
  const isValid = tier === "boost" || tier === "elite";
  const planLabel = isValid
    ? t(locale, `checkout.tierLabel.${tier as PlanTier}`)
    : "";
  return buildPageMetadata({
    title: isValid
      ? t(locale, "checkout.metadata.title", { plan: planLabel })
      : t(locale, "checkout.metadata.titleInvalid"),
    description: t(locale, "checkout.metadata.description"),
    pathname: `/publicar/planes/${tier}/checkout`,
    locale,
    indexable: false,
  });
}

/**
 * `/publicar/planes/[tier]/checkout` — paywall surface for the
 * Impulso + Elite plans. Free tier (`essential`) doesn't route here.
 *
 * Auth-gated. The mock backend persists a `CheckoutSessionRecord`
 * with `provider: "mock"` so the audit trail shows checkout intent
 * before the real Stripe / MercadoPago adapter ships.
 */
export default async function CheckoutPage({
  params,
}: Readonly<CheckoutPageProps>) {
  const { tier: tierParam, lang } = await params;
  if (!isSupportedLocale(lang)) notFound();
  if (tierParam !== "boost" && tierParam !== "elite") {
    notFound();
  }
  const tier = tierParam as PlanTier;

  const session = await getSession().catch(() => null);
  if (!session) {
    const next = localizedHref(lang, `/publicar/planes/${tier}/checkout`);
    redirect(`${localizedHref(lang, "/ingresar")}?next=${encodeURIComponent(next)}`);
  }

  const planLabel = t(lang, `checkout.tierLabel.${tier}`);

  return (
    <>
      <Header hideCatalogCta />
      <main
        data-testid="checkout-page"
        className="relative isolate bg-[var(--color-background)] py-14 sm:py-20"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(circle_at_50%_0%,rgba(47,93,67,0.10),transparent_55%),radial-gradient(circle_at_82%_18%,rgba(200,166,118,0.10),transparent_55%)]"
        />
        <Container width="wide">
          <header className="mx-auto mb-10 max-w-3xl text-center">
            <span className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-brand-primary)]">
              <span
                aria-hidden
                className="inline-block h-px w-8 bg-gradient-to-r from-[var(--color-gold)] to-transparent"
              />
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--color-gold)] shadow-[0_0_0_3px_rgba(200,166,118,0.18)]"
              />
              {t(lang, "checkout.kicker")}
            </span>
            <h1 className="mt-3 font-[var(--font-display)] text-[clamp(28px,3.6vw,42px)] font-[370] leading-[1.05] tracking-[-0.025em] text-[var(--color-foreground)]">
              {t(lang, "checkout.title.lead")}{" "}
              <span className="italic font-[340] text-[var(--color-brand-primary)]">
                {planLabel}
              </span>
              .
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[var(--color-text-muted)]">
              {t(lang, "checkout.subtitle")}
            </p>
          </header>
          <CheckoutFlow tier={tier} pricing={PLAN_PRICING[tier]} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
