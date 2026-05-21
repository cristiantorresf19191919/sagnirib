import { readLocale } from "@/core/i18n/locale";
import { t } from "@/core/i18n/messages";
import { listSimilar } from "@/server/biringas";
import { CatalogCard } from "@/features/catalog/components/CatalogCard";
import { Container } from "@/shared/design-system/components/Container";

interface SimilarProfilesProps {
  /** Slug of the source listing — siblings are computed from its city + price. */
  slug: string;
  /** Override the rail header copy when context dictates. */
  heading?: string;
  /** How many cards to render. Default 4 keeps the rail to one row. */
  limit?: number;
}

/**
 * Server-rendered rail of similar profiles, anchored at the bottom of the
 * profile page. Returns `null` when the source slug has no neighbors so the
 * page never renders an empty section.
 */
export async function SimilarProfiles({
  slug,
  heading,
  limit = 4,
}: Readonly<SimilarProfilesProps>) {
  const locale = await readLocale();
  // Auxiliary rail — degrade to nothing on failure so the profile page
  // doesn't 500 because of a "more like this" hiccup.
  const similar = await listSimilar(slug, limit).catch((err) => {
    console.error("[profile] listSimilar failed", err);
    return [] as Awaited<ReturnType<typeof listSimilar>>;
  });
  if (similar.length === 0) return null;

  const resolvedHeading = heading ?? t(locale, "similarProfiles.title");

  return (
    <section
      data-testid="similar-profiles"
      aria-labelledby="similar-profiles-title"
      className="border-t border-[var(--color-border)]/60 bg-[var(--color-background)] py-14 sm:py-16"
    >
      <Container width="wide">
        <header className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-subtle)]">
            {t(locale, "similarProfiles.kicker")}
          </span>
          <h2
            id="similar-profiles-title"
            className="text-2xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-3xl"
          >
            {resolvedHeading}
          </h2>
        </header>
        <ul
          data-testid="similar-profiles-list"
          aria-label={t(locale, "similarProfiles.aria")}
          className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {similar.map((listing) => (
            <li
              key={listing.id}
              data-testid={`similar-profile-${listing.slug}`}
            >
              <CatalogCard listing={listing} locale={locale} view="grid3" />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
