import Link from "next/link";
import {
  BadgeCheck,
  Eye,
  Flame,
  Sparkles,
  Star,
  Video,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { ListingsFilters } from "@/server/biringas";
import { Container } from "@/shared/design-system/components/Container";

import { encodeFilters, type CatalogView } from "../lib/parse-filters";

interface QuickPresetsProps {
  filters: ListingsFilters;
  view?: CatalogView;
}

interface Preset {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Which `ListingsFilters` keys this preset toggles. */
  apply: (filters: ListingsFilters) => ListingsFilters;
  /** True when the current filters already satisfy the preset. */
  isActive: (filters: ListingsFilters) => boolean;
  /** Inverse — clicking an active preset removes its toggles. */
  remove: (filters: ListingsFilters) => ListingsFilters;
  /** Optional accent — picks a tone token for the icon background. */
  tone?: "primary" | "accent" | "highlight";
}

const PRESETS: ReadonlyArray<Preset> = [
  {
    id: "now",
    label: "Disponibles ahora",
    icon: Flame,
    tone: "highlight",
    apply: (f) => ({ ...f, availableNow: true, page: undefined }),
    remove: (f) => ({ ...f, availableNow: undefined, page: undefined }),
    isActive: (f) => Boolean(f.availableNow),
  },
  {
    id: "verified",
    label: "Verificadas",
    icon: BadgeCheck,
    tone: "primary",
    apply: (f) => ({ ...f, verifiedOnly: true, page: undefined }),
    remove: (f) => ({ ...f, verifiedOnly: undefined, page: undefined }),
    isActive: (f) => Boolean(f.verifiedOnly),
  },
  {
    id: "low-budget",
    label: "Bajo $150k",
    icon: Wallet,
    tone: "accent",
    apply: (f) => ({ ...f, priceMax: 150_000, page: undefined }),
    remove: (f) => ({ ...f, priceMax: undefined, page: undefined }),
    isActive: (f) => f.priceMax === 150_000,
  },
  {
    id: "face-visible",
    label: "Cara visible",
    icon: Eye,
    tone: "primary",
    apply: (f) => ({ ...f, faceVisible: true, page: undefined }),
    remove: (f) => ({ ...f, faceVisible: undefined, page: undefined }),
    isActive: (f) => Boolean(f.faceVisible),
  },
  {
    id: "top-rated",
    label: "Top calificadas",
    icon: Star,
    tone: "accent",
    apply: (f) => ({
      ...f,
      sortBy: "rating",
      withReviews: true,
      page: undefined,
    }),
    remove: (f) => ({
      ...f,
      sortBy: f.sortBy === "rating" ? undefined : f.sortBy,
      withReviews: undefined,
      page: undefined,
    }),
    isActive: (f) => f.sortBy === "rating" && Boolean(f.withReviews),
  },
  {
    id: "with-video",
    label: "Con video",
    icon: Video,
    tone: "primary",
    apply: (f) => ({ ...f, withVideo: true, page: undefined }),
    remove: (f) => ({ ...f, withVideo: undefined, page: undefined }),
    isActive: (f) => Boolean(f.withVideo),
  },
];

function presetHref(
  next: ListingsFilters,
  view: CatalogView | undefined,
): string {
  const params = encodeFilters(next);
  if (view && view !== "grid3") params.set("view", view);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

const TONE_INACTIVE: Record<NonNullable<Preset["tone"]>, string> = {
  primary:
    "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]",
  accent:
    "bg-[var(--color-brand-accent)]/15 text-[var(--color-brand-accent-strong)]",
  highlight:
    "bg-[var(--color-brand-highlight)]/12 text-[var(--color-brand-highlight)]",
};

const TONE_ACTIVE: Record<NonNullable<Preset["tone"]>, string> = {
  primary: "bg-[var(--color-brand-primary)] text-[var(--color-surface)]",
  accent: "bg-[var(--color-brand-accent-strong)] text-[var(--color-surface)]",
  highlight: "bg-[var(--color-brand-highlight)] text-[var(--color-surface)]",
};

/**
 * One-tap preset row that lives between the search bar and the advanced
 * filters panel. Each chip toggles a curated multi-filter combo. Active
 * presets render in a filled tone; inactive presets show the soft icon
 * tile so the row stays scannable at a glance.
 *
 * Server Component — every chip is a stable `Link` so navigation reuses
 * the existing GET-form catalog flow with no client JS cost.
 */
export function QuickPresets({ filters, view }: QuickPresetsProps) {
  return (
    <section
      aria-label="Sugerencias rápidas"
      className="bg-[var(--color-background)]"
    >
      <Container width="wide" className="py-3 sm:py-4">
        <div className="flex items-start gap-3 sm:items-center">
          <span
            aria-hidden
            className="hidden shrink-0 items-center gap-2 rounded-full bg-[var(--color-surface)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)] sm:inline-flex"
          >
            <Sparkles
              className="h-3 w-3 text-[var(--color-brand-primary)]"
              aria-hidden
            />
            Sugerencias
          </span>
          <ul
            aria-label="Filtros rápidos"
            className="flex flex-1 flex-wrap items-center gap-2"
          >
            {PRESETS.map((preset) => {
              const active = preset.isActive(filters);
              const tone = preset.tone ?? "primary";
              const next = active ? preset.remove(filters) : preset.apply(filters);
              const Icon = preset.icon;
              const iconCls = active ? TONE_ACTIVE[tone] : TONE_INACTIVE[tone];
              const chipCls = active
                ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/8 text-[var(--color-brand-primary)] shadow-[var(--shadow-sm)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)]";
              return (
                <li key={preset.id}>
                  <Link
                    href={presetHref(next, view)}
                    aria-pressed={active}
                    aria-label={
                      active
                        ? `Quitar preset: ${preset.label}`
                        : `Aplicar preset: ${preset.label}`
                    }
                    className={`group inline-flex h-10 items-center gap-2 rounded-full border pl-1.5 pr-4 text-[13px] font-semibold tracking-tight transition-[border-color,background,color,box-shadow] duration-200 ease-[var(--ease-standard)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${chipCls}`}
                  >
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-200 ${iconCls}`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    {preset.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </section>
  );
}
