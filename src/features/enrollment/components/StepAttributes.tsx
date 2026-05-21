"use client";

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
}

type AppearanceKey = keyof AppearanceCatalogs;

const APPEARANCE_FIELDS: ReadonlyArray<AppearanceKey> = [
  "country",
  "ethnicity",
  "hair",
  "height",
  "body",
  "breast",
  "pubis",
];

const FIELDS_WITH_HINT: ReadonlySet<AppearanceKey> = new Set(["country", "pubis"]);

export function StepAttributes({ values, catalogs, onChange }: StepAttributesProps) {
  const locale = useActiveLocale();

  function setSingle(key: AppearanceKey, value: string) {
    onChange({ ...values, [key]: values[key] === value ? "" : value });
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

  return (
    <SectionShell
      eyebrow={t(locale, "step.attributes.eyebrow")}
      title={t(locale, "step.attributes.title")}
      description={t(locale, "step.attributes.description")}
    >
      {APPEARANCE_FIELDS.map((key) => (
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
        </fieldset>
      ))}

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
