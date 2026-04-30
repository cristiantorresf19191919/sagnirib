"use client";

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
}

const CATEGORY_OPTIONS: ReadonlyArray<{
  id: DetailsValues["category"];
  label: string;
}> = [
  { id: "prepagos", label: "Prepagos" },
  { id: "masajes", label: "Masajes" },
  { id: "videollamadas", label: "Videollamadas" },
];

export function StepDetails({ values, catalogs, onChange }: StepDetailsProps) {
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
    const has = values.contactChannels.includes(id);
    update(
      "contactChannels",
      has
        ? values.contactChannels.filter((x) => x !== id)
        : [...values.contactChannels, id],
    );
  }

  return (
    <SectionShell
      eyebrow="Detalles de publicación"
      title="Lo que verán las personas"
      description="Estos datos aparecen en tu tarjeta del catálogo. Puedes editarlos en cualquier momento."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          label="Nombre artístico"
          name="displayName"
          required
          maxLength={40}
          placeholder="Ej. Alma"
          value={values.displayName}
          onChange={(e) => update("displayName", e.target.value)}
          hint="40 caracteres máximo. Es el nombre que verán los visitantes."
        />
        <TextField
          label="Edad"
          name="age"
          type="number"
          inputMode="numeric"
          min={18}
          max={70}
          required
          placeholder="18+"
          value={values.age}
          onChange={(e) => update("age", e.target.value)}
          hint="Solo aceptamos perfiles mayores de 18."
        />

        <SelectField
          label="Ciudad principal"
          name="city"
          required
          value={values.city}
          onChange={(e) => update("city", e.target.value)}
        >
          <option value="">Selecciona una ciudad</option>
          {catalogs.cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Categoría"
          name="category"
          required
          value={values.category}
          onChange={(e) =>
            update("category", e.target.value as DetailsValues["category"])
          }
          hint="Determina dónde aparece tu perfil dentro del catálogo."
        >
          <option value="">Selecciona una categoría</option>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </SelectField>

        <TextField
          label="Tarifa por hora (COP)"
          name="pricePerHour"
          type="number"
          inputMode="numeric"
          min={0}
          step={10000}
          required
          placeholder="200000"
          value={values.pricePerHour}
          onChange={(e) => update("pricePerHour", e.target.value)}
          hint="Esta es la referencia pública. Puedes ofrecer paquetes en tu descripción."
        />
        <TextField
          label="URL preferida"
          name="preferredSlug"
          required
          placeholder="alma-medellin"
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
          hint="Aparecerá como biringas.co/p/tu-url. Sin espacios, solo letras y guiones."
        />

        <TextField
          label="Teléfono privado"
          name="phone"
          type="tel"
          inputMode="tel"
          required
          placeholder="+57 300 000 0000"
          value={values.phone}
          onChange={(e) => update("phone", e.target.value)}
          hint="Privado. Nunca se publica. Lo usamos para verificación y contacto entrante."
          className="md:col-span-2"
        />
      </div>

      <fieldset className="mt-2 flex flex-col gap-2">
        <legend className="text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
          Atención a
        </legend>
        <p className="text-[11px] text-[var(--color-text-subtle)]">
          Selecciona uno o varios. Visible en filtros del catálogo.
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
          Canal de contacto
        </legend>
        <p className="text-[11px] text-[var(--color-text-subtle)]">
          Por dónde aceptas que te contacten al desbloquear tu número.
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
      </fieldset>
    </SectionShell>
  );
}
