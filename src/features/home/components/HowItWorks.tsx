import type { LucideIcon } from "lucide-react";
import { ArrowRight, Compass, ShieldCheck, Sparkles } from "lucide-react";

import { Container } from "@/shared/design-system/components/Container";
import { Reveal, RevealItem } from "@/shared/motion/Reveal";

interface Step {
  numeral: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
}

const STEPS: ReadonlyArray<Step> = [
  {
    numeral: "01",
    icon: Compass,
    eyebrow: "Catálogo",
    title: "Hojea el catálogo",
    description:
      "Filtra por ciudad, categoría o disponibilidad y revisa perfiles con fotos, idiomas y reseñas.",
  },
  {
    numeral: "02",
    icon: ShieldCheck,
    eyebrow: "Confianza",
    title: "Verifica antes de elegir",
    description:
      "Cada acompañante destacada pasa por un check de identidad y consentimiento de imagen documentado.",
  },
  {
    numeral: "03",
    icon: Sparkles,
    eyebrow: "Reserva",
    title: "Contrata sin fricción",
    description:
      "Reserva directo desde el perfil. Pagos y mensajería conectan en la próxima versión — hoy es entrada al MVP.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="how-title"
      className="relative isolate scroll-mt-24 overflow-hidden border-y border-[var(--color-border)]/40 bg-[var(--color-background-elevated)] py-20 sm:py-24 lg:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_8%,rgba(255,43,181,0.10),transparent_45%),radial-gradient(circle_at_85%_25%,rgba(31,168,255,0.08),transparent_50%)]"
      />

      <Container width="wide">
        <header className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-muted)] backdrop-blur-sm">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-primary)] shadow-[var(--shadow-glow-primary)]"
            />
            Cómo funciona
          </span>
          <h2
            id="how-title"
            className="mt-5 text-3xl font-semibold leading-[1.05] tracking-tight text-[var(--color-foreground)] sm:text-4xl lg:text-5xl"
          >
            Tres pasos para encontrar la{" "}
            <span className="bg-gradient-to-br from-[var(--color-brand-primary-strong)] via-[var(--color-brand-primary)] to-[var(--color-brand-secondary-strong)] bg-clip-text text-transparent">
              compañía adecuada
            </span>
            .
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)]">
            Reservar es simple. Antes vamos por la confianza — verificación, consentimiento, transparencia.
          </p>
        </header>

        <Reveal as="ol" className="relative mt-14 grid gap-6 md:grid-cols-3 lg:mt-20 lg:gap-8">
          {/* Connector line — only on desktop, sits behind the cards */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[8%] top-[88px] hidden h-px bg-[linear-gradient(to_right,transparent_0%,var(--color-brand-primary)/35_15%,var(--color-brand-secondary)/35_50%,var(--color-brand-accent)/35_85%,transparent_100%)] md:block"
          />

          {STEPS.map((step, index) => (
            <RevealItem key={step.numeral} as="li">
              <StepCard step={step} isLast={index === STEPS.length - 1} />
            </RevealItem>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}

interface StepCardProps {
  step: Step;
  isLast: boolean;
}

function StepCard({ step, isLast }: StepCardProps) {
  const Icon = step.icon;
  return (
    <article className="group relative flex h-full flex-col gap-6 overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-7 transition-[border-color,transform,box-shadow] duration-300 ease-[var(--ease-standard)] hover:-translate-y-1 hover:border-[var(--color-brand-primary)]/55 hover:shadow-[0_24px_60px_-22px_rgba(255,43,181,0.5)] sm:p-8">
      {/* Ambient halo behind numeral */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-[radial-gradient(closest-side,rgba(255,43,181,0.22),transparent_70%)] opacity-60 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
      />

      {/* Numeral + icon row */}
      <div className="relative flex items-start justify-between gap-4">
        <span
          aria-hidden
          className="bg-gradient-to-br from-[var(--color-brand-primary-strong)] via-[var(--color-brand-primary)] to-[var(--color-brand-secondary-strong)] bg-clip-text text-[5.5rem] font-bold leading-none tracking-tight text-transparent"
        >
          {step.numeral}
        </span>
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-brand-primary)]/30 bg-[var(--color-background-elevated)]/80 text-[var(--color-brand-primary-strong)] shadow-[inset_0_0_0_1px_rgba(255,43,181,0.18)] transition-[box-shadow,color] duration-300 group-hover:text-[var(--color-brand-primary)] group-hover:shadow-[inset_0_0_0_1px_rgba(255,43,181,0.45),0_8px_24px_-8px_rgba(255,43,181,0.55)]">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>

      {/* Content */}
      <div className="relative flex flex-col gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
          {step.eyebrow}
        </span>
        <h3 className="text-2xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
          {step.title}
        </h3>
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          {step.description}
        </p>
      </div>

      {/* Hover-revealed continuation chevron */}
      {!isLast && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 translate-x-2 items-center justify-center text-[var(--color-brand-primary-strong)] opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0 group-hover:opacity-100 md:inline-flex"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
        </span>
      )}
    </article>
  );
}
