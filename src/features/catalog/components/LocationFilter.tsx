"use client";

import { useRouter } from "next/navigation";

import type { ListingsFilters } from "@/server/biringas";

import { encodeFilters } from "../lib/encode-filters";

interface LocationCity {
  name: string;
  localities: ReadonlyArray<string>;
}
interface LocationDepartment {
  name: string;
  cities: ReadonlyArray<LocationCity>;
}

interface LocationFilterLabels {
  department: string;
  city: string;
  locality: string;
  departmentAll: string;
  cityAll: string;
  localityAll: string;
}

interface LocationFilterProps {
  filters: ListingsFilters;
  locations: ReadonlyArray<LocationDepartment>;
  /** Localized base path, e.g. `/es/explorar`. */
  basePath: string;
  view?: string;
  defaultView: string;
  labels: LocationFilterLabels;
}

/**
 * Cascading location filter for the catalog toolbar: Department → City →
 * Locality. Each change navigates immediately to the filtered URL (the catalog
 * is server-rendered from `searchParams`), so there's no submit step. The
 * department is derived for display when only a city is active, keeping the
 * three dropdowns coherent. Locality only appears when the city has zones.
 */
export function LocationFilter({
  filters,
  locations,
  basePath,
  view,
  defaultView,
  labels,
}: LocationFilterProps) {
  const router = useRouter();

  const department =
    filters.department ??
    locations.find((d) => d.cities.some((c) => c.name === filters.city))?.name ??
    "";
  const cities = locations.find((d) => d.name === department)?.cities ?? [];
  const localities =
    cities.find((c) => c.name === filters.city)?.localities ?? [];

  function go(next: ListingsFilters) {
    const params = encodeFilters({ ...next, page: undefined });
    if (view && view !== defaultView) params.set("view", view);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
      <LocSelect
        ariaLabel={labels.department}
        value={department}
        onChange={(value) =>
          go({
            ...filters,
            department: value || undefined,
            city: undefined,
            locality: undefined,
          })
        }
      >
        <option value="">{labels.departmentAll}</option>
        {locations.map((d) => (
          <option key={d.name} value={d.name}>
            {d.name}
          </option>
        ))}
      </LocSelect>

      <LocSelect
        ariaLabel={labels.city}
        value={filters.city ?? ""}
        disabled={!department}
        onChange={(value) =>
          go({ ...filters, city: value || undefined, locality: undefined })
        }
      >
        <option value="">{labels.cityAll}</option>
        {cities.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name}
          </option>
        ))}
      </LocSelect>

      {localities.length > 0 && (
        <LocSelect
          ariaLabel={labels.locality}
          value={filters.locality ?? ""}
          onChange={(value) => go({ ...filters, locality: value || undefined })}
        >
          <option value="">{labels.localityAll}</option>
          {localities.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </LocSelect>
      )}
    </div>
  );
}

function LocSelect({
  ariaLabel,
  value,
  onChange,
  disabled,
  children,
}: {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className="group relative sm:w-[180px] sm:shrink-0">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full ring-0 ring-[var(--color-brand-primary)]/0 transition-[box-shadow] duration-300 ease-[var(--ease-standard)] group-focus-within:ring-4 group-focus-within:ring-[var(--color-brand-primary)]/15"
      />
      <select
        aria-label={ariaLabel}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="relative h-12 w-full appearance-none rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] pl-5 pr-10 text-sm text-[var(--color-foreground)] transition-colors duration-200 hover:border-[var(--color-brand-primary-soft)] focus:border-[var(--color-brand-primary)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {children}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)]"
      >
        ▾
      </span>
    </span>
  );
}
