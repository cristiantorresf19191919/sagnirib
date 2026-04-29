import { listFeatured } from "@/server/biringas";
import { Container } from "@/shared/design-system/components/Container";

import { BiringaCard } from "./BiringaCard";

interface FeaturedBiringasProps {
  /** How many cards to render. Defaults to 8 to fill 2×4 on desktop wide. */
  limit?: number;
  /** Optional eyebrow + title slot. */
  eyebrow?: string;
  title?: string;
  description?: string;
}

const FEATURED_SIZES =
  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1440px) 33vw, 300px";

export async function FeaturedBiringas({
  limit = 8,
  eyebrow = "Destacadas",
  title = "Acompañantes verificadas para hoy",
  description = "Una selección curada por reputación, presencia y disponibilidad reciente.",
}: FeaturedBiringasProps) {
  const listings = await listFeatured(limit);

  if (listings.length === 0) return null;

  return (
    <section
      aria-labelledby="featured-title"
      className="relative py-16 sm:py-20 lg:py-24"
    >
      <Container width="wide">
        <div className="flex flex-col gap-3 sm:gap-4">
          <span className="text-xs uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
            {eyebrow}
          </span>
          <h2
            id="featured-title"
            className="max-w-2xl text-3xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-4xl"
          >
            {title}
          </h2>
          <p className="max-w-xl text-sm text-[var(--color-text-muted)] sm:text-base">
            {description}
          </p>
        </div>

        <ul
          className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          aria-label="Acompañantes destacadas"
        >
          {listings.map((listing, index) => (
            <li key={listing.id}>
              <BiringaCard
                listing={listing}
                priority={index === 0}
                sizes={FEATURED_SIZES}
              />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
