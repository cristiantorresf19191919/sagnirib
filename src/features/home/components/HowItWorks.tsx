"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowRight, Compass, ShieldCheck, Sparkles } from "lucide-react";
import {
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from "framer-motion";

import { Container } from "@/shared/design-system/components/Container";
import { Sparkle } from "@/shared/design-system/components/Sparkle";

import { HowItWorksConnector } from "./HowItWorksConnector";

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

/**
 * Soft diffused drop shadow used on hover. Two layers — a tight one for the
 * edge definition + a wider one for the cushion — produces the "lifted" feel
 * without harshness.
 */
const HOVER_SHADOW =
  "0 18px 40px -16px rgba(20, 28, 24, 0.18), 0 8px 22px -12px rgba(20, 28, 24, 0.10)";
const REST_SHADOW =
  "0 1px 2px 0 rgba(20, 28, 24, 0.04), 0 1px 1px 0 rgba(20, 28, 24, 0.03)";

const LIST_VARIANTS: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.05,
    },
  },
};

/**
 * Card variants combine the entrance keyframes (hidden → rest) AND the
 * hover target (rest → hover). Framer Motion propagates the active key
 * down to children that declare matching variants — which is how the
 * icon scale stays coordinated with the card lift without extra wiring.
 */
const CARD_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 20, boxShadow: REST_SHADOW },
  rest: { opacity: 1, y: 0, boxShadow: REST_SHADOW },
  hover: { opacity: 1, y: -8, boxShadow: HOVER_SHADOW },
};

const ICON_VARIANTS: Variants = {
  hidden: { scale: 1 },
  rest: { scale: 1 },
  hover: { scale: 1.1 },
};

const ENTRANCE_TRANSITION: Transition = {
  duration: 0.5,
  ease: [0.22, 1, 0.36, 1],
};

const HOVER_SPRING: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 22,
  mass: 0.6,
};

export function HowItWorks() {
  const reduced = useReducedMotion();
  return (
    <section
      data-testid="how-it-works"
      id="como-funciona"
      aria-labelledby="how-title"
      className="relative isolate scroll-mt-24 overflow-hidden border-y border-[var(--color-border)]/60 bg-[var(--color-background-elevated)] py-20 sm:py-24 lg:py-28"
    >
      <Sparkle
        tone="primary"
        size={36}
        className="absolute left-[8%] top-12 hidden motion-safe:motion-sparkle-float md:block"
      />
      <Sparkle
        tone="primary"
        size={28}
        className="absolute right-[10%] top-24 hidden motion-safe:motion-sparkle-float md:block"
        style={{ animationDelay: "1.6s", animationDuration: "7s" }}
      />

      <Container width="wide">
        <header className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)]">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-primary)]"
            />
            Cómo funciona
          </span>
          <h2
            id="how-title"
            className="mt-5 text-3xl font-bold leading-[1.05] tracking-tight text-[var(--color-foreground)] sm:text-4xl lg:text-5xl"
          >
            Tres pasos para encontrar la{" "}
            <span className="text-[var(--color-brand-primary)]">
              compañía adecuada
            </span>
            .
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)]">
            Reservar es simple. Antes vamos por la confianza — verificación,
            consentimiento, transparencia.
          </p>
        </header>

        <div className="relative mt-14 lg:mt-20">
          <HowItWorksConnector />
          <motion.ol
            className="relative grid gap-6 md:grid-cols-3 lg:gap-8"
            variants={reduced ? undefined : LIST_VARIANTS}
            initial={reduced ? false : "hidden"}
            whileInView={reduced ? undefined : "visible"}
            viewport={{ once: true, amount: 0.2, margin: "-40px 0px" }}
          >
            {STEPS.map((step, index) => (
              <StepCard
                key={step.numeral}
                step={step}
                isLast={index === STEPS.length - 1}
                reduced={!!reduced}
              />
            ))}
          </motion.ol>
        </div>
      </Container>
    </section>
  );
}

interface StepCardProps {
  step: Step;
  isLast: boolean;
  reduced: boolean;
}

function StepCard({ step, isLast, reduced }: Readonly<StepCardProps>) {
  const Icon = step.icon;
  return (
    <motion.li
      data-testid={`how-it-works-step-${step.numeral}`}
      // Three-state variant chain: hidden (initial) -> rest (in-view) ->
      // hover (whileHover). The transition prop is the hover spring;
      // entrance uses its own (ENTRANCE_TRANSITION) declared on the rest
      // variant.
      variants={
        reduced
          ? undefined
          : {
              ...CARD_VARIANTS,
              rest: { ...CARD_VARIANTS.rest, transition: ENTRANCE_TRANSITION },
            }
      }
      whileHover={reduced ? undefined : "hover"}
      whileFocus={reduced ? undefined : "hover"}
      transition={HOVER_SPRING}
      className="group relative flex h-full cursor-default flex-col gap-6 overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background-elevated)] sm:p-8"
      tabIndex={0}
    >
      <div className="relative flex items-start justify-between gap-4">
        <span
          aria-hidden
          className="text-[5.5rem] font-bold leading-none tracking-tight text-[var(--color-brand-primary)]/15"
        >
          {step.numeral}
        </span>
        <motion.span
          aria-hidden
          variants={reduced ? undefined : ICON_VARIANTS}
          transition={HOVER_SPRING}
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] will-change-transform"
        >
          <Icon className="h-5 w-5" aria-hidden />
        </motion.span>
      </div>

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

      {!isLast && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 translate-x-2 items-center justify-center text-[var(--color-brand-primary)] opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0 group-hover:opacity-100 md:inline-flex"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
        </span>
      )}
    </motion.li>
  );
}
