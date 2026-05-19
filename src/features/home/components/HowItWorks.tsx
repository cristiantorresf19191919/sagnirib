"use client";

import Link from "next/link";
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
  /** Per-step accent color for the top bar + corner glow. Forest is the
   *  default Biringas signature; gold flags the trust step to anchor
   *  verification as the centerpiece of the narrative. */
  accent: "forest" | "gold";
  /** Marks the funnel-closing card. The CTA card gets the forest tint,
   *  becomes a real `<Link>`, and renders an explicit button at the
   *  bottom. Non-CTA cards stay information-only — no clickability cues. */
  cta?: { href: string; label: string };
}

const STEPS: ReadonlyArray<Step> = [
  {
    numeral: "01",
    icon: Compass,
    eyebrow: "Catálogo",
    title: "Hojea el catálogo",
    description:
      "Filtra por ciudad, categoría o disponibilidad y revisa perfiles con fotos, idiomas y reseñas.",
    accent: "forest",
  },
  {
    numeral: "02",
    icon: ShieldCheck,
    eyebrow: "Confianza",
    title: "Verifica antes de elegir",
    description:
      "Cada acompañante destacada pasa por un check de identidad y consentimiento de imagen documentado.",
    accent: "gold",
  },
  {
    numeral: "03",
    icon: Sparkles,
    eyebrow: "Reserva",
    title: "Contrata sin fricción",
    description:
      "Reserva directo desde el perfil con discreción absoluta. Mensajería y pago integrados se suman muy pronto a tu experiencia.",
    accent: "forest",
    cta: { href: "/explorar", label: "Explorar el catálogo" },
  },
];

/**
 * Two-layer diffused drop shadow. The tight layer holds the edge; the wider
 * one provides the cushion — together they feel lifted without harshness.
 */
const HOVER_SHADOW =
  "0 18px 40px -16px rgba(20, 28, 24, 0.22), 0 10px 24px -12px rgba(20, 28, 24, 0.12)";
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

const CARD_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 20, boxShadow: REST_SHADOW },
  rest: { opacity: 1, y: 0, boxShadow: REST_SHADOW },
  hover: { opacity: 1, y: -8, boxShadow: HOVER_SHADOW },
};

/**
 * Variants propagate down — when the parent card flips to "hover", every
 * motion child with the same key animates in lockstep. No event wiring.
 */
const ICON_VARIANTS: Variants = {
  hidden: { scale: 1, backgroundColor: "rgba(47, 93, 67, 0.10)", color: "rgb(47, 93, 67)" },
  rest: { scale: 1, backgroundColor: "rgba(47, 93, 67, 0.10)", color: "rgb(47, 93, 67)" },
  hover: { scale: 1.1, backgroundColor: "rgb(47, 93, 67)", color: "rgb(255, 255, 255)" },
};

const NUMERAL_VARIANTS: Variants = {
  hidden: { opacity: 0.5, y: 0 },
  rest: { opacity: 0.5, y: 0 },
  hover: { opacity: 0.85, y: -2 },
};

const ACCENT_BAR_VARIANTS: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  rest: { scaleX: 0, opacity: 0 },
  hover: { scaleX: 1, opacity: 1 },
};

const SHEEN_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  rest: { opacity: 0 },
  hover: { opacity: 1 },
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

/** Accent palette — keys must match the Step.accent union. */
const ACCENT = {
  forest: {
    bar: "linear-gradient(90deg, rgba(47, 93, 67, 0) 0%, rgb(47, 93, 67) 50%, rgba(47, 93, 67, 0) 100%)",
    sheen:
      "radial-gradient(circle at top right, rgba(47, 93, 67, 0.10), transparent 60%)",
  },
  gold: {
    bar: "linear-gradient(90deg, rgba(200, 166, 118, 0) 0%, rgb(200, 166, 118) 50%, rgba(200, 166, 118, 0) 100%)",
    sheen:
      "radial-gradient(circle at top right, rgba(200, 166, 118, 0.16), transparent 60%)",
  },
} as const;

export function HowItWorks() {
  const reduced = useReducedMotion();
  return (
    <section
      data-testid="how-it-works"
      id="como-funciona"
      aria-labelledby="how-title"
      className="relative isolate scroll-mt-24 overflow-hidden border-y border-[var(--color-border)]/60 bg-[var(--color-background-elevated)] py-20 sm:py-24 lg:py-28"
    >
      {/* Ambient aurora — two soft gold + forest blooms that drift across
          the band. Anchors the section as the spread's centerpiece without
          competing with the cards for attention. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 motion-safe:motion-aurora opacity-70"
        style={{
          background:
            "radial-gradient(45% 60% at 18% 20%, rgba(200,166,118,0.14), transparent 70%), radial-gradient(55% 55% at 82% 80%, rgba(47,93,67,0.12), transparent 70%)",
        }}
      />
      {/* Faint top hairline gradient — gives the section a defined upper edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)]/40 to-transparent"
      />

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
          <span className="inline-flex items-center gap-3 rounded-full bg-[var(--color-surface)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)]">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--color-gold)] shadow-[0_0_0_3px_rgba(200,166,118,0.18)]"
            />
            Cómo funciona
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--color-brand-primary)]/70"
            />
          </span>
          <h2
            id="how-title"
            className="mt-5 font-[var(--font-display)] text-[clamp(30px,4.2vw,52px)] font-[370] leading-[1.02] tracking-[-0.028em] text-[var(--color-foreground)]"
          >
            Tres pasos para encontrar la{" "}
            <span className="relative inline-block italic font-[340] text-[var(--color-brand-primary)]">
              compañía adecuada
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-1 left-0 h-[3px] w-full -skew-x-12 bg-[var(--color-gold)] opacity-45"
              />
            </span>
            .
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-[var(--font-serif)] text-[16px] leading-[1.55] text-[var(--color-text-muted)]">
            Reservar es simple. Antes vamos por la confianza —{" "}
            <em>verificación, consentimiento, transparencia.</em>
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
            {STEPS.map((step) => (
              <StepCard
                key={step.numeral}
                step={step}
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
  reduced: boolean;
}

function StepCard({ step, reduced }: Readonly<StepCardProps>) {
  const Icon = step.icon;
  const accent = ACCENT[step.accent];
  const isCta = !!step.cta;

  // CTA card uses a soft cream-to-tinted-cream gradient + a deeper
  // forest border so the eye is pulled to the funnel's finish line. The
  // surface MUST stay fully opaque — the connector sits at `-z-1` behind
  // the cards and any alpha would leak the line through. Non-CTA cards
  // stay neutral surface so visual weight reads 01 < 02 < 03.
  const surfaceCls = isCta
    ? "border-[var(--color-forest)]/25 bg-gradient-to-br from-[var(--color-cream-soft)] via-[var(--color-cream)] to-[#E6DBC1]"
    : "border-[var(--color-border)] bg-[var(--color-surface)]";

  // The CTA card is interactive (real Link target). The non-CTA cards
  // are information-only, so they get `cursor-default` and lose the
  // misleading bottom-right arrow that used to suggest clickability.
  const interactionCls = isCta
    ? "cursor-pointer hover:border-[var(--color-forest)]/45"
    : "cursor-default";

  return (
    <motion.li
      data-testid={`how-it-works-step-${step.numeral}`}
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
      className={`group relative flex h-full flex-col gap-6 overflow-hidden rounded-[var(--radius-2xl)] border p-7 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background-elevated)] sm:p-8 ${surfaceCls} ${interactionCls}`.trim()}
      tabIndex={isCta ? -1 : 0}
    >
      {/* Full-card link overlay on the CTA card. Sits below the explicit
          button's z so users can either click the card surface or the
          button itself; screen readers get one accessible name. */}
      {step.cta && (
        <Link
          href={step.cta.href}
          aria-label={`${step.title} — ${step.cta.label}`}
          className="absolute inset-0 z-10 rounded-[var(--radius-2xl)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background-elevated)]"
          data-testid={`how-it-works-step-${step.numeral}-cta-overlay`}
        >
          <span className="sr-only">{step.cta.label}</span>
        </Link>
      )}

      {/* Top accent bar — draws itself in from the center on hover. Per-step
          accent (forest for action steps, gold for the trust step). On
          the CTA card the bar is rendered at rest so the visual hierarchy
          reads even when nothing is hovered. */}
      <motion.span
        aria-hidden
        variants={reduced ? undefined : ACCENT_BAR_VARIANTS}
        initial={isCta ? "hover" : undefined}
        animate={isCta ? "hover" : undefined}
        transition={HOVER_SPRING}
        className="pointer-events-none absolute inset-x-6 top-0 h-px will-change-transform"
        style={{ backgroundImage: accent.bar }}
      />

      {/* Corner sheen — soft radial glow from the icon's corner. The
          accent tint matches the bar so the card reads as a coordinated
          whole, not pasted-together effects. */}
      <motion.span
        aria-hidden
        variants={reduced ? undefined : SHEEN_VARIANTS}
        transition={HOVER_SPRING}
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: accent.sheen }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <motion.span
          aria-hidden
          variants={reduced ? undefined : NUMERAL_VARIANTS}
          transition={HOVER_SPRING}
          className="bg-gradient-to-br from-[var(--color-brand-primary)] to-[var(--color-brand-primary-soft)] bg-clip-text text-[5.5rem] font-bold leading-none tracking-tight text-transparent will-change-transform"
        >
          {step.numeral}
        </motion.span>
        <motion.span
          aria-hidden
          variants={reduced ? undefined : ICON_VARIANTS}
          transition={HOVER_SPRING}
          // Tailwind classes are the SSR + reduced-motion fallback — when
          // variants are active framer-motion overrides via inline style.
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] will-change-transform"
        >
          <Icon className="h-5 w-5" aria-hidden />
        </motion.span>
      </div>

      <div className="relative flex flex-1 flex-col gap-3">
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

      {/* CTA button — only rendered on the funnel-closing card. Sits at
          z:20 above the full-card link overlay so a direct click still
          counts as the same destination. */}
      {step.cta && (
        <div className="relative z-20 mt-auto pt-2">
          <span
            data-testid={`how-it-works-step-${step.numeral}-cta`}
            className="group/cta inline-flex items-center gap-2 rounded-full bg-[var(--color-forest)] px-5 py-2.5 text-sm font-semibold text-[var(--color-cream)] shadow-[0_8px_22px_-10px_rgba(31,61,46,0.55)] transition-[background,box-shadow,transform] duration-200 ease-[var(--ease-standard)] group-hover:-translate-y-[1px] group-hover:bg-[var(--color-forest-deep)] group-hover:shadow-[0_14px_30px_-10px_rgba(31,61,46,0.6)]"
          >
            {step.cta.label}
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 ease-[var(--ease-standard)] group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </div>
      )}
    </motion.li>
  );
}
