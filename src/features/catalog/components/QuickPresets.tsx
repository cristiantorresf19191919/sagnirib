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

import { readLocale } from "@/core/i18n/locale";
import { t } from "@/core/i18n/messages";
import type { ListingsFilters } from "@/server/biringas";
import { Container } from "@/shared/design-system/components/Container";

import { encodeFilters, type CatalogView } from "../lib/parse-filters";

interface QuickPresetsProps {
  filters: ListingsFilters;
  view?: CatalogView;
}

interface Preset {
  id: string;
  i18nKey: string;
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
    i18nKey: "presets.availableNow",
    icon: Flame,
    tone: "highlight",
    apply: (f) => ({ ...f, availableNow: true, page: undefined }),
    remove: (f) => ({ ...f, availableNow: undefined, page: undefined }),
    isActive: (f) => Boolean(f.availableNow),
  },
  {
    id: "verified",
    i18nKey: "presets.verified",
    icon: BadgeCheck,
    tone: "primary",
    apply: (f) => ({ ...f, verifiedOnly: true, page: undefined }),
    remove: (f) => ({ ...f, verifiedOnly: undefined, page: undefined }),
    isActive: (f) => Boolean(f.verifiedOnly),
  },
  {
    id: "low-budget",
    i18nKey: "presets.affordable",
    icon: Wallet,
    tone: "accent",
    apply: (f) => ({ ...f, priceMax: 150_000, page: undefined }),
    remove: (f) => ({ ...f, priceMax: undefined, page: undefined }),
    isActive: (f) => f.priceMax === 150_000,
  },
  {
    id: "face-visible",
    i18nKey: "presets.faceVisible",
    icon: Eye,
    tone: "primary",
    apply: (f) => ({ ...f, faceVisible: true, page: undefined }),
    remove: (f) => ({ ...f, faceVisible: undefined, page: undefined }),
    isActive: (f) => Boolean(f.faceVisible),
  },
  {
    id: "top-rated",
    i18nKey: "presets.topRated",
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
    i18nKey: "presets.withVideo",
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
  return qs ? `/explorar?${qs}` : "/explorar";
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
export async function QuickPresets({ filters, view }: QuickPresetsProps) {
  const locale = await readLocale();
  return (
    <section
      data-testid="quick-presets"
      aria-label={t(locale, "presets.title")}
      className="bg-[var(--color-background)]"
    >
      <Container width="wide" className="py-3 sm:py-4">
        <div className="flex items-center gap-2.5 md:gap-3">
          {/* Sugerencias eyebrow chip — full h-11 with gold-sparkle icon
              disc. Stays pinned to the left while the chip row scrolls. */}
          <span
            aria-hidden
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[var(--color-surface)] pl-1.5 pr-3.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)]"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-gold)]/20 via-[var(--color-gold)]/10 to-[var(--color-cream)] text-[var(--color-gold-deep)] ring-1 ring-[var(--color-gold)]/30">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="hidden md:inline">
              {t(locale, "presets.shortTitle")}
            </span>
          </span>
          {/* Horizontal scroll on mobile — preserves Hick's-law style
              single-row scan instead of letting 6+ chips wrap into a
              chaotic 3-row stack at narrow widths. `flex-wrap` returns
              at md+ where there's room. Scrollbar visually hidden; the
              right-edge fade hints there's more to swipe. */}
          <div className="relative min-w-0 flex-1">
            <ul
              data-testid="quick-presets-list"
              aria-label={t(locale, "presets.listAria")}
              className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] md:flex-wrap md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden"
            >
            {PRESETS.map((preset) => {
              const active = preset.isActive(filters);
              const tone = preset.tone ?? "primary";
              const next = active ? preset.remove(filters) : preset.apply(filters);
              const Icon = preset.icon;
              const label = t(locale, preset.i18nKey);
              const iconCls = active ? TONE_ACTIVE[tone] : TONE_INACTIVE[tone];
              const chipCls = active
                ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/8 text-[var(--color-brand-primary)] shadow-[var(--shadow-sm)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)]";
              return (
                <li key={preset.id} data-testid={`quick-preset-${preset.id}`}>
                  <Link
                    href={presetHref(next, view)}
                    aria-pressed={active}
                    aria-label={t(
                      locale,
                      active ? "presets.removeAria" : "presets.applyAria",
                      { label },
                    )}
                    className={`group inline-flex h-11 items-center gap-2 rounded-full border pl-1.5 pr-4 text-[13px] font-semibold tracking-tight transition-[border-color,background,color,box-shadow] duration-200 ease-[var(--ease-standard)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${chipCls}`}
                  >
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-200 ${iconCls}`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    {label}
                  </Link>
                </li>
              );
            })}
            </ul>
            {/* Right-edge gradient fade — only on mobile, signals more to
                swipe. Pointer-events:none so it never blocks taps. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[var(--color-background)] to-transparent md:hidden"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
