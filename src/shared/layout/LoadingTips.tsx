"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Bot,
  CalendarClock,
  Crown,
  Fingerprint,
  HeartHandshake,
  Lock,
  MapPin,
  MessageSquareText,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

interface Tip {
  /** Visual category — drives the icon, accent colour, and the eyebrow
   *  label users scan first. */
  kind: "safety" | "trust" | "growth" | "smart" | "wit";
  /** Lucide icon rendered in the gold disc on the left. */
  icon: LucideIcon;
  /** Small uppercase label on top — sets the tone in <10 px-tracked chars. */
  eyebrow: string;
  /** Single-sentence tip body. Keep under ~110 chars so it never wraps to
   *  more than 2 lines at narrow widths. */
  body: string;
}

/*
 * Curated catalogue. ~16 tips covering safety, trust, monetisation, and
 * a couple of dry-humoured nudges so the strip doesn't feel preachy. Order
 * matters: the first two are the must-deliver safety messages so they hit
 * even users who see the skeleton for only one cycle.
 */
const TIPS: ReadonlyArray<Tip> = [
  {
    kind: "safety",
    icon: ShieldAlert,
    eyebrow: "Seguridad",
    body: "Nunca envíes dinero por adelantado. Si te lo piden antes del encuentro, es estafa.",
  },
  {
    kind: "trust",
    icon: BadgeCheck,
    eyebrow: "Verifica",
    body: "Confirma siempre la insignia verde de verificación antes de reservar. Sin atajos.",
  },
  {
    kind: "trust",
    icon: MessageSquareText,
    eyebrow: "Reseñas reales",
    body: "Lee las reseñas con texto, no solo las estrellas. Cinco estrellas sin historia son sospechosas.",
  },
  {
    kind: "growth",
    icon: TrendingUp,
    eyebrow: "Crece más rápido",
    body: "¿Quieres aparecer primero? Explora nuestros planes de impulso para subir en las búsquedas.",
  },
  {
    kind: "wit",
    icon: Bot,
    eyebrow: "Detecta bots",
    body: "Si te escriben “amor a primera vista” en el primer mensaje… probablemente sea un bot.",
  },
  {
    kind: "safety",
    icon: AlertTriangle,
    eyebrow: "Acuerda primero",
    body: "Pacta tarifa, lugar y duración por escrito antes del encuentro. La claridad evita disgustos.",
  },
  {
    kind: "smart",
    icon: HeartHandshake,
    eyebrow: "Respeto mutuo",
    body: "Encuentros con cabeza. Sé puntual, sé claro, sé respetuoso — y exige lo mismo.",
  },
  {
    kind: "growth",
    icon: Crown,
    eyebrow: "Top calificadas",
    body: "Los perfiles destacados convierten 3× más. Activa el plan Premium desde tu panel.",
  },
  {
    kind: "smart",
    icon: Wallet,
    eyebrow: "Pago discreto",
    body: "Tu privacidad financiera es nuestra prioridad. Pago integrado y anónimo llega muy pronto.",
  },
  {
    kind: "safety",
    icon: MapPin,
    eyebrow: "Lugar conocido",
    body: "Prefiere zonas concurridas o departamentos verificados. Comparte tu ubicación con alguien de confianza.",
  },
  {
    kind: "trust",
    icon: UserCheck,
    eyebrow: "Consentimiento",
    body: "Cada perfil destacado cuenta con consentimiento de imagen documentado. Pregunta sin pena.",
  },
  {
    kind: "smart",
    icon: CalendarClock,
    eyebrow: "Reserva temprano",
    body: "Las mejores agendas se llenan los jueves y viernes. Apuntá el día antes para evitar carreras.",
  },
  {
    kind: "safety",
    icon: PhoneCall,
    eyebrow: "Verifica el número",
    body: "Una llamada corta antes del encuentro confirma identidad y disipa dudas en segundos.",
  },
  {
    kind: "trust",
    icon: ShieldCheck,
    eyebrow: "Cero datos públicos",
    body: "Nunca publicamos tu nombre real, tu correo ni tu número. Tu identidad nunca se cruza con tu perfil.",
  },
  {
    kind: "wit",
    icon: Sparkles,
    eyebrow: "Mejores fotos",
    body: "Luz natural + ropa que te guste = 80% más visitas. La cámara nota cuando estás cómoda.",
  },
  {
    kind: "smart",
    icon: Lock,
    eyebrow: "Sesión segura",
    body: "Cerramos sesión sola si no usas la app en 7 días. Tu cuenta nunca queda abierta en un equipo prestado.",
  },
  {
    kind: "growth",
    icon: Fingerprint,
    eyebrow: "Perfil completo",
    body: "Llenar bio, idiomas y disponibilidad multiplica tus visitas. Toma 4 minutos y queda guardado.",
  },
];

const ROTATE_MS = 4200;

/** Per-kind accent — drives the icon ring + eyebrow tint. */
const ACCENT: Record<Tip["kind"], { ring: string; text: string }> = {
  safety: {
    ring: "ring-[var(--color-brand-highlight)]/40 bg-[var(--color-brand-highlight)]/12 text-[var(--color-brand-highlight)]",
    text: "text-[var(--color-brand-highlight)]",
  },
  trust: {
    ring: "ring-[var(--color-brand-primary)]/35 bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary)]",
    text: "text-[var(--color-brand-primary)]",
  },
  growth: {
    ring: "ring-[var(--color-gold)]/40 bg-[var(--color-gold)]/15 text-[var(--color-gold-deep)]",
    text: "text-[var(--color-gold-deep)]",
  },
  smart: {
    ring: "ring-[var(--color-brand-secondary-strong)]/35 bg-[var(--color-brand-secondary)]/12 text-[var(--color-brand-secondary-strong)]",
    text: "text-[var(--color-brand-secondary-strong)]",
  },
  wit: {
    ring: "ring-[var(--color-brand-accent-strong)]/40 bg-[var(--color-brand-accent)]/15 text-[var(--color-brand-accent-strong)]",
    text: "text-[var(--color-brand-accent-strong)]",
  },
};

/**
 * Rotating "consejos" strip rendered inside route-level skeletons.
 *
 * Replaces dead empty space with a tip carousel that delivers safety
 * advice, trust cues, and the occasional monetisation nudge to seller-
 * side users. Rotates every ~4.2s with a fade-up transition.
 *
 * Positioning: fixed-centered over the viewport so the tip sits in the
 * optical middle of the screen regardless of which skeleton hosts it.
 * `pointer-events-none` on the outer wrapper preserves click-through to
 * the skeleton beneath; the card itself re-enables events so the dots
 * can be focused by keyboard users in future.
 *
 * Accessibility: tips render inside an `aria-live="polite"` region so
 * screen readers announce changes without interrupting the user.
 */
export function LoadingTips() {
  // Always start at tip #0 ("Nunca envíes dinero por adelantado") so the
  // most important safety message hits even users who only see the
  // skeleton for one cycle. Hydration-stable: SSR + CSR agree on index 0.
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % TIPS.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, []);

  const tip = TIPS[index]!;
  const accent = ACCENT[tip.kind];
  const Icon = tip.icon;

  // Animation key — forces the inner content to remount each rotation,
  // so the CSS fade-up keyframe replays without needing AnimatePresence.
  const key = useMemo(() => `tip-${index}`, [index]);

  return (
    <div
      data-testid="loading-tips-wrapper"
      aria-hidden="false"
      // Viewport-centered overlay. `100dvh` keeps the tip centered even
      // when the mobile URL bar collapses; `pointer-events-none` lets
      // clicks pass through to the skeleton below.
      className="pointer-events-none fixed inset-x-0 top-0 z-40 flex h-[100dvh] items-center justify-center px-4 sm:px-6"
    >
      <aside
        data-testid="loading-tips"
        aria-live="polite"
        aria-label="Consejos mientras carga"
        className="pointer-events-auto relative w-full max-w-[640px] overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)]/92 px-4 py-4 shadow-[0_28px_60px_-28px_rgba(20,28,24,0.35)] backdrop-blur-md sm:px-6 sm:py-5"
      >
        {/* Soft top-left aurora — picks up the active tip's accent so the
            card subtly shifts mood as the carousel rotates. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -left-12 -top-12 h-32 w-32 rounded-full opacity-60 blur-3xl"
          style={{
            background:
              tip.kind === "safety"
                ? "radial-gradient(closest-side, rgba(212,113,104,0.35), transparent 70%)"
                : tip.kind === "growth"
                  ? "radial-gradient(closest-side, rgba(200,166,118,0.35), transparent 70%)"
                  : tip.kind === "wit"
                    ? "radial-gradient(closest-side, rgba(229,162,58,0.35), transparent 70%)"
                    : "radial-gradient(closest-side, rgba(47,93,67,0.30), transparent 70%)",
          }}
        />

        <div key={key} className="motion-safe:motion-hero-reveal relative flex items-start gap-4">
          <span
            aria-hidden
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ${accent.ring}`}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span
              className={`inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] ${accent.text}`}
            >
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rotate-45 bg-current opacity-70"
              />
              {tip.eyebrow}
            </span>
            <p className="mt-1.5 font-[var(--font-serif)] text-[14.5px] leading-[1.5] text-[var(--color-foreground)] sm:text-[15.5px]">
              {tip.body}
            </p>
          </div>
          <Sparkles
            className="hidden h-3.5 w-3.5 shrink-0 text-[var(--color-gold)]/70 motion-safe:motion-sparkle-float sm:block"
            aria-hidden
          />
        </div>

        {/* Progress dots — one per tip, current is filled. Keeps users
            oriented that this is a multi-tip rotator, not one stuck card. */}
        <div
          aria-hidden
          className="relative mt-4 flex flex-wrap items-center justify-center gap-1.5"
        >
          {TIPS.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-[width,background-color] duration-500 ease-[var(--ease-standard)] ${
                i === index
                  ? "w-5 bg-[var(--color-brand-primary)]"
                  : "w-1 bg-[var(--color-border)]"
              }`}
            />
          ))}
        </div>
      </aside>
    </div>
  );
}
