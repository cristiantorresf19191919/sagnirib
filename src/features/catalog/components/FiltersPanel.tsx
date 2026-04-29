import Link from "next/link";
import { ChevronDown, Eraser, SlidersHorizontal } from "lucide-react";

import {
  APPEARANCE_CATALOG,
  ATTENTION_CATALOG,
  CONTACT_CATALOG,
  MEETING_CONTEXT_CATALOG,
  SERVICE_CATALOG,
  SPECIAL_SERVICE_CATALOG,
  type ListingsFilters,
} from "@/server/biringas";
import { Container } from "@/shared/design-system/components/Container";
import { Disclosure } from "@/shared/motion/Disclosure";

import { PreservedFilters } from "./SearchBar";

interface FiltersPanelProps {
  filters: ListingsFilters;
}

const APPEARANCE_LABELS: Record<keyof typeof APPEARANCE_CATALOG, string> = {
  country: "País",
  ethnicity: "Etnia",
  hair: "Pelo",
  height: "Estatura",
  body: "Cuerpo",
  breast: "Pecho",
  pubis: "Pubis",
};

/**
 * Counts how many filter knobs are active right now. Used for the badge on
 * the panel summary so it's obvious from a glance whether anything is
 * currently filtering the catalog.
 */
function countActiveFilters(filters: ListingsFilters): number {
  let n = 0;
  if (filters.priceMin !== undefined) n += 1;
  if (filters.priceMax !== undefined) n += 1;
  if (filters.ageMin !== undefined) n += 1;
  if (filters.ageMax !== undefined) n += 1;
  if (filters.verifiedOnly) n += 1;
  if (filters.withVideo) n += 1;
  if (filters.withAudio) n += 1;
  if (filters.withReviews) n += 1;
  if (filters.faceVisible) n += 1;
  if (filters.paymentByCard) n += 1;
  if (filters.availableNow) n += 1;
  n += filters.attention?.length ?? 0;
  n += filters.contactChannels?.length ?? 0;
  n += filters.services?.length ?? 0;
  n += filters.specialServices?.length ?? 0;
  n += filters.meetingContexts?.length ?? 0;
  if (filters.attributes) {
    for (const v of Object.values(filters.attributes)) n += v.length;
  }
  return n;
}

/**
 * Collapsible mega-form that lives below the search bar. All inputs share a
 * single `<form action="/" method="get">`, so a submit re-renders the page
 * with the new filter combo. Each input pre-selects from the active
 * `filters` so an open panel reflects the URL state.
 */
export function FiltersPanel({ filters }: FiltersPanelProps) {
  const active = countActiveFilters(filters);

  return (
    <section className="border-b border-[var(--color-border)]/40 bg-[var(--color-background)]">
      <Container width="wide" className="py-2.5 sm:py-3">
        <Disclosure
          ariaLabel="Filtros de búsqueda"
          triggerClassName="group flex w-full cursor-pointer items-center gap-2 rounded-full border border-transparent px-2 py-1 text-left transition-colors hover:bg-[var(--color-surface)]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          summary={
            <>
              <SlidersHorizontal
                className="h-3.5 w-3.5 text-[var(--color-brand-primary-strong)]"
                aria-hidden
              />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Filtros
              </span>
              {active > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-1.5 text-[10px] font-bold text-[var(--color-background)] shadow-[0_4px_14px_-4px_rgba(255,43,181,0.7)]">
                  {active}
                </span>
              ) : (
                <span className="text-xs normal-case tracking-tight text-[var(--color-text-subtle)]">
                  Sin aplicar
                </span>
              )}
              <ChevronDown
                className="ml-auto h-4 w-4 text-[var(--color-text-subtle)] transition-transform duration-300 ease-[var(--ease-standard)] group-aria-expanded:rotate-180"
                aria-hidden
              />
            </>
          }
        >
          <form
            action="/"
            method="get"
            className="mt-3 grid gap-8 rounded-[var(--radius-xl)] border border-[var(--color-border)]/60 bg-[var(--color-background-elevated)]/60 p-5 sm:p-7 lg:grid-cols-2 lg:gap-10"
          >
            <PreservedFilters
              filters={filters}
              omit={[
                "priceMin",
                "priceMax",
                "ageMin",
                "ageMax",
                "verified",
                "video",
                "audio",
                "reviews",
                "face",
                "card",
                "now",
                "attention",
                "contact",
                "service",
                "special",
                "place",
                ...Object.keys(APPEARANCE_CATALOG).map((k) => `attr_${k}`),
              ]}
            />

            {/* Left column — Principales + Servicios + Lugar */}
            <div className="flex flex-col gap-8">
              <Section title="Principales" tone="primary">
                <Field label="Precio (COP / hora)">
                  <RangeInputs
                    minName="priceMin"
                    maxName="priceMax"
                    minValue={filters.priceMin}
                    maxValue={filters.priceMax}
                    step={10000}
                  />
                  <ChipRow>
                    <BoolChip
                      name="priceMax"
                      value="150000"
                      hidden
                      checked={filters.priceMax === 150000}
                      label="Baratas"
                    />
                    <BoolChip
                      name="priceMin"
                      value="250000"
                      hidden
                      checked={filters.priceMin === 250000}
                      label="De lujo"
                    />
                    <BoolChip
                      name="card"
                      value="1"
                      hidden
                      checked={filters.paymentByCard ?? false}
                      label="Pago con tarjeta"
                    />
                  </ChipRow>
                </Field>

                <Field label="Edad">
                  <RangeInputs
                    minName="ageMin"
                    maxName="ageMax"
                    minValue={filters.ageMin}
                    maxValue={filters.ageMax}
                    step={1}
                  />
                  <ChipRow>
                    <BoolChip
                      name="ageMax"
                      value="25"
                      hidden
                      checked={filters.ageMax === 25}
                      label="Jovencitas"
                    />
                    <BoolChip
                      name="ageMin"
                      value="30"
                      hidden
                      checked={filters.ageMin === 30}
                      label="Maduras"
                    />
                  </ChipRow>
                </Field>

                <Field label="Atención a">
                  <ChipRow>
                    {ATTENTION_CATALOG.map(({ id, label }) => (
                      <CheckChip
                        key={id}
                        name="attention"
                        value={id}
                        checked={filters.attention?.includes(id) ?? false}
                        label={label}
                      />
                    ))}
                  </ChipRow>
                </Field>

                <Field label="Contacto">
                  <ChipRow>
                    {CONTACT_CATALOG.map(({ id, label }) => (
                      <CheckChip
                        key={id}
                        name="contact"
                        value={id}
                        checked={filters.contactChannels?.includes(id) ?? false}
                        label={label}
                      />
                    ))}
                  </ChipRow>
                </Field>
              </Section>

              <Section title="Servicios generales" tone="primary">
                <ChipRow>
                  {SERVICE_CATALOG.map((service) => (
                    <CheckChip
                      key={service}
                      name="service"
                      value={service}
                      checked={filters.services?.includes(service) ?? false}
                      label={service}
                    />
                  ))}
                </ChipRow>
              </Section>

              <Section title="Servicios especiales" tone="secondary">
                <ChipRow>
                  {SPECIAL_SERVICE_CATALOG.map((service) => (
                    <CheckChip
                      key={service}
                      name="special"
                      value={service}
                      checked={
                        filters.specialServices?.includes(service) ?? false
                      }
                      label={service}
                    />
                  ))}
                </ChipRow>
              </Section>

              <Section title="Lugar" tone="accent">
                <ChipRow>
                  {MEETING_CONTEXT_CATALOG.map((place) => (
                    <CheckChip
                      key={place}
                      name="place"
                      value={place}
                      checked={
                        filters.meetingContexts?.includes(place) ?? false
                      }
                      label={place}
                    />
                  ))}
                </ChipRow>
              </Section>
            </div>

            {/* Right column — Contenido + Apariencia */}
            <div className="flex flex-col gap-8">
              <Section title="Contenido" tone="accent">
                <ChipRow>
                  <BoolChip
                    name="verified"
                    value="1"
                    checked={filters.verifiedOnly ?? false}
                    label="Fotos verificadas"
                  />
                  <BoolChip
                    name="face"
                    value="1"
                    checked={filters.faceVisible ?? false}
                    label="Cara visible"
                  />
                  <BoolChip
                    name="video"
                    value="1"
                    checked={filters.withVideo ?? false}
                    label="Con vídeos"
                  />
                  <BoolChip
                    name="audio"
                    value="1"
                    checked={filters.withAudio ?? false}
                    label="Con audio"
                  />
                  <BoolChip
                    name="reviews"
                    value="1"
                    checked={filters.withReviews ?? false}
                    label="Con experiencias"
                  />
                  <BoolChip
                    name="now"
                    value="1"
                    checked={filters.availableNow ?? false}
                    label="Disponible ahora"
                  />
                </ChipRow>
              </Section>

              <Section title="Apariencia" tone="primary">
                <div className="flex flex-col gap-5">
                  {(Object.keys(APPEARANCE_CATALOG) as Array<
                    keyof typeof APPEARANCE_CATALOG
                  >).map((key) => (
                    <Field key={key} label={APPEARANCE_LABELS[key]}>
                      <ChipRow>
                        {APPEARANCE_CATALOG[key].map((value: string) => (
                          <CheckChip
                            key={value}
                            name={`attr_${key}`}
                            value={value}
                            checked={
                              filters.attributes?.[key]?.includes(value) ??
                              false
                            }
                            label={value}
                          />
                        ))}
                      </ChipRow>
                    </Field>
                  ))}
                </div>
              </Section>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:col-span-2">
              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-brand-highlight)]/50 bg-[var(--color-brand-highlight)]/10 px-5 text-sm font-semibold text-[var(--color-brand-highlight)] transition-colors hover:bg-[var(--color-brand-highlight)]/15"
              >
                <Eraser className="h-4 w-4" aria-hidden />
                Borrar filtros
              </Link>
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-[var(--color-brand-primary)] px-8 text-sm font-semibold text-[var(--color-background)] shadow-[0_0_0_1px_rgba(255,93,203,0.45),0_10px_28px_-12px_rgba(255,43,181,0.7)] transition-colors hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
                Filtrar
              </button>
            </div>
          </form>
        </Disclosure>
      </Container>
    </section>
  );
}

interface SectionProps {
  title: string;
  tone: "primary" | "secondary" | "accent";
  children: React.ReactNode;
}

const SECTION_TONE: Record<SectionProps["tone"], string> = {
  primary: "text-[var(--color-brand-primary-strong)]",
  secondary: "text-[var(--color-brand-secondary-strong)]",
  accent: "text-[var(--color-brand-accent-strong)]",
};

function Section({ title, tone, children }: SectionProps) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend
        className={`text-xs font-semibold uppercase tracking-[0.28em] ${SECTION_TONE[tone]}`}
      >
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
        {label}
      </span>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

interface RangeInputsProps {
  minName: string;
  maxName: string;
  minValue?: number;
  maxValue?: number;
  step: number;
}

function RangeInputs({
  minName,
  maxName,
  minValue,
  maxValue,
  step,
}: RangeInputsProps) {
  const cls =
    "h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]/70 px-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]/50";
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
          Mín.
        </span>
        <input
          type="number"
          inputMode="numeric"
          name={minName}
          step={step}
          min={0}
          defaultValue={minValue ?? ""}
          placeholder="—"
          className={cls}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
          Máx.
        </span>
        <input
          type="number"
          inputMode="numeric"
          name={maxName}
          step={step}
          min={0}
          defaultValue={maxValue ?? ""}
          placeholder="—"
          className={cls}
        />
      </label>
    </div>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

/**
 * Pill-style checkbox.
 *
 * Visual state is driven by `:checked` on the inner input via Tailwind's
 * `has-checked:` variant — fully CSS, no JS. Active/inactive look matches
 * the catalog brand pills (brand-primary tint when checked, neutral surface
 * when off).
 */
const CHIP_BASE =
  "relative inline-flex h-9 cursor-pointer items-center rounded-full border px-3.5 text-xs font-medium transition-[background,border-color,color,box-shadow] duration-150 ease-[var(--ease-standard)] select-none border-[var(--color-border)] bg-[var(--color-surface)]/60 text-[var(--color-text-muted)] hover:text-[var(--color-foreground)] hover:border-[var(--color-brand-primary)]/40 has-checked:border-[var(--color-brand-primary)] has-checked:bg-[var(--color-brand-primary)]/15 has-checked:text-[var(--color-brand-primary-strong)] has-checked:shadow-[0_0_0_1px_rgba(255,93,203,0.35)]";

interface CheckChipProps {
  name: string;
  value: string;
  checked: boolean;
  label: string;
}

function CheckChip({ name, value, checked, label }: CheckChipProps) {
  return (
    <label className={CHIP_BASE}>
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={checked}
        className="sr-only"
        aria-label={label}
      />
      {label}
    </label>
  );
}

interface BoolChipProps {
  name: string;
  value: string;
  checked: boolean;
  /** Reserved for future use — currently the input is always sr-only. */
  hidden?: boolean;
  label: string;
}

function BoolChip({ name, value, checked, label }: BoolChipProps) {
  return (
    <label className={CHIP_BASE}>
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={checked}
        className="sr-only"
        aria-label={label}
      />
      {label}
    </label>
  );
}
