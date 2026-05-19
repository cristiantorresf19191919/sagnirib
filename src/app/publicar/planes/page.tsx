import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Crown,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { Container } from "@/shared/design-system/components/Container";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";

export const metadata: Metadata = buildPageMetadata({
  title: "Planes para acompañantes — Biringas",
  description:
    "Tres planes para acompañantes verificadas en Biringas: Esencial (gratis), Impulso y Elite. Más visibilidad, mejor conversión, sin algoritmos turbios.",
  path: "/publicar/planes",
});

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

const PLANS: ReadonlyArray<Plan> = [
  {
    slug: "essential",
    name: "Esencial",
    tagline: "Empieza con el perfil verificado, sin coste.",
    priceLabel: "Gratis",
    priceSubtitle: "Para siempre",
    features: [
      { label: "Perfil verificado (2 capas)", included: true },
      { label: "Hasta 6 fotos", included: true },
      { label: "Mensajería + WhatsApp/Telegram", included: true },
      { label: "Reseñas reales de clientes", included: true },
      { label: "Aparecer en /explorar", included: true },
      { label: "Aparición en hero editorial", included: false },
      { label: "Insignia 'Top calificada'", included: false },
      { label: "Soporte prioritario", included: false },
    ],
    cta: { label: "Publicar gratis", href: "/publicar" },
  },
  {
    slug: "boost",
    badge: "Recomendado",
    name: "Impulso",
    tagline: "Aparece arriba en las búsquedas y triplica visitas.",
    priceLabel: "$89.000",
    priceSubtitle: "/mes · cancela cuando quieras",
    features: [
      { label: "Todo lo de Esencial", included: true },
      { label: "Hasta 15 fotos", included: true },
      { label: "Posicionamiento alto en búsquedas", included: true },
      { label: "Filtro 'Top rated' por defecto", included: true },
      { label: "Insignia 'Top calificada'", included: true },
      { label: "Stories ilimitadas", included: true },
      { label: "Aparición en hero editorial", included: false },
      { label: "Soporte prioritario", included: false },
    ],
    cta: { label: "Activar Impulso", href: "/publicar?plan=boost" },
    highlight: true,
  },
  {
    slug: "elite",
    badge: "Por invitación",
    name: "Elite",
    tagline: "Slot fijo en hero editorial + soporte dedicado.",
    priceLabel: "$249.000",
    priceSubtitle: "/mes · cupos limitados",
    features: [
      { label: "Todo lo de Impulso", included: true },
      { label: "Fotos ilimitadas + video reel", included: true },
      { label: "Slot rotatorio en hero editorial", included: true },
      { label: "Aparición en testimonios curados", included: true },
      { label: "Analytics avanzadas (vistas / conversión)", included: true },
      { label: "Soporte prioritario WhatsApp", included: true },
      { label: "Sesión de fotos profesional (1× / año)", included: true },
      { label: "Cuenta gestionada por un asesor", included: true },
    ],
    cta: { label: "Solicitar invitación", href: "/publicar?plan=elite" },
  },
];

const FAQ = [
  {
    q: "¿Puedo cambiar de plan en cualquier momento?",
    a: "Sí. El cambio se aplica al siguiente ciclo y los días no usados se acreditan automáticamente.",
  },
  {
    q: "¿Cobran comisión por reserva?",
    a: "No. Pagas un plan mensual y te quedas con el 100% de lo que cobras a tus clientes.",
  },
  {
    q: "¿Qué pasa si no me sirve?",
    a: "Cancelas con un clic y tu perfil se mantiene en Esencial. Sin penalizaciones, sin permanencia.",
  },
  {
    q: "¿Aceptan transferencia / Nequi / Daviplata?",
    a: "Sí, además de tarjeta. La facturación es 100% discreta — el concepto sale como 'Servicios digitales'.",
  },
];

export default function PlanesPage() {
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
                Planes para acompañantes
              </span>
              <h1
                id="planes-title"
                className="mt-5 font-[var(--font-display)] text-[clamp(34px,4.8vw,60px)] font-[370] leading-[1.02] tracking-[-0.028em] text-[var(--color-foreground)]"
              >
                Sin algoritmos turbios.{" "}
                <span className="italic font-[340] text-[var(--color-brand-primary)]">
                  Sin comisión por reserva.
                </span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl font-[var(--font-serif)] text-[17px] leading-[1.55] text-[var(--color-text-muted)]">
                Eliges el plan, pagas lo justo, te quedas con todo lo que
                cobras. Tres niveles según cuánto quieras crecer.
              </p>
            </div>
          </Container>
        </section>

        <section className="bg-[var(--color-background)] py-16 sm:py-20">
          <Container width="wide">
            <ul className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-7">
              {PLANS.map((plan) => (
                <PlanCard key={plan.slug} plan={plan} />
              ))}
            </ul>

            <p className="mt-10 text-center text-xs text-[var(--color-text-subtle)]">
              Precios en pesos colombianos. Impuestos incluidos. Sin
              contratos de permanencia.
            </p>
          </Container>
        </section>

        <section className="border-t border-[var(--color-border)]/60 bg-[var(--color-background-elevated)] py-16">
          <Container width="wide">
            <h2 className="mx-auto max-w-2xl text-center font-[var(--font-display)] text-[clamp(24px,3vw,36px)] font-[370] leading-[1.05] tracking-[-0.022em] text-[var(--color-foreground)]">
              Preguntas frecuentes.
            </h2>
            <dl className="mx-auto mt-10 flex max-w-3xl flex-col gap-3">
              {FAQ.map((item) => (
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
