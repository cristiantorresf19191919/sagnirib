import "server-only";

import type { Testimonial } from "@/server/biringas/testimonial-types";

import { BIRINGA_LISTINGS } from "./data";

/**
 * Curated marketing-grade testimonials. Each one references a real
 * listing from the seed catalog (BIRINGA_LISTINGS) so the avatar +
 * link in the card always resolve.
 *
 * When the Firebase adapter ships, this file gets replaced by a
 * `testimonials` collection read with the same shape — features keep
 * importing `listTestimonials()` from the barrel and never know the
 * provider changed.
 */
const QUOTES: ReadonlyArray<{
  alias: string;
  city: string;
  quote: string;
  rating: 4 | 5;
  date: string;
  verified: boolean;
}> = [
  {
    alias: "Andrés M.",
    city: "Bogotá",
    quote:
      "La verificación se nota — la persona que llega es exactamente la del perfil. Cero sorpresas, mucha presencia.",
    rating: 5,
    date: "2026-04-12",
    verified: true,
  },
  {
    alias: "Cliente VIP",
    city: "Medellín",
    quote:
      "Pedí compañía para una cena de negocios y mis colegas no notaron nada. Profesionalismo a otro nivel.",
    rating: 5,
    date: "2026-04-29",
    verified: true,
  },
  {
    alias: "Daniel R.",
    city: "Cartagena",
    quote:
      "Pacté tarifa y plan por chat antes de vernos. Llegó puntual, todo claro, todo cumplido. Volveré.",
    rating: 5,
    date: "2026-05-03",
    verified: true,
  },
  {
    alias: "Anónimo",
    city: "Cali",
    quote:
      "Mi primera vez en una plataforma así. Filtros y reseñas reales me ayudaron a elegir con confianza.",
    rating: 4,
    date: "2026-03-18",
    verified: false,
  },
  {
    alias: "Felipe T.",
    city: "Bogotá",
    quote:
      "Fin de semana en Cartagena impecable. Conversación inteligente, energía buena, discreción absoluta.",
    rating: 5,
    date: "2026-04-22",
    verified: true,
  },
  {
    alias: "Cliente recurrente",
    city: "Barranquilla",
    quote:
      "Llevo tres reservas y todas han salido perfectas. Nunca me pidieron dinero por adelantado — eso lo cambia todo.",
    rating: 5,
    date: "2026-05-10",
    verified: true,
  },
];

/**
 * Returns up to `limit` curated testimonials, each enriched with a
 * concrete listing reference (name + slug + image) drawn from the seed
 * catalog. Stable order so SSR + hydration agree.
 */
export async function listTestimonials(
  limit = 6,
): Promise<ReadonlyArray<Testimonial>> {
  if (BIRINGA_LISTINGS.length === 0) return [];

  return QUOTES.slice(0, limit).map((q, idx) => {
    // Round-robin through the seed catalog so each testimonial points
    // at a different listing — but stay deterministic across requests
    // by indexing rather than randomising.
    const listing =
      BIRINGA_LISTINGS[idx % BIRINGA_LISTINGS.length] ?? BIRINGA_LISTINGS[0]!;
    return {
      id: `testimonial-${idx + 1}`,
      alias: q.alias,
      city: q.city,
      quote: q.quote,
      rating: q.rating,
      date: q.date,
      verified: q.verified,
      listing: {
        slug: listing.slug,
        name: listing.name,
        image: listing.mainImage,
      },
    } satisfies Testimonial;
  });
}
