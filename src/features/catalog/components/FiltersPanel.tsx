import Link from "next/link";
import {
  Check,
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

import type { CatalogView } from "../lib/parse-filters";
import { ActiveFilterChips } from "./ActiveFilterChips";
import { FilterForm } from "./FilterForm";
import { FilterModal } from "./FilterModal";
import { RangeSlider } from "./RangeSlider";
import { PreservedFilters } from "./SearchBar";

interface FiltersPanelProps {
  filters: ListingsFilters;
  view?: CatalogView;
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

interface SectionCounts {
  priceAge: number;
  attentionContact: number;
  meetingContext: number;
  services: number;
  content: number;
  appearance: number;
}

function buildSectionCounts(filters: ListingsFilters): SectionCounts {
  let priceAge = 0;
  if (filters.priceMin !== undefined) priceAge += 1;
  if (filters.priceMax !== undefined) priceAge += 1;
  if (filters.ageMin !== undefined) priceAge += 1;
  if (filters.ageMax !== undefined) priceAge += 1;
  if (filters.paymentByCard) priceAge += 1;

  const attentionContact =
    (filters.attention?.length ?? 0) + (filters.contactChannels?.length ?? 0);

  const meetingContext = filters.meetingContexts?.length ?? 0;

  const services =
    (filters.services?.length ?? 0) + (filters.specialServices?.length ?? 0);

  let content = 0;
  if (filters.verifiedOnly) content += 1;
  if (filters.faceVisible) content += 1;
  if (filters.withVideo) content += 1;
  if (filters.withAudio) content += 1;
  if (filters.withReviews) content += 1;
  if (filters.availableNow) content += 1;

  let appearance = 0;
  if (filters.attributes) {
    for (const v of Object.values(filters.attributes)) appearance += v.length;
  }

  return {
    priceAge,
    attentionContact,
    meetingContext,
    services,
    content,
    appearance,
  };
}

function countActiveFilters(filters: ListingsFilters): number {
  const c = buildSectionCounts(filters);
  return (
    c.priceAge +
    c.attentionContact +
    c.meetingContext +
    c.services +
    c.content +
    c.appearance
  );
}

export function FiltersPanel({ filters, view }: FiltersPanelProps) {
  const counts = buildSectionCounts(filters);
  const active = countActiveFilters(filters);

  return (
    <section className="bg-[var(--color-background)]">
      <Container width="wide" className="py-3 sm:py-4">
        <FilterModal
          title="Filtros avanzados"
          subtitle="Refina por precio, edad, servicios y apariencia."
          trigger={<TriggerPill active={active} />}
        >
          {active > 0 && (
            <div className="mb-5 flex flex-col gap-2 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] sm:p-4">
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
              view={view}
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

            <div className="flex flex-col gap-5">
              <SectionCard
                title="Precio y edad"
                icon={<Coins className="h-4 w-4" aria-hidden />}
                count={counts.priceAge}
              >
                <RangeSlider
                  label="Precio (COP / hora)"
                  minName="priceMin"
                  maxName="priceMax"
                  min={0}
                  max={500_000}
                  step={10_000}
                  initialMin={filters.priceMin}
                  initialMax={filters.priceMax}
                  format="currency"
                  presets={[
                    { label: "Baratas", max: 150_000 },
                    { label: "Estándar", min: 150_000, max: 250_000 },
                    { label: "De lujo", min: 250_000 },
                  ]}
                />
                <ChipRow>
                  <PresetChip
                    name="card"
                    value="1"
                    checked={filters.paymentByCard ?? false}
                    label="Pago con tarjeta"
                  />
                </ChipRow>

                <RangeSlider
                  label="Edad"
                  minName="ageMin"
                  maxName="ageMax"
                  min={18}
                  max={60}
                  step={1}
                  initialMin={filters.ageMin}
                  initialMax={filters.ageMax}
                  format="age"
                  presets={[
                    { label: "Jovencitas", max: 25 },
                    { label: "20s", min: 20, max: 29 },
                    { label: "Maduras", min: 30 },
                  ]}
                />
              </SectionCard>

              <SectionCard
                title="Atención y contacto"
                icon={<Heart className="h-4 w-4" aria-hidden />}
                count={counts.attentionContact}
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
                count={counts.meetingContext}
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

            <div className="flex flex-col gap-5">
              <SectionCard
                title="Servicios"
                icon={<Sparkles className="h-4 w-4" aria-hidden />}
                count={counts.services}
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
                count={counts.content}
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
                count={counts.appearance}
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
                href="/explorar"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-sm font-semibold text-[var(--color-text-muted)] transition-[border-color,color,background] duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-brand-highlight)]/50 hover:bg-[var(--color-surface)] hover:text-[var(--color-brand-highlight)]"
              >
                <Eraser className="h-4 w-4" aria-hidden />
                Borrar filtros
              </Link>
              <button
                type="submit"
                className="btn-pulse inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-8 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-colors hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
              >
                <span className="relative z-10 inline-flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden />
                  Aplicar filtros
                </span>
              </button>
            </div>
          </FilterForm>
        </FilterModal>
      </Container>
    </section>
  );
}

interface TriggerPillProps {
  active: number;
}

function TriggerPill({ active }: TriggerPillProps) {
  return (
    <span className="flex w-full items-center gap-3 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-left shadow-[var(--shadow-sm)] transition-[border-color,background,box-shadow] duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary-soft)] hover:shadow-[var(--shadow-md)]">
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
    </span>
  );
}

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  count?: number;
  children: React.ReactNode;
}

function SectionCard({ title, icon, count = 0, children }: SectionCardProps) {
  const isActive = count > 0;
  return (
    <fieldset
      className={`flex flex-col gap-4 rounded-[var(--radius-xl)] bg-[var(--color-surface)] p-4 ring-1 transition-[box-shadow,ring-color] duration-200 ease-[var(--ease-standard)] sm:p-5 ${
        isActive
          ? "ring-[var(--color-brand-primary)]/40 shadow-[var(--shadow-sm)]"
          : "ring-[var(--color-border)]"
      }`}
    >
      <legend className="float-none flex w-full items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-primary)]">
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-200 ${
            isActive
              ? "bg-[var(--color-brand-primary)] text-[var(--color-surface)]"
              : "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]"
          }`}
        >
          {icon}
        </span>
        <span>{title}</span>
        {isActive && (
          <span
            aria-hidden
            className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-1.5 text-[10px] font-bold text-[var(--color-surface)]"
          >
            {count}
          </span>
        )}
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

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

const CHIP_BASE =
  "chip-animated relative inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium select-none border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-muted)] hover:text-[var(--color-foreground)] hover:border-[var(--color-brand-primary-soft)] focus-within:ring-2 focus-within:ring-[var(--color-brand-primary)]/30 has-checked:border-[var(--color-brand-primary)] has-checked:bg-[var(--color-brand-primary)]/10 has-checked:text-[var(--color-brand-primary)] has-checked:font-semibold";

/**
 * Inline check icon that smoothly slides + scales in when the chip's
 * `<input>` becomes `:checked`. Hidden (zero width) by default so the chip
 * doesn't reflow until the user actually selects it.
 */
function ChipCheck() {
  return (
    <span aria-hidden className="chip-check">
      <Check className="h-3 w-3" aria-hidden />
    </span>
  );
}

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
      <ChipCheck />
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
      <ChipCheck />
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
      <ChipCheck />
      {icon}
      {label}
    </label>
  );
}
