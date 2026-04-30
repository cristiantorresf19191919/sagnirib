import Link from "next/link";
import {
  LayoutGrid,
  LayoutList,
  Rows3,
  Square,
} from "lucide-react";

import type { ListingsFilters } from "@/server/biringas";

import {
  CATALOG_VIEWS,
  DEFAULT_CATALOG_VIEW,
  type CatalogView,
} from "../lib/parse-filters";
import { encodeFilters } from "../lib/parse-filters";

interface ViewSwitcherProps {
  filters: ListingsFilters;
  current: CatalogView;
}

const VIEW_LABEL: Record<CatalogView, string> = {
  spotlight: "Vista destacada",
  grid2: "Cuadrícula doble",
  grid3: "Cuadrícula triple",
  list: "Vista de lista",
};

const VIEW_ICON: Record<CatalogView, React.ComponentType<{ className?: string }>> = {
  spotlight: Square,
  grid2: LayoutGrid,
  grid3: Rows3,
  list: LayoutList,
};

function hrefForView(filters: ListingsFilters, view: CatalogView): string {
  const params = encodeFilters(filters);
  if (view !== DEFAULT_CATALOG_VIEW) params.set("view", view);
  else params.delete("view");
  const qs = params.toString();
  return qs.length > 0 ? `/?${qs}` : "/";
}

/**
 * Catalog grid layout switcher. Four modes — spotlight (1-up), grid2 (2-up),
 * grid3 (default 3-up scaling to 4 on xl), and list (horizontal cards). Each
 * button is a `<Link>` so view selection is bookmarkable / SSR-friendly.
 */
export function ViewSwitcher({ filters, current }: ViewSwitcherProps) {
  return (
    <div
      role="group"
      aria-label="Cambiar vista del catálogo"
      className="inline-flex items-center gap-0.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-[var(--shadow-sm)]"
    >
      {CATALOG_VIEWS.map((view) => {
        const Icon = VIEW_ICON[view];
        const isActive = view === current;
        return (
          <Link
            key={view}
            href={hrefForView(filters, view)}
            aria-label={VIEW_LABEL[view]}
            aria-pressed={isActive}
            scroll={false}
            className={
              isActive
                ? "inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-primary)] text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-colors"
                : "inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
            }
          >
            <Icon className="h-4 w-4" />
          </Link>
        );
      })}
    </div>
  );
}
