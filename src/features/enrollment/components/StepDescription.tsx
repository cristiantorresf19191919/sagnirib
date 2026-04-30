"use client";

import { ImagePlus, X } from "lucide-react";

import type { EnrollmentCatalogs } from "../lib/catalogs";
import type { DescriptionValues } from "../lib/types";
import { ChipChoice, TextAreaField, ToggleSwitch } from "./FormField";
import { SectionShell } from "./SectionShell";

interface StepDescriptionProps {
  values: DescriptionValues;
  catalogs: Pick<EnrollmentCatalogs, "services" | "meetingContexts">;
  onChange: (next: DescriptionValues) => void;
}

export function StepDescription({
  values,
  catalogs,
  onChange,
}: StepDescriptionProps) {
  function update<K extends keyof DescriptionValues>(
    key: K,
    value: DescriptionValues[K],
  ) {
    onChange({ ...values, [key]: value });
  }

  function toggleService(s: string) {
    const has = values.services.includes(s);
    update(
      "services",
      has ? values.services.filter((x) => x !== s) : [...values.services, s],
    );
  }
  function togglePlace(p: string) {
    const has = values.meetingContexts.includes(p);
    update(
      "meetingContexts",
      has
        ? values.meetingContexts.filter((x) => x !== p)
        : [...values.meetingContexts, p],
    );
  }

  function addMockFile() {
    if (values.galleryFileNames.length >= 12) return;
    const next = `foto-${values.galleryFileNames.length + 1}.jpg`;
    update("galleryFileNames", [...values.galleryFileNames, next]);
  }

  function removeFile(name: string) {
    update(
      "galleryFileNames",
      values.galleryFileNames.filter((x) => x !== name),
    );
  }

  return (
    <SectionShell
      eyebrow="Tu historia"
      title="Lo que leerán y verán los visitantes"
      description="Una descripción honesta y unas buenas fotos triplican la respuesta. Tómate el tiempo aquí."
    >
      <TextAreaField
        label="Descripción corta"
        name="shortBio"
        rows={2}
        maxLength={120}
        placeholder="Una frase que te describa. Aparece debajo de tu foto principal."
        value={values.shortBio}
        onChange={(e) => update("shortBio", e.target.value)}
        hint={`${values.shortBio.length} / 120 caracteres`}
      />
      <TextAreaField
        label="Sobre ti"
        name="bio"
        rows={6}
        maxLength={1200}
        placeholder="Cuenta quién eres, qué disfrutas, cómo es la experiencia contigo. Sin información de contacto — la añadimos en el siguiente paso."
        value={values.bio}
        onChange={(e) => update("bio", e.target.value)}
        hint={`${values.bio.length} / 1200 caracteres · evita números de teléfono y enlaces externos.`}
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
          Servicios incluidos
        </legend>
        <p className="text-[11px] text-[var(--color-text-subtle)]">
          Selecciona los servicios que ofreces. Aparecen como chips en tu
          perfil y se conectan con los filtros del catálogo.
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          {catalogs.services.map((service) => (
            <ChipChoice
              key={service}
              label={service}
              active={values.services.includes(service)}
              onClick={() => toggleService(service)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
          Lugar de encuentro
        </legend>
        <p className="text-[11px] text-[var(--color-text-subtle)]">
          Dónde aceptas reunirte. Mostrado como filtro de búsqueda.
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          {catalogs.meetingContexts.map((place) => (
            <ChipChoice
              key={place}
              label={place}
              active={values.meetingContexts.includes(place)}
              onClick={() => togglePlace(place)}
            />
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 md:grid-cols-3">
        <ToggleSwitch
          label="Cara visible"
          description="Indica que muestras el rostro en al menos una foto."
          checked={values.faceVisible}
          onChange={(v) => update("faceVisible", v)}
        />
        <ToggleSwitch
          label="Pago con tarjeta"
          description="Tu perfil aparece en el filtro de tarjetas aceptadas."
          checked={values.paymentByCard}
          onChange={(v) => update("paymentByCard", v)}
        />
        <ToggleSwitch
          label="Disponible ahora"
          description="Activa esto cuando estés disponible — aparece como urgente."
          checked={values.availableNow}
          onChange={(v) => update("availableNow", v)}
        />
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
          Galería de fotos
        </span>
        <p className="text-[11px] text-[var(--color-text-subtle)]">
          Subir hasta 12 fotos en JPG/PNG. La primera es la portada del
          catálogo. Las fotos pasan por una revisión de consentimiento antes de
          publicarse.
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {values.galleryFileNames.map((name) => (
            <div
              key={name}
              className="group relative aspect-[3/4] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]"
            >
              <span className="absolute inset-0 flex items-center justify-center px-2 text-center text-[11px] font-medium text-[var(--color-text-muted)]">
                {name}
              </span>
              <button
                type="button"
                onClick={() => removeFile(name)}
                aria-label={`Quitar ${name}`}
                className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-foreground)]/80 text-[var(--color-surface)] opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addMockFile}
            className="flex aspect-[3/4] flex-col items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-background-elevated)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
            aria-label="Agregar foto"
            disabled={values.galleryFileNames.length >= 12}
          >
            <ImagePlus className="h-5 w-5" aria-hidden />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
              Subir foto
            </span>
          </button>
        </div>
      </div>
    </SectionShell>
  );
}
