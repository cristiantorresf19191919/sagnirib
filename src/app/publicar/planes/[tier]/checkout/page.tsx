import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { CheckoutFlow } from "@/features/checkout/components/CheckoutFlow";
import { getSession } from "@/server/auth";
import { PLAN_LABELS, PLAN_PRICING, type PlanTier } from "@/server/biringas";
import { Container } from "@/shared/design-system/components/Container";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";

interface CheckoutPageProps {
  params: Promise<{ tier: string }>;
}

export async function generateMetadata({
  params,
}: Readonly<CheckoutPageProps>): Promise<Metadata> {
  const { tier } = await params;
  const isValid = tier === "boost" || tier === "elite";
  return buildPageMetadata({
    title: isValid
      ? `Activar plan ${PLAN_LABELS[tier as PlanTier]} — Biringas`
      : "Plan no encontrado — Biringas",
    description:
      "Confirma el ciclo y completa el pago para activar el plan en tu perfil.",
    path: `/publicar/planes/${tier}/checkout`,
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
  const { tier: tierParam } = await params;
  if (tierParam !== "boost" && tierParam !== "elite") {
    notFound();
  }
  const tier = tierParam as PlanTier;

  const session = await getSession().catch(() => null);
  if (!session) {
    redirect(
      `/ingresar?next=${encodeURIComponent(`/publicar/planes/${tier}/checkout`)}`,
    );
  }

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
              Checkout
            </span>
            <h1 className="mt-3 font-[var(--font-display)] text-[clamp(28px,3.6vw,42px)] font-[370] leading-[1.05] tracking-[-0.025em] text-[var(--color-foreground)]">
              Activar plan{" "}
              <span className="italic font-[340] text-[var(--color-brand-primary)]">
                {PLAN_LABELS[tier]}
              </span>
              .
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[var(--color-text-muted)]">
              Sin contratos. Cobramos al confirmar y te avisamos antes de cada
              renovación.
            </p>
          </header>
          <CheckoutFlow tier={tier} pricing={PLAN_PRICING[tier]} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
