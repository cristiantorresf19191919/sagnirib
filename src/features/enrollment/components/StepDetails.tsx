"use client";

import { useState } from "react";

import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";

import type { EnrollmentCatalogs } from "../lib/catalogs";
import type { DetailsValues } from "../lib/types";
import {
  ChipChoice,
  PillToggle,
  SelectField,
  TextField,
} from "./FormField";
import { SectionShell } from "./SectionShell";

interface StepDetailsProps {
  values: DetailsValues;
  catalogs: Pick<EnrollmentCatalogs, "cities" | "attention" | "contact">;
  onChange: (next: DetailsValues) => void;
  forceShowErrors: boolean;
}

const CATEGORY_IDS = ["prepagos", "masajes", "videollamadas"] as const;

export function StepDetails({ values, catalogs, onChange, forceShowErrors }: StepDetailsProps) {
  const locale = useActiveLocale();
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());

  function touch(name: string) {
    setTouched((prev) => new Set([...prev, name]));
  }

  function show(name: string): boolean {
    return forceShowErrors || touched.has(name);
  }

  function update<K extends keyof DetailsValues>(key: K, value: DetailsValues[K]) {
    onChange({ ...values, [key]: value });
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

  return (
    <SectionShell
      eyebrow={t(locale, "step.details.eyebrow")}
      title={t(locale, "step.details.title")}
      description={t(locale, "step.details.description")}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          label={t(locale, "step.details.field.displayName")}
          name="displayName"
          required
          maxLength={40}
          placeholder={t(locale, "step.details.field.displayName.placeholder")}
          value={values.displayName}
          onChange={(e) => update("displayName", e.target.value)}
          onBlur={() => touch("displayName")}
          hint={t(locale, "step.details.field.displayName.hint")}
          error={show("displayName") ? errors.displayName : undefined}
        />
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

        <SelectField
          label={t(locale, "step.details.field.city")}
          name="city"
          required
          value={values.city}
          onChange={(e) => update("city", e.target.value)}
          onBlur={() => touch("city")}
          error={show("city") ? errors.city : undefined}
        >
          <option value="">
            {t(locale, "step.details.field.city.placeholder")}
          </option>
          {catalogs.cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </SelectField>

        <SelectField
          label={t(locale, "step.details.field.category")}
          name="category"
          required
          value={values.category}
          onChange={(e) =>
            update("category", e.target.value as DetailsValues["category"])
          }
          onBlur={() => touch("category")}
          hint={t(locale, "step.details.field.category.hint")}
          error={show("category") ? errors.category : undefined}
        >
          <option value="">
            {t(locale, "step.details.field.category.placeholder")}
          </option>
          {CATEGORY_IDS.map((id) => (
            <option key={id} value={id}>
              {t(locale, `step.details.category.${id}`)}
            </option>
          ))}
        </SelectField>

        <TextField
          label={t(locale, "step.details.field.price")}
          name="pricePerHour"
          type="number"
          inputMode="numeric"
          min={0}
          step={10000}
          required
          placeholder={t(locale, "step.details.field.price.placeholder")}
          value={values.pricePerHour}
          onChange={(e) => update("pricePerHour", e.target.value)}
          onBlur={() => touch("pricePerHour")}
          hint={t(locale, "step.details.field.price.hint")}
          error={show("pricePerHour") ? errors.pricePerHour : undefined}
        />
        <TextField
          label={t(locale, "step.details.field.slug")}
          name="preferredSlug"
          required
          placeholder={t(locale, "step.details.field.slug.placeholder")}
          value={values.preferredSlug}
          onChange={(e) =>
            update(
              "preferredSlug",
              e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9-]+/g, "-")
                .replace(/-{2,}/g, "-"),
            )
          }
          onBlur={() => touch("preferredSlug")}
          hint={t(locale, "step.details.field.slug.hint")}
          error={show("preferredSlug") ? errors.preferredSlug : undefined}
        />

        <TextField
          label={t(locale, "step.details.field.phone")}
          name="phone"
          type="tel"
          inputMode="tel"
          required
          placeholder={t(locale, "step.details.field.phone.placeholder")}
          value={values.phone}
          onChange={(e) => update("phone", e.target.value)}
          onBlur={() => touch("phone")}
          hint={t(locale, "step.details.field.phone.hint")}
          error={show("phone") ? errors.phone : undefined}
          className="md:col-span-2"
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
