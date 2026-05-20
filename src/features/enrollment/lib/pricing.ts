/**
 * Pricing strategy for biringa enrollment.
 *
 * Three recurring tiers anchor the offer (Esencial floor, Destacada mid /
 * decoy, Premium VIP aspirational). Pricing is in COP and tuned for the
 * Colombian market — Destacada is the conversion target. One-shot add-ons
 * monetize impatience and category competition without reshuffling the
 * subscription plans.
 *
 * Mock-only today. Real billing lands behind
 * `src/server/adapters/<provider>/` once a payment provider is picked.
 *
 * MVP free launch (founder decision 2026-05-19): until the payment provider
 * is wired in, ALL profiles publish for free. The 3 plans remain visible
 * in the wizard so users see the future offer, but the cards and add-ons
 * render disabled and a "Lanzamiento gratuito" banner explains why. Flip
 * `PLANS_ENABLED` to `true` in the same PR that wires the provider.
 */

/**
 * Master toggle for the paid-plans selection step.
 *
 *   - `false` (MVP launch): wizard shows plans visually but locks selection
 *     to `'esencial'` internally, hides totals, replaces CTA with
 *     "Publicar gratis", hides billing toggle, disables add-ons.
 *   - `true`  (post-payment-provider): wizard accepts plan + add-on choice,
 *     shows totals, CTA reads "Publicar y pagar [TOTAL]".
 *
 * Single point of truth — every component reads this flag instead of
 * branching on env vars or duplicated booleans.
 */
export const PLANS_ENABLED = false as boolean;

/** Forced default while `PLANS_ENABLED === false`. Esencial keeps the
 *  audit / Firestore record consistent with the post-launch contract. */
export const MVP_LOCKED_PACKAGE_ID = "esencial" as const;

export type PackageId = "esencial" | "destacada" | "premium";
export type AddOnId =
  | "city-boost-24h"
  | "category-top-7d"
  | "story-banner-7d"
  | "seo-pack"
  | "verified-shoot";

export interface Package {
  id: PackageId;
  name: string;
  /** Headline tagline shown under the price. */
  tagline: string;
  monthlyCop: number;
  /** Honest savings vs. month-by-month if user picks 3-month upfront. */
  quarterlyDiscountPct: number;
  /** Sales-pitch bullets — what you actually get. */
  perks: ReadonlyArray<string>;
  /** Internal positioning. */
  recommended?: boolean;
  /** Optional secondary line — e.g. "para empezar". */
  bestFor: string;
}

export interface AddOn {
  id: AddOnId;
  name: string;
  /** Short explanation for the picker. */
  description: string;
  priceCop: number;
  /** Display unit — "/24h", "/7d", or "" for one-shot. */
  unit: string;
  /** Bucket for the UI: visibility boost vs. content/SEO services. */
  family: "boost" | "content";
}

export const PACKAGES: ReadonlyArray<Package> = [
  {
    id: "esencial",
    name: "Esencial",
    tagline: "Tu primer anuncio activo",
    monthlyCop: 89_000,
    quarterlyDiscountPct: 10,
    bestFor: "Para empezar y probar la plataforma.",
    perks: [
      "1 anuncio activo",
      "Hasta 3 fotos",
      "Catálogo general (orden por recencia)",
      "Soporte por email",
      "Edición ilimitada del perfil",
    ],
  },
  {
    id: "destacada",
    name: "Destacada",
    tagline: "El plan que más eligen",
    monthlyCop: 189_000,
    quarterlyDiscountPct: 15,
    recommended: true,
    bestFor: "Más visibilidad, badge verificado y estadísticas.",
    perks: [
      "1 anuncio + 8 fotos + 1 video",
      "Boost en orden de catálogo",
      "Badge verificada (foto + ID)",
      "Stories diarias",
      "Estadísticas semanales",
      "Soporte prioritario por email",
    ],
  },
  {
    id: "premium",
    name: "Premium VIP",
    tagline: "Tope del catálogo",
    monthlyCop: 349_000,
    quarterlyDiscountPct: 20,
    bestFor: "Cuando quieres estar siempre arriba.",
    perks: [
      "Galería ilimitada + 3 videos",
      "Top fijo en Featured (home + categoría)",
      "Badge VIP destacado",
      "Reseñas verificadas habilitadas",
      "Stories destacadas en banner",
      "Soporte por WhatsApp en horario hábil",
    ],
  },
];

export const ADD_ONS: ReadonlyArray<AddOn> = [
  {
    id: "city-boost-24h",
    name: "Boost de ciudad · 24 h",
    description:
      "Aparece en el tope de tu ciudad durante 24 horas. Ideal para fines de semana y eventos.",
    priceCop: 25_000,
    unit: "/ 24 h",
    family: "boost",
  },
  {
    id: "category-top-7d",
    name: "Posición #1 categoría · 7 días",
    description:
      "Tu perfil queda primero en su categoría (prepagos, masajes o videollamadas) durante una semana.",
    priceCop: 79_000,
    unit: "/ 7 días",
    family: "boost",
  },
  {
    id: "story-banner-7d",
    name: "Story destacada · 7 días",
    description:
      "Tu story aparece en el banner superior del catálogo. Refresca el contenido cada 24 h.",
    priceCop: 59_000,
    unit: "/ 7 días",
    family: "boost",
  },
  {
    id: "seo-pack",
    name: "Pack SEO",
    description:
      "Meta tags optimizados, slug profesional, 5 keywords y retoque de copy para tu perfil. Pago único.",
    priceCop: 129_000,
    unit: "pago único",
    family: "content",
  },
  {
    id: "verified-shoot",
    name: "Reportaje fotográfico verificado",
    description:
      "Sesión con fotógrafa asociada en tu ciudad. 12 fotos finales + verificación oficial. Pago único.",
    priceCop: 250_000,
    unit: "pago único",
    family: "content",
  },
];

const COP_FORMATTER = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatCop(value: number): string {
  return COP_FORMATTER.format(value);
}

/**
 * Maximum photos accepted by the wizard's upload section per plan.
 *
 *   - Esencial:  3 — matches the "Hasta 3 fotos" perk copy.
 *   - Destacada: 8 — matches the "1 anuncio + 8 fotos + 1 video" perk copy.
 *   - Premium:  24 — generous cap; aligned with DRAFT_LIMITS.galleryMax on
 *     the server (which is the absolute ceiling regardless of plan).
 *   - MVP free: 8 — generous default until plan tiers turn on. Picked to
 *     give modelos a real-feeling gallery during launch without blowing
 *     up storage spend.
 */
export const GALLERY_MAX_BY_PACKAGE: Record<PackageId, number> = {
  esencial: 3,
  destacada: 8,
  premium: 24,
};
export const GALLERY_MAX_MVP_FREE = 8;

export function galleryMaxFor(packageId: PackageId): number {
  if (!PLANS_ENABLED) return GALLERY_MAX_MVP_FREE;
  return GALLERY_MAX_BY_PACKAGE[packageId];
}

export function findPackage(id: PackageId): Package {
  const found = PACKAGES.find((p) => p.id === id);
  if (!found) throw new Error(`Unknown package id: ${id}`);
  return found;
}

export function findAddOn(id: AddOnId): AddOn {
  const found = ADD_ONS.find((a) => a.id === id);
  if (!found) throw new Error(`Unknown add-on id: ${id}`);
  return found;
}

/**
 * Computes the total for the current selection. Used in the wizard summary
 * and the final CTA. Quarterly discount applies to the package only — add-ons
 * stay flat (they're one-shot).
 */
export function calculateTotal(
  packageId: PackageId,
  addOnIds: ReadonlyArray<AddOnId>,
  billing: BillingCycle = "monthly",
): {
  packageCop: number;
  addOnsCop: number;
  totalCop: number;
  effectiveMonthlyCop: number;
} {
  const pkg = findPackage(packageId);
  const months = billing === "quarterly" ? 3 : 1;
  const discount = billing === "quarterly" ? pkg.quarterlyDiscountPct / 100 : 0;
  const packageCop = Math.round(pkg.monthlyCop * months * (1 - discount));
  const addOnsCop = addOnIds.reduce((sum, id) => sum + findAddOn(id).priceCop, 0);
  const totalCop = packageCop + addOnsCop;
  const effectiveMonthlyCop = Math.round(packageCop / months);
  return { packageCop, addOnsCop, totalCop, effectiveMonthlyCop };
}

export type BillingCycle = "monthly" | "quarterly";
