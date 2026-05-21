import { readLocale } from "@/core/i18n/locale";
import { t } from "@/core/i18n/messages";
import { listFeatured } from "@/server/biringas";
import { Container } from "@/shared/design-system/components/Container";

import { BiringaCard } from "./BiringaCard";

interface FeaturedBiringasProps {
  /** How many cards to render. Defaults to 8 to fill 2×4 on desktop wide. */
  limit?: number;
  /** Optional eyebrow + title slot. Each falls back to the locale-aware
   *  copy in the dictionary when omitted. */
  eyebrow?: string;
  title?: string;
  description?: string;
}

const FEATURED_SIZES =
  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1440px) 33vw, 300px";

export async function FeaturedBiringas({
  limit = 8,
  eyebrow,
  title,
  description,
}: FeaturedBiringasProps) {
  const locale = await readLocale();
  const resolvedEyebrow = eyebrow ?? t(locale, "home.featured.eyebrow");
  const resolvedTitle = title ?? t(locale, "home.featured.title.default");
  const resolvedDescription =
    description ?? t(locale, "home.featured.description.default");
  // Auxiliary surface — degrade to null on failure so the caller page
  // still renders without the strip.
  const listings = await listFeatured(limit).catch((err) => {
    console.error("[featured-biringas] listFeatured failed", err);
    return [] as Awaited<ReturnType<typeof listFeatured>>;
  });

  if (listings.length === 0) return null;

  return (
    <section
      aria-labelledby="featured-title"
      className="relative py-16 sm:py-20 lg:py-24"
    >
      <Container width="wide">
        <div className="flex flex-col gap-3 sm:gap-4">
          <span className="text-xs uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
            {resolvedEyebrow}
          </span>
          <h2
            id="featured-title"
            className="max-w-2xl text-3xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-4xl"
          >
            {resolvedTitle}
          </h2>
          <p className="max-w-xl text-sm text-[var(--color-text-muted)] sm:text-base">
            {resolvedDescription}
          </p>
        </div>

        <ul
          className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          aria-label={t(locale, "home.featured.aria")}
        >
          {listings.map((listing, index) => (
            <li key={listing.id}>
              <BiringaCard
                listing={listing}
                locale={locale}
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
