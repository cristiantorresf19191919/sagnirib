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

/**
 * Canonical "consejos" catalogue shared by every loading surface.
 *
 * One source of truth so the copy never forks: the public catalog skeleton
 * (`LoadingTips`) shows the whole set, while the signed-in account loader
 * (`AccountLoadingTips`) filters to the `seller`-tagged subset. The `audience`
 * tag is metadata only — no copy is invented per surface.
 */
export type TipAudience = "buyer" | "seller";

export interface Tip {
  /** Visual category — drives the icon, accent colour, and the eyebrow
   *  label users scan first. */
  kind: "safety" | "trust" | "growth" | "smart" | "wit";
  /** Who the tip is for. Both tags = relevant to everyone. */
  audience: ReadonlyArray<TipAudience>;
  /** Lucide icon rendered in the accent disc on the left. */
  icon: LucideIcon;
  /** Small uppercase label on top — sets the tone in <10 px-tracked chars. */
  eyebrow: string;
  /** Single-sentence tip body. Keep under ~110 chars so it never wraps to
   *  more than 2 lines at narrow widths. */
  body: string;
}

/*
 * Curated catalogue. Order matters for the public strip: the first two are
 * the must-deliver safety messages so they hit even users who see the
 * skeleton for only one cycle.
 */
export const TIPS: ReadonlyArray<Tip> = [
  {
    kind: "safety",
    audience: ["buyer"],
    icon: ShieldAlert,
    eyebrow: "Seguridad",
    body: "Nunca envíes dinero por adelantado. Si te lo piden antes del encuentro, es estafa.",
  },
  {
    kind: "trust",
    audience: ["buyer"],
    icon: BadgeCheck,
    eyebrow: "Verifica",
    body: "Confirma siempre la insignia verde de verificación antes de reservar. Sin atajos.",
  },
  {
    kind: "trust",
    audience: ["buyer"],
    icon: MessageSquareText,
    eyebrow: "Reseñas reales",
    body: "Lee las reseñas con texto, no solo las estrellas. Cinco estrellas sin historia son sospechosas.",
  },
  {
    kind: "growth",
    audience: ["seller"],
    icon: TrendingUp,
    eyebrow: "Crece más rápido",
    body: "¿Quieres aparecer primero? Explora nuestros planes de impulso para subir en las búsquedas.",
  },
  {
    kind: "wit",
    audience: ["buyer"],
    icon: Bot,
    eyebrow: "Detecta bots",
    body: "Si te escriben “amor a primera vista” en el primer mensaje… probablemente sea un bot.",
  },
  {
    kind: "safety",
    audience: ["buyer", "seller"],
    icon: AlertTriangle,
    eyebrow: "Acuerda primero",
    body: "Pacta tarifa, lugar y duración por escrito antes del encuentro. La claridad evita disgustos.",
  },
  {
    kind: "smart",
    audience: ["buyer", "seller"],
    icon: HeartHandshake,
    eyebrow: "Respeto mutuo",
    body: "Encuentros con cabeza. Sé puntual, sé claro, sé respetuoso — y exige lo mismo.",
  },
  {
    kind: "growth",
    audience: ["seller"],
    icon: Crown,
    eyebrow: "Top calificadas",
    body: "Los perfiles destacados convierten 3× más. Activa el plan Premium desde tu panel.",
  },
  {
    kind: "smart",
    audience: ["buyer", "seller"],
    icon: Wallet,
    eyebrow: "Pago discreto",
    body: "Tu privacidad financiera es nuestra prioridad. Pago integrado y anónimo llega muy pronto.",
  },
  {
    kind: "safety",
    audience: ["buyer", "seller"],
    icon: MapPin,
    eyebrow: "Lugar conocido",
    body: "Prefiere zonas concurridas o departamentos verificados. Comparte tu ubicación con alguien de confianza.",
  },
  {
    kind: "trust",
    audience: ["buyer", "seller"],
    icon: UserCheck,
    eyebrow: "Consentimiento",
    body: "Cada perfil destacado cuenta con consentimiento de imagen documentado. Pregunta sin pena.",
  },
  {
    kind: "smart",
    audience: ["buyer", "seller"],
    icon: CalendarClock,
    eyebrow: "Reserva temprano",
    body: "Las mejores agendas se llenan los jueves y viernes. Apuntá el día antes para evitar carreras.",
  },
  {
    kind: "safety",
    audience: ["buyer", "seller"],
    icon: PhoneCall,
    eyebrow: "Verifica el número",
    body: "Una llamada corta antes del encuentro confirma identidad y disipa dudas en segundos.",
  },
  {
    kind: "trust",
    audience: ["buyer", "seller"],
    icon: ShieldCheck,
    eyebrow: "Cero datos públicos",
    body: "Nunca publicamos tu nombre real, tu correo ni tu número. Tu identidad nunca se cruza con tu perfil.",
  },
  {
    kind: "wit",
    audience: ["seller"],
    icon: Sparkles,
    eyebrow: "Mejores fotos",
    body: "Luz natural + ropa que te guste = 80% más visitas. La cámara nota cuando estás cómoda.",
  },
  {
    kind: "smart",
    audience: ["buyer", "seller"],
    icon: Lock,
    eyebrow: "Sesión segura",
    body: "Cerramos sesión sola si no usas la app en 7 días. Tu cuenta nunca queda abierta en un equipo prestado.",
  },
  {
    kind: "growth",
    audience: ["seller"],
    icon: Fingerprint,
    eyebrow: "Perfil completo",
    body: "Llenar bio, idiomas y disponibilidad multiplica tus visitas. Toma 4 minutos y queda guardado.",
  },
];

/** Per-kind accent — drives the icon ring + eyebrow tint. */
export const ACCENT: Record<Tip["kind"], { ring: string; text: string }> = {
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
