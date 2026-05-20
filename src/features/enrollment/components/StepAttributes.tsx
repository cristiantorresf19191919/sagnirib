"use client";

import type { AppearanceCatalogs } from "../lib/catalogs";
import type { AttributesValues } from "../lib/types";
import { ChipChoice } from "./FormField";
import { SectionShell } from "./SectionShell";

/**
 * Step 3 of the publish wizard.
 *
 * Captures the seven appearance attributes ([[firebase-data-ownership]]:
 * `attributes.{ethnicity,hair,height,body,breast,pubis,country}`) and the
 * spoken-language list. All seven appearance fields are required by the
 * wizard; without them the public profile renders "—" for every characteristic
 * (the previous state of the world).
 *
 * Each appearance field is a single-choice chip group seeded from the
 * canonical `APPEARANCE_CATALOG` constant — same source the catalog filters
 * use, so a modelo's selection always maps to a valid filter chip downstream.
 */

interface StepAttributesProps {
  values: AttributesValues;
  catalogs: {
    appearance: AppearanceCatalogs;
    languages: ReadonlyArray<string>;
  };
  onChange: (next: AttributesValues) => void;
}

type AppearanceKey = keyof AppearanceCatalogs;

const APPEARANCE_FIELDS: ReadonlyArray<{
  key: AppearanceKey;
  label: string;
  hint?: string;
}> = [
  { key: "country", label: "País", hint: "Tu nacionalidad — aparece como filtro." },
  { key: "ethnicity", label: "Etnia" },
  { key: "hair", label: "Cabello" },
  { key: "height", label: "Estatura" },
  { key: "body", label: "Cuerpo" },
  { key: "breast", label: "Senos" },
  {
    key: "pubis",
    label: "Pubis",
    hint: "Opcional para el catálogo público; usado solo en filtros de búsqueda.",
  },
];

export function StepAttributes({ values, catalogs, onChange }: StepAttributesProps) {
  function setSingle(key: AppearanceKey, value: string) {
    // Toggle semantics: click the active chip to clear (lets the modelo
    // change her mind without an extra "limpiar" affordance).
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
      eyebrow="Características"
      title="Cómo te describirás físicamente"
      description="Estos datos se muestran como bloque de Características en tu perfil público y alimentan los filtros del catálogo. Elige la opción que más se acerque."
    >
      {APPEARANCE_FIELDS.map((field) => (
        <fieldset key={field.key} className="flex flex-col gap-2">
          <legend className="text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
            {field.label}
          </legend>
          {field.hint && (
            <p className="text-[11px] text-[var(--color-text-subtle)]">
              {field.hint}
            </p>
          )}
          <div className="mt-1 flex flex-wrap gap-2">
            {catalogs.appearance[field.key].map((option) => (
              <ChipChoice
                key={option}
                label={option}
                active={values[field.key] === option}
                onClick={() => setSingle(field.key, option)}
              />
            ))}
          </div>
        </fieldset>
      ))}

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
          Idiomas
        </legend>
        <p className="text-[11px] text-[var(--color-text-subtle)]">
          Selecciona los idiomas en los que puedes atender. Opcional.
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
