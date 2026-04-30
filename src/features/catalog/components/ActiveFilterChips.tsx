import Link from "next/link";
import {
  CalendarDays,
  Coins,
  CreditCard,
  Eraser,
  Eye,
  Heart,
  MapPin,
  MessageSquare,
  Mic,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  UserSquare,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { ListingsFilters } from "@/server/biringas";
import { FadeIn } from "@/shared/motion/FadeIn";

import { encodeFilters } from "../lib/parse-filters";

interface ActiveFilterChipsProps {
  filters: ListingsFilters;
}

/**
 * Categorical tone for an active chip. Drives bg/border/text/icon colors so a
 * glance at the chip strip already conveys *what kind* of filter is active.
 */
type ChipTone =
  | "primary"
  | "accent"
  | "secondary"
  | "highlight"
  | "neutral";

interface ActiveChip {
  /** Stable key for React. */
  key: string;
  /** Human-readable label rendered inside the chip. */
  label: string;
  /** Categorical tint. */
  tone: ChipTone;
  /** Leading icon — kept small and consistent across chips. */
  icon: LucideIcon;
  /** Filters object MINUS this filter — the URL the chip's X navigates to. */
  next: ListingsFilters;
}

const PRICE_FORMAT = new Intl.NumberFormat("es-CO");

const TONE_CLASS: Record<ChipTone, string> = {
  // Forest green — verified content, services, "trust" filters.
  primary:
    "border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] hover:border-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/15",
  // Honey gold — money + special / luxury services.
  accent:
    "border-[var(--color-brand-warn)]/40 bg-[var(--color-brand-warn)]/12 text-[var(--color-brand-accent-strong)] hover:border-[var(--color-brand-warn)] hover:bg-[var(--color-brand-warn)]/20",
  // Sage green — neutral signal: age, contact channels, places, media flags.
  secondary:
    "border-[var(--color-brand-secondary)]/35 bg-[var(--color-brand-secondary)]/12 text-[var(--color-brand-secondary-strong)] hover:border-[var(--color-brand-secondary)] hover:bg-[var(--color-brand-secondary)]/18",
  // Brand red — heart-tier intent: who they attend, hot signals, live now.
  highlight:
    "border-[var(--color-brand-highlight)]/35 bg-[var(--color-brand-highlight)]/10 text-[var(--color-brand-highlight)] hover:border-[var(--color-brand-highlight)] hover:bg-[var(--color-brand-highlight)]/15",
  // Cool neutral — appearance attributes (country, hair, etc.).
  neutral:
    "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:border-[var(--color-brand-primary-soft)] hover:text-[var(--color-foreground)]",
};

/**
 * Builds the list of currently-applied filters as removable chips. Clicking
 * the X on a chip navigates to a URL where that single filter has been
 * cleared, preserving every other active filter.
 */
function buildChips(filters: ListingsFilters): Array<ActiveChip> {
  const chips: Array<ActiveChip> = [];

  const without = (mutator: (f: ListingsFilters) => void): ListingsFilters => {
    const copy: ListingsFilters = { ...filters, page: undefined };
    mutator(copy);
    return copy;
  };

  const withoutMulti = (
    key: keyof ListingsFilters,
    value: string,
  ): ListingsFilters => {
    const copy: ListingsFilters = { ...filters, page: undefined };
    const arr = filters[key] as ReadonlyArray<string> | undefined;
    if (arr) {
      const next = arr.filter((v) => v !== value);
      (copy[key] as unknown) = next.length > 0 ? next : undefined;
    }
    return copy;
  };

  if (filters.priceMin !== undefined) {
    chips.push({
      key: "priceMin",
      label: `Mín. $${PRICE_FORMAT.format(filters.priceMin)}`,
      tone: "accent",
      icon: Coins,
      next: without((f) => {
        f.priceMin = undefined;
      }),
    });
  }
  if (filters.priceMax !== undefined) {
    chips.push({
      key: "priceMax",
      label: `Máx. $${PRICE_FORMAT.format(filters.priceMax)}`,
      tone: "accent",
      icon: Coins,
      next: without((f) => {
        f.priceMax = undefined;
      }),
    });
  }
  if (filters.ageMin !== undefined) {
    chips.push({
      key: "ageMin",
      label: `Edad ≥ ${filters.ageMin}`,
      tone: "secondary",
      icon: CalendarDays,
      next: without((f) => {
        f.ageMin = undefined;
      }),
    });
  }
  if (filters.ageMax !== undefined) {
    chips.push({
      key: "ageMax",
      label: `Edad ≤ ${filters.ageMax}`,
      tone: "secondary",
      icon: CalendarDays,
      next: without((f) => {
        f.ageMax = undefined;
      }),
    });
  }

  const flags: Array<{
    key: keyof ListingsFilters;
    label: string;
    tone: ChipTone;
    icon: LucideIcon;
  }> = [
    { key: "verifiedOnly", label: "Verificadas", tone: "primary", icon: ShieldCheck },
    { key: "faceVisible", label: "Cara visible", tone: "primary", icon: Eye },
    { key: "withVideo", label: "Con vídeo", tone: "secondary", icon: Play },
    { key: "withAudio", label: "Con audio", tone: "secondary", icon: Mic },
    { key: "withReviews", label: "Con experiencias", tone: "highlight", icon: MessageSquare },
    { key: "paymentByCard", label: "Pago con tarjeta", tone: "accent", icon: CreditCard },
    { key: "availableNow", label: "Disponible ahora", tone: "highlight", icon: Zap },
  ];
  for (const { key, label, tone, icon } of flags) {
    if (filters[key]) {
      chips.push({
        key: String(key),
        label,
        tone,
        icon,
        next: without((f) => {
          (f[key] as unknown) = undefined;
        }),
      });
    }
  }

  filters.attention?.forEach((v) =>
    chips.push({
      key: `attention-${v}`,
      label: `Atención: ${v}`,
      tone: "highlight",
      icon: Heart,
      next: withoutMulti("attention", v),
    }),
  );
  filters.contactChannels?.forEach((v) =>
    chips.push({
      key: `contact-${v}`,
      label: `Contacto: ${v}`,
      tone: "secondary",
      icon: MessageSquare,
      next: withoutMulti("contactChannels", v),
    }),
  );
  filters.services?.forEach((v) =>
    chips.push({
      key: `service-${v}`,
      label: v,
      tone: "primary",
      icon: Sparkles,
      next: withoutMulti("services", v),
    }),
  );
  filters.specialServices?.forEach((v) =>
    chips.push({
      key: `special-${v}`,
      label: v,
      tone: "accent",
      icon: Star,
      next: withoutMulti("specialServices", v),
    }),
  );
  filters.meetingContexts?.forEach((v) =>
    chips.push({
      key: `place-${v}`,
      label: v,
      tone: "secondary",
      icon: MapPin,
      next: withoutMulti("meetingContexts", v),
    }),
  );

  if (filters.attributes) {
    for (const [attrKey, values] of Object.entries(filters.attributes)) {
      values.forEach((v) =>
        chips.push({
          key: `attr-${attrKey}-${v}`,
          label: v,
          tone: "neutral",
          icon: UserSquare,
          next: {
            ...filters,
            page: undefined,
            attributes: (() => {
              const nextAttrs: Record<string, ReadonlyArray<string>> = {
                ...filters.attributes,
              };
              const remaining = values.filter((x) => x !== v);
              if (remaining.length > 0) nextAttrs[attrKey] = remaining;
              else delete nextAttrs[attrKey];
              return Object.keys(nextAttrs).length > 0 ? nextAttrs : undefined;
            })(),
          },
        }),
      );
    }
  }

  return chips;
}

function chipHref(next: ListingsFilters): string {
  const qs = encodeFilters(next).toString();
  return qs.length > 0 ? `/?${qs}` : "/";
}

const CHIP_BASE =
  "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium shadow-[var(--shadow-sm)] transition-[background,border-color,color,transform,box-shadow] duration-150 ease-[var(--ease-standard)] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]";

/**
 * Inline summary of every active filter rendered as a removable chip strip.
 * Each chip is colour-coded by category (price=gold, age=sage, attention=red,
 * services=green, …) with a leading icon so users can scan the strip without
 * reading the labels. Renders nothing when no filters are applied.
 */
export function ActiveFilterChips({ filters }: ActiveFilterChipsProps) {
  const chips = buildChips(filters);
  if (chips.length === 0) return null;

  return (
    <FadeIn>
      <ul
        aria-label="Filtros aplicados"
        className="flex flex-wrap items-center gap-1.5"
      >
        {chips.map((chip) => {
          const Icon = chip.icon;
          return (
            <li key={chip.key}>
              <Link
                href={chipHref(chip.next)}
                aria-label={`Quitar filtro: ${chip.label}`}
                className={`${CHIP_BASE} ${TONE_CLASS[chip.tone]}`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {chip.label}
                <X
                  className="h-3 w-3 shrink-0 opacity-70 transition-transform duration-150 group-hover:rotate-90 group-hover:opacity-100"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
        <li>
          <Link
            href="/"
            aria-label="Borrar todos los filtros"
            className="group inline-flex items-center gap-1.5 rounded-full border border-dashed border-[var(--color-border)] bg-transparent px-3 py-1 text-xs font-medium text-[var(--color-text-subtle)] transition-[border-color,color,background] duration-150 ease-[var(--ease-standard)] hover:border-[var(--color-brand-highlight)]/55 hover:bg-[var(--color-brand-highlight)]/8 hover:text-[var(--color-brand-highlight)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-highlight)]"
          >
            <Eraser className="h-3.5 w-3.5 shrink-0 transition-transform duration-150 group-hover:-rotate-12" aria-hidden />
            Borrar todo
          </Link>
        </li>
      </ul>
    </FadeIn>
  );
}
