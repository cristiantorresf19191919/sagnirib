import { readLocale } from "@/core/i18n/locale";
import { t } from "@/core/i18n/messages";
import { CATEGORIES, type ListingsFilters } from "@/server/biringas";
import { Container } from "@/shared/design-system/components/Container";
import { AnimatedTabs } from "@/shared/motion/AnimatedTabs";

import { type CatalogView, withFilter } from "../lib/parse-filters";

interface CategoryBarProps {
  filters: ListingsFilters;
  view?: CatalogView;
}

/**
 * Top-of-catalog selector. Two underline-tab groups; each group's active
 * indicator is a small forest-green dot that animates between tabs via
 * `layoutId`. URLs remain the source of truth — page is server-rendered
 * against the resulting filter state.
 */
export async function CategoryBar({ filters, view }: CategoryBarProps) {
  const locale = await readLocale();
  const activeCategory = filters.category;

  const categoryItems = [
    {
      id: "all",
      href: withFilter(filters, "category", undefined as never, view),
      label: t(locale, "explorar.categoryBar.all"),
      active: activeCategory === undefined,
    },
    ...CATEGORIES.map(({ id, label }) => ({
      id,
      href: withFilter(filters, "category", id, view),
      label,
      active: activeCategory === id,
    })),
  ];

  const sexItems = [
    {
      id: "mujeres",
      href: withFilter(filters, "sex", "mujeres", view),
      label: "Mujeres",
      active: true,
    },
  ];

  return (
    <section
      data-testid="category-bar"
      aria-label={t(locale, "explorar.categoryBar.aria")}
      className="border-b border-[var(--color-border)]/60 bg-[var(--color-background)]"
    >
      <Container width="wide" className="py-4">
        {/* Horizontal scroll on small screens — keeps every category in a
            single scannable row. Wraps naturally at sm+ where the
            container has space. Scrollbar hidden; the gradient fade on
            the right edge cues scrollability. */}
        <div className="relative">
          <div
            data-testid="category-bar-tabs"
            className="flex flex-nowrap items-center gap-x-5 overflow-x-auto pb-1 [scrollbar-width:none] md:flex-wrap md:gap-x-7 md:gap-y-3 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden"
          >
            {/* `!flex-nowrap` overrides AnimatedTabs' default `flex-wrap` so
                the inner row stays in one scroll lane at mobile widths. The
                outer container is the scroll container (overflow-x-auto on
                CategoryBar) and re-enables wrap at md+. */}
            <AnimatedTabs
              groupId="category"
              items={categoryItems}
              ariaLabel="Categoría"
              className="!flex-nowrap shrink-0 md:!flex-wrap"
            />
            <span
              aria-hidden
              className="hidden h-5 w-px bg-[var(--color-border)] md:inline-block"
            />
            <AnimatedTabs
              groupId="sex"
              items={sexItems}
              ariaLabel="Sexo"
              className="!flex-nowrap shrink-0 md:!flex-wrap"
            />
          </div>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[var(--color-background)] to-transparent md:hidden"
          />
        </div>
      </Container>
    </section>
  );
}
