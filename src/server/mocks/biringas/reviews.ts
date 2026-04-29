import "server-only";

import { BIRINGA_LISTINGS } from "./data";
import type { BiringaListing } from "./types";

export interface ReviewBreakdown {
  trato: number;
  puntualidad: number;
  conversacion: number;
  presentacion: number;
  discrecion: number;
}

export interface ReviewItem {
  id: string;
  alias: string;
  city: string;
  date: string;
  rating: number;
  body: string;
  helpful: number;
  notHelpful: number;
  verified: boolean;
}

export interface ReviewsAggregate {
  total: number;
  averageRating: number;
  /** 0–100. */
  recommendRate: number;
  distribution: ReadonlyArray<{
    stars: number;
    count: number;
    percent: number;
  }>;
  breakdown: ReviewBreakdown;
  anonymousLikes: number;
  anonymousDislikes: number;
  reviews: ReadonlyArray<ReviewItem>;
}

const REVIEW_BODIES: ReadonlyArray<string> = [
  "Súper puntual y elegante. La conversación fluyó toda la noche, repetiría sin pensarlo.",
  "Trato impecable. La presencia que tuvo en el evento corporativo fue exactamente lo que esperaba.",
  "Discreta y profesional. Plan claro desde el primer mensaje, sin sorpresas en el lugar.",
  "Excelente compañía. Bilingüe de verdad y muy atenta a los detalles.",
  "Cumplió con todo lo acordado. Comunicación rápida y en persona muy cálida.",
  "Sentí que disfrutó la cena tanto como yo. Pocas veces siento ese nivel de conexión.",
  "Muy profesional, respetó tiempos y espacios. La recomiendo para viajes cortos.",
  "Llegó puntual, vestida espectacular para el sitio. Cero presión, todo fluyó.",
  "Naturalidad total para presentarla en un grupo. Conversación inteligente y divertida.",
  "Para una salida nocturna estuvo perfecta. Energía buena y discreción absoluta.",
  "Volvería a contratarla para otro viaje. El plan estuvo muy bien armado.",
  "Trato cariñoso y a la vez profesional. Cumplió la descripción del perfil sin trucos.",
  "Pequeño retraso al inicio pero el resto del plan fue impecable. Vale la pena.",
  "Se nota que cuida cada detalle: presentación, perfume, conversación. Muy elegante.",
  "Acompañamiento de alto nivel para una cena de negocios. Mis colegas no notaron nada raro.",
  "Hizo que el cumpleaños fuera memorable sin imponer su estilo. Profesional total.",
  "La verificación se nota: las fotos del perfil coinciden 100% con la persona que llega.",
  "Un poco corta de tiempo en mi caso, pero fue por agenda mía. Buena onda todo el rato.",
  "Plan elegante y sin estrés. Recomendado para un primer encuentro discreto.",
  "Conversamos más de lo que esperaba — muy buena lectora de la situación.",
];

const ALIAS_POOL: ReadonlyArray<string> = [
  "Cliente verificado",
  "Anónimo",
  "Visitante VIP",
  "Cliente frecuente",
  "Anónimo",
  "Cliente verificado",
  "Cliente nuevo",
  "Anónimo",
  "Anónimo · primera vez",
  "Cliente recurrente",
];

const CITY_POOL: ReadonlyArray<string> = [
  "Bogotá",
  "Medellín",
  "Cali",
  "Cartagena",
  "Barranquilla",
  "Bucaramanga",
  "Pereira",
  "Manizales",
];

function hashSlug(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: ReadonlyArray<T>, rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const REFERENCE_DATE = Date.parse("2026-04-29T00:00:00Z");

function buildAggregate(listing: BiringaListing): ReviewsAggregate {
  const seed = hashSlug(listing.slug);
  const rand = mulberry32(seed);
  const overall = listing.reputation.score;
  const total = Math.max(0, listing.reputation.reviewCount);

  // Distribution skewed by overall score (gaussian-ish).
  const weights = [5, 4, 3, 2, 1].map((stars) =>
    Math.exp(-Math.pow((stars - overall) * 1.7, 2)),
  );
  const wsum = weights.reduce((a, b) => a + b, 0);
  const counts: number[] = [0, 0, 0, 0, 0];
  let assigned = 0;
  for (let i = 0; i < 4; i++) {
    counts[i] = Math.round((weights[i] / wsum) * total);
    assigned += counts[i];
  }
  counts[4] = Math.max(0, total - assigned);
  const distribution = counts.map((count, i) => ({
    stars: 5 - i,
    count,
    percent: total === 0 ? 0 : Math.round((count / total) * 100),
  }));

  const jitter = (range: number) => (rand() - 0.5) * range;
  const breakdown: ReviewBreakdown = {
    trato: +clamp(overall + jitter(0.4), 0, 5).toFixed(1),
    puntualidad: +clamp(overall - 0.05 + jitter(0.5), 0, 5).toFixed(1),
    conversacion: +clamp(overall + jitter(0.5), 0, 5).toFixed(1),
    presentacion: +clamp(overall + jitter(0.3), 0, 5).toFixed(1),
    discrecion: +clamp(overall + 0.1 + jitter(0.3), 0, 5).toFixed(1),
  };

  const recommendRate =
    total === 0 ? 0 : clamp(Math.round(80 + (overall - 4) * 18), 50, 99);

  const anonymousLikes = Math.max(
    total === 0 ? 0 : 12,
    Math.round(total * (3.5 + rand() * 4)),
  );
  const anonymousDislikes = Math.max(
    0,
    Math.round(total * (0.04 + rand() * 0.08)),
  );

  // Build up to 6 review entries deterministically.
  const reviewCount = total === 0 ? 0 : Math.min(6, Math.max(3, total));
  const usedBodies = new Set<number>();
  const reviews: ReviewItem[] = [];
  for (let i = 0; i < reviewCount; i++) {
    let bi = Math.floor(rand() * REVIEW_BODIES.length);
    while (usedBodies.has(bi)) bi = (bi + 1) % REVIEW_BODIES.length;
    usedBodies.add(bi);

    const r0 = rand();
    let rating: number;
    if (overall >= 4.7) {
      rating = r0 < 0.7 ? 5 : r0 < 0.92 ? 4 : 3;
    } else if (overall >= 4.3) {
      rating = r0 < 0.5 ? 5 : r0 < 0.85 ? 4 : r0 < 0.96 ? 3 : 2;
    } else {
      rating = r0 < 0.35 ? 5 : r0 < 0.7 ? 4 : r0 < 0.9 ? 3 : 2;
    }

    const daysAgo = Math.floor(rand() * 240) + i * 3;
    const date = new Date(REFERENCE_DATE - daysAgo * 86_400_000).toISOString();

    reviews.push({
      id: `${listing.slug}-rev-${i}`,
      alias: pick(ALIAS_POOL, rand),
      city: pick(CITY_POOL, rand),
      date,
      rating,
      body: REVIEW_BODIES[bi],
      helpful: Math.round(rand() * 28) + 1,
      notHelpful: Math.round(rand() * 4),
      verified: rand() > 0.35,
    });
  }
  reviews.sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date),
  );

  return {
    total,
    averageRating: overall,
    recommendRate,
    distribution,
    breakdown,
    anonymousLikes,
    anonymousDislikes,
    reviews,
  };
}

export async function getListingReviews(
  slug: string,
): Promise<ReviewsAggregate | null> {
  const listing = BIRINGA_LISTINGS.find((l) => l.slug === slug);
  if (!listing) return null;
  return buildAggregate(listing);
}
