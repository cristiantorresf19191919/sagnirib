"use client";

import { useState } from "react";

import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";

import type { AppearanceCatalogs } from "../lib/catalogs";
import type { AttributesValues } from "../lib/types";
import { ChipChoice } from "./FormField";
import { SectionShell } from "./SectionShell";

interface StepAttributesProps {
  values: AttributesValues;
  catalogs: {
    appearance: AppearanceCatalogs;
    languages: ReadonlyArray<string>;
  };
  onChange: (next: AttributesValues) => void;
  forceShowErrors: boolean;
}

type AppearanceKey = keyof AppearanceCatalogs;

const REQUIRED_FIELDS: ReadonlySet<AppearanceKey> = new Set([
  "country",
  "ethnicity",
  "hair",
  "height",
  "body",
  "breastSize",
  "breastType",
]);

const FIELDS_WITH_HINT: ReadonlySet<AppearanceKey> = new Set(["country", "pubis"]);

export function StepAttributes({ values, catalogs, onChange, forceShowErrors }: StepAttributesProps) {
  const locale = useActiveLocale();
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());

  function touch(name: string) {
    setTouched((prev) => new Set([...prev, name]));
  }

  function show(name: string): boolean {
    return forceShowErrors || touched.has(name);
  }

  function setSingle(key: AppearanceKey, value: string) {
    const next = values[key] === value ? "" : value;
    onChange({ ...values, [key]: next });
    // Touch immediately when the user deselects back to empty
    if (next === "" && REQUIRED_FIELDS.has(key)) touch(key);
  }

  function toggleLanguage(lang: string) {
    const has = values.languages.includes(lang);
    onChange({
      ...values,
      languages: has
        ? values.languages.filter((x) => x !== lang)
        : [...values.languages, lang],
    });
  }

  const v = (key: string) => t(locale, key);

  /** Renders one single-select appearance field (legend + chips + error). */
  function field(key: AppearanceKey) {
    const fieldError =
      REQUIRED_FIELDS.has(key) && !values[key]
        ? v(`publicar.validation.${key}`)
        : undefined;

    return (
      <fieldset key={key} className="flex flex-col gap-2">
        <legend className="text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
          {t(locale, `step.attributes.${key}.label`)}
        </legend>
        {FIELDS_WITH_HINT.has(key) && (
          <p className="text-[11px] text-[var(--color-text-subtle)]">
            {t(locale, `step.attributes.${key}.hint`)}
          </p>
        )}
        <div className="mt-1 flex flex-wrap gap-2">
          {catalogs.appearance[key].map((option) => (
            <ChipChoice
              key={option}
              label={option}
              active={values[key] === option}
              onClick={() => setSingle(key, option)}
            />
          ))}
        </div>
        {show(key) && fieldError && (
          <p role="alert" className="text-[11px] text-[var(--color-brand-highlight)]">
            {fieldError}
          </p>
        )}
      </fieldset>
    );
  }

  return (
    <SectionShell
      eyebrow={t(locale, "step.attributes.eyebrow")}
      title={t(locale, "step.attributes.title")}
      description={t(locale, "step.attributes.description")}
    >
      {/* Nationality leads full-width — it's the primary catalog filter. */}
      {field("country")}

      {/* Short single-select fields pair into two columns on desktop so the
          step stays mostly above the fold instead of one tall column. The
          source order lands the logical pairs together: Etnia·Cabello,
          Estatura·Cuerpo, Tamaño·Tipo de senos. */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        {field("ethnicity")}
        {field("hair")}
        {field("height")}
        {field("body")}
        {field("breastSize")}
        {field("breastType")}
      </div>

      {/* Optional section — a labelled divider gives permission to skip the
          rest of the step. Everything below is non-required. */}
      <div className="flex items-center gap-3 pt-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
          {t(locale, "step.attributes.optional.heading")}
        </span>
        <span aria-hidden className="h-px flex-1 bg-[var(--color-border)]" />
      </div>

      {field("pubis")}

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
          {t(locale, "step.attributes.languages.legend")}
        </legend>
        <p className="text-[11px] text-[var(--color-text-subtle)]">
          {t(locale, "step.attributes.languages.hint")}
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          {catalogs.languages.map((lang) => (
            <ChipChoice
              key={lang}
              multi
              label={lang}
              active={values.languages.includes(lang)}
              onClick={() => toggleLanguage(lang)}
            />
          ))}
        </div>
      </fieldset>
    </SectionShell>
  );
}
