import Link from "next/link";

import { CATEGORIES, type ListingsFilters } from "@/server/biringas";
import { Container } from "@/shared/design-system/components/Container";

import { withFilter } from "../lib/parse-filters";

interface CategoryBarProps {
  filters: ListingsFilters;
}

/**
 * Top-of-catalog selector. Two pill rows:
 *   - Categoría: Prepagos | Masajes | Videollamadas (filterable, single-select).
 *   - Sexo: Mujeres only — locked active per founder direction (2026-04-29).
 *
 * Each pill is a `<Link>` so the URL is the source of truth and the page is
 * server-rendered against the current filter state.
 */
export function CategoryBar({ filters }: CategoryBarProps) {
  const activeCategory = filters.category;

  return (
    <section
      aria-label="Filtros principales"
      className="relative border-b border-[var(--color-border)]/40 bg-[var(--color-background-elevated)]/60 backdrop-blur-sm"
    >
      <Container
        width="wide"
        className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:gap-8 sm:py-5"
      >
        <Group label="Categoría">
          <Pill
            href={withFilter(filters, "category", undefined)}
            active={activeCategory === undefined}
            tone="primary"
          >
            Todas
          </Pill>
          {CATEGORIES.map(({ id, label }) => (
            <Pill
              key={id}
              href={withFilter(filters, "category", id)}
              active={activeCategory === id}
              tone="primary"
            >
              {label}
            </Pill>
          ))}
        </Group>

        <Group label="Sexo">
          <Pill href={withFilter(filters, "sex", "mujeres")} active tone="secondary">
            Mujeres
          </Pill>
        </Group>
      </Container>
    </section>
  );
}

interface GroupProps {
  label: string;
  children: React.ReactNode;
}

function Group({ label, children }: GroupProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
        {label}:
      </span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

interface PillProps {
  href: string;
  active: boolean;
  tone: "primary" | "secondary";
  children: React.ReactNode;
}

const TONE_ACTIVE: Record<PillProps["tone"], string> = {
  primary:
    "bg-[var(--color-brand-primary)] text-[var(--color-background)] shadow-[0_0_0_1px_rgba(255,93,203,0.45),0_8px_24px_-10px_rgba(255,43,181,0.65)]",
  secondary:
    "bg-[var(--color-brand-secondary)] text-[var(--color-foreground)] shadow-[0_0_0_1px_rgba(157,91,255,0.45),0_8px_24px_-10px_rgba(122,43,255,0.65)]",
};

const INACTIVE =
  "bg-[var(--color-surface)]/70 text-[var(--color-text-muted)] border border-[var(--color-border)]/70 hover:text-[var(--color-foreground)] hover:border-[var(--color-brand-primary)]/50";

function Pill({ href, active, tone, children }: PillProps) {
  const cn = active ? TONE_ACTIVE[tone] : INACTIVE;
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition-[background,border-color,color,box-shadow] duration-200 ease-[var(--ease-standard)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${cn}`}
    >
      {children}
    </Link>
  );
}
