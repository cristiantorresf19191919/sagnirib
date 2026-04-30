import Link from "next/link";
import {
  ChevronDown,
  Coins,
  Eraser,
  Eye,
  Film,
  Heart,
  MapPinned,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserSquare,
} from "lucide-react";

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

import { ActiveFilterChips } from "./ActiveFilterChips";
import { FilterForm } from "./FilterForm";
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

export function FiltersPanel({ filters }: FiltersPanelProps) {
  const active = countActiveFilters(filters);

  return (
    <section className="bg-[var(--color-background)]">
      <Container width="wide" className="py-3 sm:py-4">
        <Disclosure
          ariaLabel="Filtros de búsqueda"
          triggerClassName="group flex w-full cursor-pointer items-center gap-3 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-left shadow-[var(--shadow-sm)] transition-[border-color,background,box-shadow] duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-surface)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          summary={
            <>
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]">
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Filtros avanzados
                </span>
                <span className="text-sm text-[var(--color-foreground)]">
                  {active > 0
                    ? `${active} ${active === 1 ? "filtro aplicado" : "filtros aplicados"}`
                    : "Refina por precio, edad, servicios y apariencia"}
                </span>
              </span>
              {active > 0 && (
                <span className="ml-auto inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-2 text-[11px] font-bold text-[var(--color-surface)]">
                  {active}
                </span>
              )}
              <ChevronDown
                className="h-4 w-4 shrink-0 text-[var(--color-text-subtle)] transition-transform duration-300 ease-[var(--ease-standard)] group-aria-expanded:rotate-180"
                aria-hidden
              />
            </>
          }
        >
          <div className="mt-4 flex flex-col gap-4 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-background-elevated)] p-5 shadow-[var(--shadow-sm)] sm:p-6 lg:p-8">
            {active > 0 && (
              <div className="flex flex-col gap-2 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-3 sm:p-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
                  Filtros activos · toca el chip para quitarlo
                </span>
                <ActiveFilterChips filters={filters} />
              </div>
            )}

            <FilterForm
              action="/"
              method="get"
              className="grid gap-5 lg:grid-cols-2 lg:gap-6"
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

              {/* Left column */}
              <div className="flex flex-col gap-5">
                <SectionCard
                  title="Precio y edad"
                  icon={<Coins className="h-4 w-4" aria-hidden />}
                >
                  <Field label="Precio (COP / hora)">
                    <RangeInputs
                      minName="priceMin"
                      maxName="priceMax"
                      minValue={filters.priceMin}
                      maxValue={filters.priceMax}
                      step={10000}
                      placeholderMin="0"
                      placeholderMax="500.000"
                    />
                    <ChipRow>
                      <PresetChip
                        name="priceMax"
                        value="150000"
                        checked={filters.priceMax === 150000}
                        label="Baratas"
                      />
                      <PresetChip
                        name="priceMin"
                        value="250000"
                        checked={filters.priceMin === 250000}
                        label="De lujo"
                      />
                      <PresetChip
                        name="card"
                        value="1"
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
                      placeholderMin="18"
                      placeholderMax="60"
                    />
                    <ChipRow>
                      <PresetChip
                        name="ageMax"
                        value="25"
                        checked={filters.ageMax === 25}
                        label="Jovencitas"
                      />
                      <PresetChip
                        name="ageMin"
                        value="30"
                        checked={filters.ageMin === 30}
                        label="Maduras"
                      />
                    </ChipRow>
                  </Field>
                </SectionCard>

                <SectionCard
                  title="Atención y contacto"
                  icon={<Heart className="h-4 w-4" aria-hidden />}
                >
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

                  <Field label="Canal de contacto">
                    <ChipRow>
                      {CONTACT_CATALOG.map(({ id, label }) => (
                        <CheckChip
                          key={id}
                          name="contact"
                          value={id}
                          checked={
                            filters.contactChannels?.includes(id) ?? false
                          }
                          label={label}
                        />
                      ))}
                    </ChipRow>
                  </Field>
                </SectionCard>

                <SectionCard
                  title="Lugar de encuentro"
                  icon={<MapPinned className="h-4 w-4" aria-hidden />}
                >
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
                </SectionCard>
              </div>

              {/* Right column */}
              <div className="flex flex-col gap-5">
                <SectionCard
                  title="Servicios"
                  icon={<Sparkles className="h-4 w-4" aria-hidden />}
                >
                  <Field label="Servicios generales">
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
                  </Field>

                  <Field label="Servicios especiales">
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
                  </Field>
                </SectionCard>

                <SectionCard
                  title="Contenido"
                  icon={<Film className="h-4 w-4" aria-hidden />}
                >
                  <ChipRow>
                    <FlagChip
                      name="verified"
                      checked={filters.verifiedOnly ?? false}
                      label="Fotos verificadas"
                      icon={<ShieldCheck className="h-3 w-3" aria-hidden />}
                    />
                    <FlagChip
                      name="face"
                      checked={filters.faceVisible ?? false}
                      label="Cara visible"
                      icon={<Eye className="h-3 w-3" aria-hidden />}
                    />
                    <FlagChip
                      name="video"
                      checked={filters.withVideo ?? false}
                      label="Con vídeos"
                    />
                    <FlagChip
                      name="audio"
                      checked={filters.withAudio ?? false}
                      label="Con audio"
                    />
                    <FlagChip
                      name="reviews"
                      checked={filters.withReviews ?? false}
                      label="Con experiencias"
                    />
                    <FlagChip
                      name="now"
                      checked={filters.availableNow ?? false}
                      label="Disponible ahora"
                    />
                  </ChipRow>
                </SectionCard>

                <SectionCard
                  title="Apariencia"
                  icon={<UserSquare className="h-4 w-4" aria-hidden />}
                >
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
                </SectionCard>
              </div>

              <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-5 sm:flex-row sm:items-center sm:justify-between lg:col-span-2">
                <Link
                  href="/"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-sm font-semibold text-[var(--color-text-muted)] transition-[border-color,color,background] duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-brand-highlight)]/50 hover:bg-[var(--color-surface)] hover:text-[var(--color-brand-highlight)]"
                >
                  <Eraser className="h-4 w-4" aria-hidden />
                  Borrar filtros
                </Link>
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-8 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-colors hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden />
                  Aplicar filtros
                </button>
              </div>
            </FilterForm>
          </div>
        </Disclosure>
      </Container>
    </section>
  );
}

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SectionCard({ title, icon, children }: SectionCardProps) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-[var(--radius-xl)] bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-border)] sm:p-5">
      <legend className="float-none flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-primary)]">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/10">
          {icon}
        </span>
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
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
        {label}
      </span>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

interface RangeInputsProps {
  minName: string;
  maxName: string;
  minValue?: number;
  maxValue?: number;
  step: number;
  placeholderMin?: string;
  placeholderMax?: string;
}

function RangeInputs({
  minName,
  maxName,
  minValue,
  maxValue,
  step,
  placeholderMin = "—",
  placeholderMax = "—",
}: RangeInputsProps) {
  const inputCls =
    "h-11 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-4 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]/30 transition-colors";
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <label className="block">
        <span className="sr-only">Mínimo</span>
        <input
          type="number"
          inputMode="numeric"
          name={minName}
          step={step}
          min={0}
          defaultValue={minValue ?? ""}
          placeholder={placeholderMin}
          className={inputCls}
        />
      </label>
      <span
        aria-hidden
        className="text-[var(--color-text-subtle)]"
      >
        —
      </span>
      <label className="block">
        <span className="sr-only">Máximo</span>
        <input
          type="number"
          inputMode="numeric"
          name={maxName}
          step={step}
          min={0}
          defaultValue={maxValue ?? ""}
          placeholder={placeholderMax}
          className={inputCls}
        />
      </label>
    </div>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

const CHIP_BASE =
  "relative inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-[background,border-color,color,box-shadow,transform] duration-150 ease-[var(--ease-standard)] select-none border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-muted)] hover:text-[var(--color-foreground)] hover:border-[var(--color-brand-primary-soft)] active:scale-[0.97] has-checked:border-[var(--color-brand-primary)] has-checked:bg-[var(--color-brand-primary)]/10 has-checked:text-[var(--color-brand-primary)] has-checked:font-semibold";

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

interface PresetChipProps {
  name: string;
  value: string;
  checked: boolean;
  label: string;
}

function PresetChip({ name, value, checked, label }: PresetChipProps) {
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

interface FlagChipProps {
  name: string;
  checked: boolean;
  label: string;
  icon?: React.ReactNode;
}

function FlagChip({ name, checked, label, icon }: FlagChipProps) {
  return (
    <label className={CHIP_BASE}>
      <input
        type="checkbox"
        name={name}
        value="1"
        defaultChecked={checked}
        className="sr-only"
        aria-label={label}
      />
      {icon}
      {label}
    </label>
  );
}
