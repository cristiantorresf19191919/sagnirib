import { CATEGORIES, type ListingsFilters } from "@/server/biringas";
import { Container } from "@/shared/design-system/components/Container";
import { MotionPill } from "@/shared/motion/MotionPill";

import { withFilter } from "../lib/parse-filters";

interface CategoryBarProps {
  filters: ListingsFilters;
}

/**
 * Top-of-catalog selector. Underline-tab style mirrors the spa mockup:
 * inactive tabs sit flush, the active tab is bolder with a forest-green dot
 * underneath. Each tab is a `<Link>` so the URL is the source of truth.
 */
export function CategoryBar({ filters }: CategoryBarProps) {
  const activeCategory = filters.category;
  const tabs: Array<{ id: string | undefined; label: string }> = [
    { id: undefined, label: "Todas" },
    ...CATEGORIES.map((c) => ({ id: c.id as string | undefined, label: c.label })),
  ];

  return (
    <section
      aria-label="Categorías"
      className="border-b border-[var(--color-border)]/60 bg-[var(--color-background)]"
    >
      <Container width="wide" className="py-4">
        <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
          {tabs.map((tab) => (
            <Tab
              key={tab.label}
              href={withFilter(filters, "category", tab.id as never)}
              active={activeCategory === tab.id}
            >
              {tab.label}
            </Tab>
          ))}
          <span
            aria-hidden
            className="hidden h-5 w-px bg-[var(--color-border)] sm:inline-block"
          />
          <Tab
            href={withFilter(filters, "sex", "mujeres")}
            active
          >
            Mujeres
          </Tab>
        </div>
      </Container>
    </section>
  );
}

interface TabProps {
  href: string;
  active: boolean;
  children: React.ReactNode;
}

function Tab({ href, active, children }: TabProps) {
  const cls = active
    ? "text-[var(--color-foreground)] font-bold"
    : "text-[var(--color-text-muted)] font-medium hover:text-[var(--color-foreground)]";

  return (
    <MotionPill
      href={href}
      aria-current={active ? "true" : undefined}
      active={active}
      className={`relative inline-flex flex-col items-center gap-1 px-1 py-1 text-sm transition-colors duration-200 ease-[var(--ease-standard)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${cls}`}
    >
      <span>{children}</span>
      {active && (
        <span
          aria-hidden
          className="h-1 w-1 rounded-full bg-[var(--color-brand-primary)]"
        />
      )}
    </MotionPill>
  );
}
