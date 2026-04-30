import Link from "next/link";
import { X } from "lucide-react";

import type { ListingsFilters } from "@/server/biringas";

import { encodeFilters } from "../lib/parse-filters";

interface ActiveFilterChipsProps {
  filters: ListingsFilters;
}

interface ActiveChip {
  /** Stable key. */
  key: string;
  /** Human-readable label rendered inside the chip. */
  label: string;
  /** Filters object MINUS this filter — the URL the chip's X navigates to. */
  next: ListingsFilters;
}

const PRICE_FORMAT = new Intl.NumberFormat("es-CO");

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
      next: without((f) => {
        f.priceMin = undefined;
      }),
    });
  }
  if (filters.priceMax !== undefined) {
    chips.push({
      key: "priceMax",
      label: `Máx. $${PRICE_FORMAT.format(filters.priceMax)}`,
      next: without((f) => {
        f.priceMax = undefined;
      }),
    });
  }
  if (filters.ageMin !== undefined) {
    chips.push({
      key: "ageMin",
      label: `Edad ≥ ${filters.ageMin}`,
      next: without((f) => {
        f.ageMin = undefined;
      }),
    });
  }
  if (filters.ageMax !== undefined) {
    chips.push({
      key: "ageMax",
      label: `Edad ≤ ${filters.ageMax}`,
      next: without((f) => {
        f.ageMax = undefined;
      }),
    });
  }

  const flags: Array<[keyof ListingsFilters, string]> = [
    ["verifiedOnly", "Verificadas"],
    ["faceVisible", "Cara visible"],
    ["withVideo", "Con vídeo"],
    ["withAudio", "Con audio"],
    ["withReviews", "Con experiencias"],
    ["paymentByCard", "Pago con tarjeta"],
    ["availableNow", "Disponible ahora"],
  ];
  for (const [key, label] of flags) {
    if (filters[key]) {
      chips.push({
        key: String(key),
        label,
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
      next: withoutMulti("attention", v),
    }),
  );
  filters.contactChannels?.forEach((v) =>
    chips.push({
      key: `contact-${v}`,
      label: `Contacto: ${v}`,
      next: withoutMulti("contactChannels", v),
    }),
  );
  filters.services?.forEach((v) =>
    chips.push({
      key: `service-${v}`,
      label: v,
      next: withoutMulti("services", v),
    }),
  );
  filters.specialServices?.forEach((v) =>
    chips.push({
      key: `special-${v}`,
      label: v,
      next: withoutMulti("specialServices", v),
    }),
  );
  filters.meetingContexts?.forEach((v) =>
    chips.push({
      key: `place-${v}`,
      label: v,
      next: withoutMulti("meetingContexts", v),
    }),
  );

  if (filters.attributes) {
    for (const [attrKey, values] of Object.entries(filters.attributes)) {
      values.forEach((v) =>
        chips.push({
          key: `attr-${attrKey}-${v}`,
          label: v,
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

/**
 * Inline summary of every active filter rendered as a removable chip strip.
 * Renders nothing when no filters are applied. Clicking the X on a chip
 * scopes the URL down to "everything except this filter".
 */
export function ActiveFilterChips({ filters }: ActiveFilterChipsProps) {
  const chips = buildChips(filters);
  if (chips.length === 0) return null;

  return (
    <ul
      aria-label="Filtros aplicados"
      className="flex flex-wrap items-center gap-1.5"
    >
      {chips.map((chip) => (
        <li key={chip.key}>
          <Link
            href={chipHref(chip.next)}
            aria-label={`Quitar filtro: ${chip.label}`}
            className="group inline-flex items-center gap-1.5 rounded-full border border-[var(--color-brand-primary)]/25 bg-[var(--color-brand-primary)]/10 px-3 py-1 text-xs font-medium text-[var(--color-brand-primary)] transition-[background,border-color,color] duration-150 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          >
            {chip.label}
            <X
              className="h-3 w-3 transition-transform duration-150 group-hover:rotate-90"
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
