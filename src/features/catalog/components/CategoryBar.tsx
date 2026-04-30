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
export function CategoryBar({ filters, view }: CategoryBarProps) {
  const activeCategory = filters.category;

  const categoryItems = [
    {
      id: "all",
      href: withFilter(filters, "category", undefined as never, view),
      label: "Todas",
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
      aria-label="Categorías"
      className="border-b border-[var(--color-border)]/60 bg-[var(--color-background)]"
    >
      <Container width="wide" className="py-4">
        <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
          <AnimatedTabs
            groupId="category"
            items={categoryItems}
            ariaLabel="Categoría"
          />
          <span
            aria-hidden
            className="hidden h-5 w-px bg-[var(--color-border)] sm:inline-block"
          />
          <AnimatedTabs groupId="sex" items={sexItems} ariaLabel="Sexo" />
        </div>
      </Container>
    </section>
  );
}
