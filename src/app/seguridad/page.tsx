import type { Metadata } from "next";
import Link from "next/link";
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

import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { Container } from "@/shared/design-system/components/Container";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";

export const metadata: Metadata = buildPageMetadata({
  title: "Tu seguridad primero — Biringas",
  description:
    "Guía práctica para que cada encuentro en Biringas sea seguro: antes, durante y después. Reglas claras, sin moralina.",
  path: "/seguridad",
});

/**
 * `/seguridad` — public safety guidelines page. Peer of `/verificacion`.
 *
 * Reasoning: the brand repeats "tu seguridad es primero" on every
 * surface but never explained HOW. This page makes the promise
 * concrete — a 9-rule checklist split across three phases (antes /
 * durante / después), an emergency contact block, and a closing
 * reminder that the platform never asks for money up-front.
 *
 * Tone is calm and practical (no moralizing). Designed to read in 90
 * seconds on first visit; useful as a re-reference before a meeting.
 */

interface Rule {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
}

const ANTES: ReadonlyArray<Rule> = [
  {
    icon: ShieldCheck,
    title: "Confirmá la insignia verde",
    body: "Solo los perfiles con el escudo dorado pasaron por verificación humana de 2 capas. Si no la tiene, anda con cautela.",
  },
  {
    icon: MessageSquare,
    title: "Pactá todo por chat",
    body: "Tarifa, lugar, duración, tipo de plan. Si algo no coincide al llegar, tenés el chat como evidencia.",
  },
  {
    icon: PhoneCall,
    title: "Hacé una llamada corta",
    body: "Una llamada de 30 segundos confirma identidad y disipa dudas. Si rechaza la llamada o suena bot, cancelá.",
  },
];

const DURANTE: ReadonlyArray<Rule> = [
  {
    icon: MapPin,
    title: "Compartí tu ubicación",
    body: "Mandale tu ubicación en vivo a alguien de confianza antes de entrar. Apple Maps y Google Maps tienen \"compartir en tiempo real\" gratis.",
  },
  {
    icon: Wallet,
    title: "Cero dinero por adelantado",
    body: "Ninguna acompañante seria pide transferencia antes del encuentro. Si te lo piden, es estafa — bloqueá y reportá.",
  },
  {
    icon: Eye,
    title: "Lugares con cámara o gente",
    body: "Hoteles, departamentos turísticos verificados, restaurantes. Evitá direcciones que cambien a último momento.",
  },
];

const DESPUES: ReadonlyArray<Rule> = [
  {
    icon: Lock,
    title: "Borrá lo que no necesitás",
    body: "Mensajes, fotos, capturas. Tu privacidad después del encuentro es tan importante como antes.",
  },
  {
    icon: MessageSquare,
    title: "Dejá tu reseña",
    body: "Aunque haya sido perfecto, tu reseña ayuda a otros y refuerza la confianza del perfil. Pocas palabras alcanzan.",
  },
  {
    icon: AlertTriangle,
    title: "Reportá lo que no estuvo bien",
    body: "Fotos que no coinciden, presión, comportamiento agresivo — el botón de reporte está en cada perfil. Revisamos en menos de 24 horas.",
  },
];

const RED_FLAGS: ReadonlyArray<string> = [
  "Pide pago en cripto, gift cards o transferencias internacionales",
  "Cambia el lugar del encuentro a último momento sin razón",
  "No quiere videollamada ni llamada de voz antes de verse",
  "Las fotos son demasiado pulidas (revisa imagen reversa)",
  "Insiste en bebidas o sustancias que vos no pediste",
];

export default function SeguridadPage() {
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
                Tu seguridad primero
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--color-brand-primary)]/70"
                />
              </span>
              <h1
                id="seguridad-title"
                className="mt-5 font-[var(--font-display)] text-[clamp(32px,4.5vw,56px)] font-[370] leading-[1.04] tracking-[-0.028em] text-[var(--color-foreground)]"
              >
                Nueve reglas que vuelven cada encuentro{" "}
                <span className="italic font-[340] text-[var(--color-brand-primary)]">
                  un buen recuerdo
                </span>
                .
              </h1>
              <p className="mx-auto mt-5 max-w-2xl font-[var(--font-serif)] text-[17px] leading-[1.55] text-[var(--color-text-muted)]">
                Antes, durante y después. Pegalas en un favorito y reléelas
                antes de cada reserva — los rituales evitan las sorpresas.
              </p>
            </div>
          </Container>
        </section>

        {/* THREE PHASES */}
        <section className="bg-[var(--color-background)] py-20">
          <Container width="wide">
            <PhaseBlock
              kicker="Antes"
              title="Pactar es la mitad del trabajo."
              rules={ANTES}
            />
            <PhaseBlock
              kicker="Durante"
              title="Vos siempre tenés el botón rojo."
              rules={DURANTE}
            />
            <PhaseBlock
              kicker="Después"
              title="La confianza se construye en cada encuentro."
              rules={DESPUES}
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
                  Señales de alarma — cancelá sin culpa.
                </h2>
              </div>
              <ul className="grid grid-cols-1 gap-2 rounded-[var(--radius-2xl)] border border-[var(--color-brand-highlight)]/25 bg-[var(--color-surface)] p-6">
                {RED_FLAGS.map((flag) => (
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
                  Si algo sale mal, no estás sola.
                </h2>
                <p className="mt-3 font-[var(--font-serif)] text-[15.5px] leading-[1.55] text-[var(--color-text-muted)]">
                  Línea Púrpura Colombia · <strong>018000 112 137</strong> — gratis,
                  24 horas, asistencia anónima en casos de violencia o
                  presión. Para emergencias inmediatas marcá{" "}
                  <strong>123</strong>. Reportes dentro de la plataforma se
                  revisan en menos de 24 horas hábiles.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link
                    href="/verificacion"
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)]"
                  >
                    Cómo verificamos los perfiles
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                  <Link
                    href="/explorar"
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-4 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)]"
                  >
                    Explorar el catálogo verificado
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
