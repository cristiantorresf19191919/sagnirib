"use client";

import { useState } from "react";
import { Check, Sparkles, Video, Waves } from "lucide-react";

import { formatPhoneCo, formatThousands } from "@/features/biringas/format";
import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";

import type { EnrollmentCatalogs } from "../lib/catalogs";
import { slugifyTitle } from "../lib/slugify";
import type { DetailsValues } from "../lib/types";
import { useSlugAvailability } from "../lib/use-slug-availability";
import {
  ChipChoice,
  PillToggle,
  TextField,
} from "./FormField";
import { LocationCascadeField } from "./LocationCascadeField";
import { SectionShell } from "./SectionShell";

const CATEGORY_ICONS = {
  prepagos: Sparkles,
  masajes: Waves,
  videollamadas: Video,
} as const;

interface StepDetailsProps {
  values: DetailsValues;
  catalogs: Pick<EnrollmentCatalogs, "locations" | "attention" | "contact">;
  onChange: (next: DetailsValues) => void;
  forceShowErrors: boolean;
  /**
   * The slug this draft already owns (edit flow). When the derived slug
   * equals it, the live uniqueness check reports "available" instead of a
   * false self-collision. Omitted in the create flow.
   */
  ownSlug?: string;
}

const CATEGORY_IDS = ["prepagos", "masajes", "videollamadas"] as const;

export function StepDetails({ values, catalogs, onChange, forceShowErrors, ownSlug }: StepDetailsProps) {
  const locale = useActiveLocale();
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());

  // Live, debounced uniqueness check on the slug derived from the title.
  const availability = useSlugAvailability(values.preferredSlug, ownSlug);

  function touch(name: string) {
    setTouched((prev) => new Set([...prev, name]));
  }

  function show(name: string): boolean {
    return forceShowErrors || touched.has(name);
  }

  function update<K extends keyof DetailsValues>(key: K, value: DetailsValues[K]) {
    onChange({ ...values, [key]: value });
  }

  function patch(changes: Partial<DetailsValues>) {
    onChange({ ...values, ...changes });
  }

  function toggleAttention(id: DetailsValues["attention"][number]) {
    const has = values.attention.includes(id);
    update(
      "attention",
      has
        ? values.attention.filter((x) => x !== id)
        : [...values.attention, id],
    );
  }

  function toggleChannel(id: DetailsValues["contactChannels"][number]) {
    const next = values.contactChannels.includes(id)
      ? values.contactChannels.filter((x) => x !== id)
      : [...values.contactChannels, id];
    update("contactChannels", next);
    if (next.length === 0) touch("contactChannels");
  }

  const v = (key: string) => t(locale, key);

  const errors = {
    displayName: !values.displayName.trim() ? v("publicar.validation.displayName") : undefined,
    age: !values.age || Number(values.age) < 18 ? v("publicar.validation.age") : undefined,
    city: !values.city ? v("publicar.validation.city") : undefined,
    category: !values.category ? v("publicar.validation.category") : undefined,
    pricePerHour:
      !values.pricePerHour || Number(values.pricePerHour) <= 0
        ? v("publicar.validation.pricePerHour")
        : undefined,
    preferredSlug: !values.preferredSlug ? v("publicar.validation.preferredSlug") : undefined,
    phone: !values.phone ? v("publicar.validation.phone") : undefined,
    contactChannels:
      values.contactChannels.length === 0 ? v("publicar.validation.contactChannels") : undefined,
  };

  // Inline status shown under the derived URL — colours come from tokens.
  const availabilityView = (() => {
    switch (availability.state) {
      case "checking":
        return {
          text: v("step.details.field.title.availability.checking"),
          tone: "text-[var(--color-text-subtle)]",
        };
      case "available":
        return {
          text: v("step.details.field.title.availability.available"),
          tone: "text-[var(--color-brand-primary)]",
        };
      case "taken":
        return {
          text: v(
            availability.reason === "published"
              ? "step.details.field.title.availability.takenPublished"
              : "step.details.field.title.availability.takenDraft",
          ),
          tone: "text-[var(--color-brand-highlight)]",
        };
      case "error":
        return {
          text: v("step.details.field.title.availability.error"),
          tone: "text-[var(--color-text-subtle)]",
        };
      default:
        return null;
    }
  })();

  return (
    <SectionShell
      eyebrow={t(locale, "step.details.eyebrow")}
      title={t(locale, "step.details.title")}
      description={t(locale, "step.details.description")}
    >
      <div className="grid gap-5 md:grid-cols-2">
        {/* Título — single public field. Replaces the old "Nombre artístico"
            + "URL preferida" pair: the slug is derived live from the title and
            its uniqueness is checked against Firebase with a debounce. */}
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <TextField
            label={t(locale, "step.details.field.title")}
            name="title"
            required
            maxLength={60}
            placeholder={t(locale, "step.details.field.title.placeholder")}
            value={values.displayName}
            onChange={(e) =>
              onChange({
                ...values,
                displayName: e.target.value,
                preferredSlug: slugifyTitle(e.target.value),
              })
            }
            onBlur={() => touch("displayName")}
            hint={t(locale, "step.details.field.title.hint")}
            error={show("displayName") ? errors.displayName : undefined}
          />
          {values.preferredSlug && (
            <p className="flex flex-wrap items-center gap-x-2 text-[11px]">
              <span className="font-mono text-[var(--color-text-muted)]">
                biringas.co/p/{values.preferredSlug}
              </span>
              {availabilityView && (
                <span
                  role="status"
                  aria-live="polite"
                  className={`font-semibold ${availabilityView.tone}`}
                >
                  · {availabilityView.text}
                </span>
              )}
            </p>
          )}
        </div>

        <TextField
          label={t(locale, "step.details.field.age")}
          name="age"
          type="number"
          inputMode="numeric"
          min={18}
          max={70}
          required
          placeholder={t(locale, "step.details.field.age.placeholder")}
          value={values.age}
          onChange={(e) => update("age", e.target.value)}
          onBlur={() => touch("age")}
          hint={t(locale, "step.details.field.age.hint")}
          error={show("age") ? errors.age : undefined}
        />

        {/* Location cascade — one field that walks Departamento → Ciudad →
            Localidad. The department is derived from the city and never
            stored (the listing keeps just city + optional locality). */}
        <LocationCascadeField
          locations={catalogs.locations}
          value={{ city: values.city, locality: values.locality }}
          onChange={(next) => patch({ city: next.city, locality: next.locality })}
          onBlur={() => touch("city")}
          required
          error={show("city") ? errors.city : undefined}
        />

        {/* Categoría — selectable cards instead of a native dropdown. Three
            mutually-exclusive options read at a glance and feel native to the
            brand, and the choice drives where the profile lands in the
            catalog. */}
        <fieldset className="flex flex-col gap-2 md:col-span-2">
          <legend className="text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
            {t(locale, "step.details.field.category")}
          </legend>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {CATEGORY_IDS.map((id) => {
              const Icon = CATEGORY_ICONS[id];
              const active = values.category === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    update("category", id as DetailsValues["category"]);
                    touch("category");
                  }}
                  aria-pressed={active}
                  className={`group relative flex items-center gap-3 overflow-hidden rounded-[var(--radius-md)] border p-3.5 text-left transition-[border-color,background,box-shadow,transform] duration-200 ease-[var(--ease-standard)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${
                    active
                      ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/6 shadow-[var(--shadow-sm)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] hover:-translate-y-[1px] hover:border-[var(--color-brand-primary-soft)]"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                      active
                        ? "bg-[var(--color-brand-primary)] text-[var(--color-surface)]"
                        : "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[var(--color-foreground)]">
                      {t(locale, `step.details.category.${id}`)}
                    </span>
                  </span>
                  {active && (
                    <Check
                      className="h-4 w-4 shrink-0 text-[var(--color-brand-primary)]"
                      aria-hidden
                    />
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] italic leading-relaxed text-[var(--color-text-subtle)]">
            {t(locale, "step.details.field.category.hint")}
          </p>
          {show("category") && errors.category && (
            <p role="alert" className="text-[11px] text-[var(--color-brand-highlight)]">
              {errors.category}
            </p>
          )}
        </fieldset>

        {/* Tarifa — stores raw digits in state, displays grouped with
            Colombian thousand separators (200000 → 200.000). */}
        <TextField
          label={t(locale, "step.details.field.price")}
          name="pricePerHour"
          inputMode="numeric"
          required
          placeholder={t(locale, "step.details.field.price.placeholder")}
          value={values.pricePerHour ? formatThousands(Number(values.pricePerHour)) : ""}
          onChange={(e) => update("pricePerHour", e.target.value.replace(/\D/g, ""))}
          onBlur={() => touch("pricePerHour")}
          hint={t(locale, "step.details.field.price.hint")}
          error={show("pricePerHour") ? errors.pricePerHour : undefined}
        />

        <TextField
          label={t(locale, "step.details.field.phone")}
          name="phone"
          type="tel"
          inputMode="tel"
          required
          placeholder={t(locale, "step.details.field.phone.placeholder")}
          value={formatPhoneCo(values.phone)}
          onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
          onBlur={() => touch("phone")}
          hint={t(locale, "step.details.field.phone.hint")}
          error={show("phone") ? errors.phone : undefined}
        />
      </div>

      <fieldset className="mt-2 flex flex-col gap-2">
        <legend className="text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
          {t(locale, "step.details.attention.legend")}
        </legend>
        <p className="text-[11px] text-[var(--color-text-subtle)]">
          {t(locale, "step.details.attention.hint")}
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          {catalogs.attention.map(({ id, label }) => (
            <ChipChoice
              key={id}
              label={label}
              active={values.attention.includes(id)}
              onClick={() => toggleAttention(id)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
          {t(locale, "step.details.contact.legend")}
        </legend>
        <p className="text-[11px] text-[var(--color-text-subtle)]">
          {t(locale, "step.details.contact.hint")}
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          {catalogs.contact.map(({ id, label }) => (
            <PillToggle
              key={id}
              label={label}
              active={values.contactChannels.includes(id)}
              onClick={() => toggleChannel(id)}
            />
          ))}
        </div>
        {show("contactChannels") && errors.contactChannels && (
          <p role="alert" className="text-[11px] text-[var(--color-brand-highlight)]">
            {errors.contactChannels}
          </p>
        )}
      </fieldset>
    </SectionShell>
  );
}
