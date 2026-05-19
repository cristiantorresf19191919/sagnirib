"use client";

import Link from "next/link";
import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  EyeOff,
  Lock,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import {
  motion,
  useInView,
  useReducedMotion,
  type TargetAndTransition,
  type Variants,
} from "framer-motion";

/**
 * Section-level reveal cascade. The outer container drives a parent
 * `staggerChildren` so the three step cards bloom one after the other
 * in left → right order — each card visibly "grows out of" the previous
 * one because the next reveal only starts after the previous card has
 * crossed its main animation peak (delay ~ 0.55s × index).
 */
const SECTION_PARENT: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.55,
      delayChildren: 0.15,
    },
  },
};

/**
 * Card-level "grow from previous" variant. Each card starts collapsed
 * to a sliver on its LEFT edge (origin-left + small scaleX) and inflates
 * out to the right with a spring — visually, the card unfurls from the
 * trailing edge of the previous card. Y-offset adds a slight rise so
 * the cascade feels organic rather than purely mechanical.
 */
const CARD_GROW_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    scaleX: 0.4,
    scaleY: 0.92,
    y: 14,
    filter: "blur(6px)",
  },
  visible: {
    opacity: 1,
    scaleX: 1,
    scaleY: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 180,
      damping: 22,
      mass: 0.95,
      opacity: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
      filter: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  },
  hover: { y: -6 },
};

import { Container } from "@/shared/design-system/components/Container";

import { HowItWorksConnector } from "./HowItWorksConnector";
import {
  IllustrationStep01,
  IllustrationStep02,
  IllustrationStep03,
} from "./HowItWorksIllustration";

interface Step {
  numeral: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  /** Renders the per-step inline SVG art in the bottom half of the card. */
  illustration: (props: { inView: boolean }) => React.ReactNode;
  /** Marks the funnel-closing card — adds the explicit CTA button and a
   *  full-card <Link> overlay. */
  cta?: { href: string; label: string };
}

const STEPS: ReadonlyArray<Step> = [
  {
    numeral: "01",
    icon: BookOpen,
    eyebrow: "Catálogo",
    title: "Hojea el catálogo",
    description:
      "Filtra por ciudad, categoría o disponibilidad y revisa perfiles con fotos, idiomas y reseñas.",
    illustration: ({ inView }) => <IllustrationStep01 inView={inView} />,
  },
  {
    numeral: "02",
    icon: ShieldCheck,
    eyebrow: "Confianza",
    title: "Verifica antes de elegir",
    description:
      "Cada acompañante destacada pasa por un check de identidad y consentimiento de imagen documentado.",
    illustration: ({ inView }) => <IllustrationStep02 inView={inView} />,
  },
  {
    numeral: "03",
    icon: CalendarCheck,
    eyebrow: "Reserva",
    title: "Contrata sin fricción",
    description:
      "Reserva directo desde el perfil con discreción absoluta. Mensajería y pago integrados se suman muy pronto a tu experiencia.",
    illustration: ({ inView }) => <IllustrationStep03 inView={inView} />,
    cta: { href: "/explorar", label: "Explorar el catálogo" },
  },
];

const INNER_PARENT: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.1 },
  },
};

const ITEM_RISE: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const ITEM_POP: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 280, damping: 20 },
  },
};

const ICON_HOVER: TargetAndTransition = {
  scale: 1.08,
  rotate: -6,
  backgroundColor: "rgba(47, 93, 67, 0.18)",
  transition: { type: "spring", stiffness: 320, damping: 18 },
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
      {/* Background ornamental layer — foliage L, organic blob R, sparkle.
          Sits at -z-10 below content; pointer-events:none so it never
          intercepts clicks. */}
      <SectionOrnaments />

      {/* Faint top hairline gradient — gives the section a defined upper edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)]/40 to-transparent"
      />

      <Container width="wide">
        <header className="mx-auto max-w-3xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-3 rounded-full bg-[var(--color-surface)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)]"
          >
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--color-gold)] shadow-[0_0_0_3px_rgba(200,166,118,0.18)]"
            />
            Cómo funciona
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--color-brand-primary)]/70"
            />
          </motion.span>

          <motion.h2
            id="how-title"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
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
          </motion.h2>

          {/* Editorial underline ornament — short gold rule + diamond.
              Draws in after the headline. */}
          <motion.div
            aria-hidden
            className="mx-auto mt-4 flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            <motion.span
              className="block h-px origin-right bg-gradient-to-l from-[var(--color-gold)] to-transparent"
              initial={{ scaleX: 0, width: 0 }}
              whileInView={{ scaleX: 1, width: "3rem" }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.span
              className="block h-1.5 w-1.5 rotate-45 bg-[var(--color-gold)] shadow-[0_0_0_3px_rgba(200,166,118,0.2)]"
              initial={{ scale: 0, rotate: 0 }}
              whileInView={{ scale: 1, rotate: 45 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.5 }}
            />
            <motion.span
              className="block h-px origin-left bg-gradient-to-r from-[var(--color-gold)] to-transparent"
              initial={{ scaleX: 0, width: 0 }}
              whileInView={{ scaleX: 1, width: "3rem" }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-5 max-w-xl font-[var(--font-serif)] text-[16px] leading-[1.55] text-[var(--color-text-muted)]"
          >
            Reservar es simple. Antes vamos por la confianza —{" "}
            <em>verificación, consentimiento, transparencia.</em>
          </motion.p>
        </header>

        <div className="relative mt-14 lg:mt-20">
          <HowItWorksConnector />
          <motion.ol
            className="relative grid gap-6 md:grid-cols-3 lg:gap-8"
            variants={reduced ? undefined : SECTION_PARENT}
            initial={reduced ? false : "hidden"}
            whileInView={reduced ? undefined : "visible"}
            viewport={{ once: true, amount: 0.2, margin: "-80px" }}
          >
            {STEPS.map((step, idx) => (
              <StepCard
                key={step.numeral}
                step={step}
                index={idx}
                reduced={!!reduced}
              />
            ))}
          </motion.ol>
        </div>

        {/* Privacy / trust ribbon — closes the section with a discrete
            promise. Layout: shield + headline on the left, three inline
            trust items on the right (stack vertically on mobile). */}
        <PrivacyTrustBar reduced={!!reduced} />
      </Container>
    </section>
  );
}

interface StepCardProps {
  step: Step;
  index: number;
  reduced: boolean;
}

function StepCard({ step, index, reduced }: Readonly<StepCardProps>) {
  const Icon = step.icon;
  const isCta = !!step.cta;
  const ref = useRef<HTMLLIElement>(null);
  // Per-card in-view trigger drives only the *inner* per-element
  // stagger (numeral / icon / copy / illustration). The CARD's own
  // entrance is now choreographed by the parent <motion.ol>'s variants
  // cascade so cards reveal one after another (2 grows out of 1, 3
  // grows out of 2) instead of all popping in together.
  const inView = useInView(ref, { once: true, amount: 0.25 });

  const surfaceCls = isCta
    ? "border-[var(--color-forest)]/25 bg-gradient-to-br from-[var(--color-cream-soft)] via-[var(--color-cream)] to-[#E6DBC1]"
    : "border-[var(--color-border)] bg-[var(--color-surface)]";

  const interactionCls = isCta
    ? "cursor-pointer hover:border-[var(--color-forest)]/45"
    : "cursor-default";

  return (
    <motion.li
      ref={ref}
      data-testid={`how-it-works-step-${step.numeral}`}
      variants={reduced ? undefined : CARD_GROW_VARIANTS}
      whileHover={reduced ? undefined : "hover"}
      // Origin-left + GPU promotion so the scaleX inflation feels like
      // the card is unfurling from the trailing edge of its left
      // neighbour. `contain` keeps the layout cost local.
      style={{
        transformOrigin: "left center",
        willChange: "transform, opacity, filter",
      }}
      className={`group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-2xl)] border p-7 outline-none [contain:layout_paint] focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background-elevated)] sm:p-8 ${surfaceCls} ${interactionCls}`.trim()}
      tabIndex={isCta ? -1 : 0}
    >
      {/* "Grow-from-previous" connector spark — a small gold dot that
          shoots in from the LEFT edge as this card unfurls. Card #1
          skips it (nothing to grow from). Sits behind content; pure
          decoration. */}
      {!reduced && index > 0 && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute left-0 top-1/2 -z-[1] block h-3 w-3 -translate-y-1/2 rounded-full bg-[var(--color-gold)] shadow-[0_0_0_4px_rgba(200,166,118,0.22),0_0_16px_4px_rgba(200,166,118,0.32)]"
          initial={{ opacity: 0, scale: 0.4, x: -22 }}
          whileInView={{
            opacity: [0, 1, 0],
            scale: [0.4, 1.2, 0.6],
            x: [-22, 18, 28],
          }}
          viewport={{ once: true, amount: 0.25, margin: "-80px" }}
          transition={{
            duration: 0.9,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.05,
          }}
        />
      )}
      {/* CTA card link overlay — full surface click target at z:10. */}
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

      {/* Inner stagger container — coordinates the per-card "wake up"
          cascade. Uses its own variant keys ("hidden"/"visible") so it
          doesn't collide with the card-level "card-*" entrance variants. */}
      <motion.div
        variants={reduced ? undefined : INNER_PARENT}
        initial={reduced ? false : "hidden"}
        animate={reduced ? undefined : inView ? "visible" : "hidden"}
        className="relative flex flex-1 flex-col gap-5"
      >
        {/* Numeral + icon row */}
        <div className="flex items-start justify-between gap-4">
          <motion.span
            aria-hidden
            variants={reduced ? undefined : ITEM_RISE}
            className="bg-gradient-to-br from-[var(--color-brand-primary)] to-[var(--color-brand-primary-soft)] bg-clip-text text-[5.5rem] font-bold leading-none tracking-tight text-transparent will-change-transform"
          >
            {step.numeral}
          </motion.span>
          <motion.span
            aria-hidden
            variants={reduced ? undefined : ITEM_POP}
            whileHover={reduced ? undefined : ICON_HOVER}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/20"
          >
            <Icon className="h-5 w-5" aria-hidden />
          </motion.span>
        </div>

        {/* Gold hairline divider — draws in below the icon row, matching
            the reference's subtle eyebrow separator. */}
        <motion.span
          aria-hidden
          variants={reduced ? undefined : ITEM_RISE}
          className="block h-px w-12 bg-gradient-to-r from-[var(--color-gold)] to-transparent"
        />

        <div className="flex flex-col gap-2.5">
          <motion.span
            variants={reduced ? undefined : ITEM_RISE}
            className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-text-subtle)]"
          >
            {step.eyebrow}
          </motion.span>
          <motion.h3
            variants={reduced ? undefined : ITEM_RISE}
            className="text-2xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]"
          >
            {step.title}
          </motion.h3>
          <motion.p
            variants={reduced ? undefined : ITEM_RISE}
            className="text-sm leading-relaxed text-[var(--color-text-muted)]"
          >
            {step.description}
          </motion.p>
        </div>

        {/* Illustration — fills the lower half of the card. Reads the
            same `inView` so the per-step SVG animates in lockstep with
            the rest of the card. The CTA button sits on top of it. */}
        <motion.div
          variants={reduced ? undefined : ITEM_RISE}
          className="relative mt-2 h-[140px] sm:h-[160px]"
        >
          {step.illustration({ inView })}
        </motion.div>

        {/* CTA button — only on the funnel-closing card. z:20 above the
            full-card link overlay so clicks register. */}
        {step.cta && (
          <div className="relative z-20 mt-auto pt-2">
            <motion.span
              data-testid={`how-it-works-step-${step.numeral}-cta`}
              variants={reduced ? undefined : ITEM_RISE}
              className="group/cta inline-flex items-center gap-2 rounded-full bg-[var(--color-forest)] px-5 py-2.5 text-sm font-semibold text-[var(--color-cream)] shadow-[0_8px_22px_-10px_rgba(31,61,46,0.55)] transition-[background,box-shadow,transform] duration-200 ease-[var(--ease-standard)] group-hover:-translate-y-[1px] group-hover:bg-[var(--color-forest-deep)] group-hover:shadow-[0_14px_30px_-10px_rgba(31,61,46,0.6)]"
            >
              {step.cta.label}
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 ease-[var(--ease-standard)] group-hover:translate-x-0.5"
                aria-hidden
              />
            </motion.span>
          </div>
        )}
      </motion.div>
    </motion.li>
  );
}

/**
 * Bottom-of-section privacy trust ribbon. Pure visual — anchors the
 * three-step narrative with a brand promise about discretion +
 * verification + confidentiality. Three lucide icons in soft forest
 * circles; the row stacks vertically on mobile.
 */
function PrivacyTrustBar({ reduced }: Readonly<{ reduced: boolean }>) {
  return (
    <motion.div
      data-testid="how-it-works-trust-bar"
      initial={reduced ? false : { opacity: 0, y: 18 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative mt-12 grid grid-cols-1 items-center gap-5 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-cream-soft)]/70 p-5 sm:p-6 md:grid-cols-[1fr_auto] md:gap-8 lg:mt-16"
    >
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)] text-[var(--color-cream)] shadow-[0_8px_20px_-8px_rgba(31,61,46,0.55)]"
        >
          <ShieldCheck className="h-5 w-5" aria-hidden />
        </span>
        <div className="flex flex-col">
          <span className="font-[var(--font-display)] text-[18px] font-[480] leading-tight tracking-tight text-[var(--color-foreground)]">
            Tu privacidad es primero
          </span>
          <span className="mt-0.5 font-[var(--font-serif)] text-[14px] italic leading-snug text-[var(--color-text-muted)]">
            Discreción, seguridad y respeto en cada paso.
          </span>
        </div>
      </div>

      <ul
        aria-label="Garantías de privacidad"
        className="flex flex-col gap-3 text-[13px] text-[var(--color-text-muted)] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2 md:justify-end"
      >
        <TrustItem icon={Lock} label="Perfiles verificados" />
        <TrustItem icon={UserCheck} label="Consentimiento documentado" />
        <TrustItem icon={EyeOff} label="100% confidencial" />
      </ul>
    </motion.div>
  );
}

function TrustItem({
  icon: Icon,
  label,
}: Readonly<{ icon: LucideIcon; label: string }>) {
  return (
    <li className="inline-flex items-center gap-2">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/20">
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <span className="font-medium text-[var(--color-foreground)]">
        {label}
      </span>
    </li>
  );
}

/**
 * Decorative SVG ornaments that frame the section: a soft eucalyptus
 * sprig at the upper-left, an organic forest blob at the upper-right,
 * and faint dot-grid accents. Sits at -z-10 so content always paints
 * above it; absolutely positioned, pointer-events:none.
 */
function SectionOrnaments() {
  return (
    <>
      {/* Ambient aurora — kept from the previous design so the section
          still glows softly behind the cards. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 motion-safe:motion-aurora opacity-70"
        style={{
          background:
            "radial-gradient(45% 60% at 18% 20%, rgba(200,166,118,0.14), transparent 70%), radial-gradient(55% 55% at 82% 80%, rgba(47,93,67,0.12), transparent 70%)",
        }}
      />

      {/* Eucalyptus sprig — upper-left. Hidden on small screens so the
          mobile layout isn't crowded; appears from md+ where the section
          has room to breathe. */}
      <motion.svg
        aria-hidden
        viewBox="0 0 240 240"
        className="pointer-events-none absolute -left-8 top-4 -z-10 hidden h-44 w-44 text-[var(--color-brand-primary)]/55 md:block lg:h-56 lg:w-56"
        initial={{ opacity: 0, rotate: -8 }}
        whileInView={{ opacity: 1, rotate: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <defs>
          <linearGradient id="hw-leaf" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#A9C2B2" />
            <stop offset="1" stopColor="#2F5D43" />
          </linearGradient>
        </defs>
        {/* Stem */}
        <motion.path
          d="M 28 20 C 60 60, 90 100, 140 200"
          fill="none"
          stroke="#5C6E51"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Leaves arranged along the stem */}
        {[
          { cx: 38, cy: 36, rx: 16, ry: 8, rot: -50 },
          { cx: 52, cy: 56, rx: 18, ry: 9, rot: 40 },
          { cx: 70, cy: 80, rx: 20, ry: 10, rot: -55 },
          { cx: 86, cy: 108, rx: 22, ry: 10, rot: 45 },
          { cx: 102, cy: 138, rx: 24, ry: 11, rot: -50 },
          { cx: 118, cy: 168, rx: 24, ry: 11, rot: 48 },
          { cx: 132, cy: 196, rx: 22, ry: 10, rot: -52 },
        ].map((leaf, i) => (
          <motion.ellipse
            key={i}
            cx={leaf.cx}
            cy={leaf.cy}
            rx={leaf.rx}
            ry={leaf.ry}
            transform={`rotate(${leaf.rot} ${leaf.cx} ${leaf.cy})`}
            fill="url(#hw-leaf)"
            opacity={0.78}
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 0.78 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 18,
              delay: 0.3 + i * 0.08,
            }}
          />
        ))}
      </motion.svg>

      {/* Organic forest blob — upper-right corner. A soft rounded shape
          that bleeds off the page edge. */}
      <motion.svg
        aria-hidden
        viewBox="0 0 320 240"
        className="pointer-events-none absolute -right-12 -top-8 -z-10 hidden h-48 w-64 md:block lg:h-60 lg:w-80"
        initial={{ opacity: 0, scale: 0.92 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <defs>
          <linearGradient id="hw-blob" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#1F3D2E" stopOpacity="0.55" />
            <stop offset="1" stopColor="#2F5D43" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path
          d="M 320 -20 C 240 -10, 160 30, 180 120 C 200 200, 320 200, 360 100 Z"
          fill="url(#hw-blob)"
        />
      </motion.svg>

      {/* Gold sparkle — upper-right, matching reference image */}
      <motion.svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute right-[10%] top-10 -z-10 hidden h-5 w-5 text-[var(--color-gold)] motion-safe:motion-sparkle-float md:block"
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{
          type: "spring",
          stiffness: 280,
          damping: 18,
          delay: 0.7,
        }}
        style={{ animationDelay: "0.8s" }}
      >
        <path
          d="M12 2 L13.5 10 L22 12 L13.5 14 L12 22 L10.5 14 L2 12 L10.5 10 Z"
          fill="currentColor"
        />
      </motion.svg>

      {/* Faint dot grid — upper-right under the blob, adds editorial detail */}
      <svg
        aria-hidden
        viewBox="0 0 100 60"
        className="pointer-events-none absolute right-[18%] top-32 -z-10 hidden h-16 w-24 text-[var(--color-brand-primary)]/25 md:block"
      >
        {Array.from({ length: 6 }).flatMap((_, row) =>
          Array.from({ length: 10 }).map((__, col) => (
            <circle
              key={`${row}-${col}`}
              cx={col * 10 + 5}
              cy={row * 10 + 5}
              r="1"
              fill="currentColor"
            />
          )),
        )}
      </svg>
    </>
  );
}
