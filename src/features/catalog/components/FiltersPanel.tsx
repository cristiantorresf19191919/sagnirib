import Link from "next/link";

import { localizedHref } from "@/core/i18n/href";
import { readLocale } from "@/core/i18n/locale";
import { t } from "@/core/i18n/messages";
import type { SupportedLocale } from "@/core/branding/brand-config";
import {
  Check,
  Clock,
  Coins,
  Eraser,
  Eye,
  Film,
  Heart,
  MapPinned,
  MessageSquare,
  Mic,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserSquare,
  Video,
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

import {
  DEFAULT_CATALOG_VIEW,
  encodeFilters,
  type CatalogView,
} from "../lib/parse-filters";
import { ActiveFilterChips } from "./ActiveFilterChips";
import { FilterForm } from "./FilterForm";
import { FilterModal } from "./FilterModal";
import { RangeSlider } from "./RangeSlider";
import { PreservedFilters } from "./SearchBar";

interface FiltersPanelProps {
  filters: ListingsFilters;
  view?: CatalogView;
}

function buildAppearanceLabels(
  locale: SupportedLocale,
): Record<keyof typeof APPEARANCE_CATALOG, string> {
  return {
    country: t(locale, "filters.appearance.country"),
    ethnicity: t(locale, "filters.appearance.ethnicity"),
    hair: t(locale, "filters.appearance.hair"),
    height: t(locale, "filters.appearance.height"),
    body: t(locale, "filters.appearance.body"),
    breast: t(locale, "filters.appearance.breast"),
    pubis: t(locale, "filters.appearance.pubis"),
  };
}

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

type FilterSection =
  | "priceAge"
  | "attentionContact"
  | "meetingContext"
  | "services"
  | "content"
  | "appearance";

/**
 * Build a `/?…` href that strips every key owned by `section` while
 * preserving the rest of the active filters. Used by per-section "Limpiar"
 * links inside each `SectionCard`.
 */
function sectionResetHref(
  filters: ListingsFilters,
  section: FilterSection,
  view?: CatalogView,
): string {
  const next: ListingsFilters = { ...filters, page: undefined };
  switch (section) {
    case "priceAge":
      next.priceMin = undefined;
      next.priceMax = undefined;
      next.ageMin = undefined;
      next.ageMax = undefined;
      next.paymentByCard = undefined;
      break;
    case "attentionContact":
      next.attention = undefined;
      next.contactChannels = undefined;
      break;
    case "meetingContext":
      next.meetingContexts = undefined;
      break;
    case "services":
      next.services = undefined;
      next.specialServices = undefined;
      break;
    case "content":
      next.verifiedOnly = undefined;
      next.faceVisible = undefined;
      next.withVideo = undefined;
      next.withAudio = undefined;
      next.withReviews = undefined;
      next.availableNow = undefined;
      break;
    case "appearance":
      next.attributes = undefined;
      break;
  }
  const params = encodeFilters(next);
  if (view && view !== DEFAULT_CATALOG_VIEW) params.set("view", view);
  const qs = params.toString();
  return qs.length > 0 ? `/?${qs}` : "/";
}

export async function FiltersPanel({ filters, view }: FiltersPanelProps) {
  const locale = await readLocale();
  const appearanceLabels = buildAppearanceLabels(locale);
  const counts = buildSectionCounts(filters);
  const active = countActiveFilters(filters);

  // Inline-mounted in ResultsToolbar — no Container/section wrapper so the
  // trigger slots cleanly next to SortMenu. The modal contents stay
  // identical; only the trigger pill was redesigned to be compact.
  return (
    <div data-testid="filters-panel" className="inline-flex">
      <FilterModal
        title={t(locale, "explorar.filters.advanced.title")}
        subtitle={t(locale, "explorar.filters.advanced.subtitle")}
        trigger={<TriggerPill active={active} locale={locale} />}
      >
          {active > 0 && (
            <div className="mb-5 flex flex-col gap-2 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] sm:p-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
                {t(locale, "explorar.filters.advanced.activeKicker")}
              </span>
              <ActiveFilterChips filters={filters} />
            </div>
          )}

          <FilterForm
            action={localizedHref(locale, "/explorar")}
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
                title={t(locale, "filters.section.priceAge.title")}
                eyebrow={t(locale, "filters.section.priceAge.eyebrow")}
                icon={<Coins className="h-4 w-4" aria-hidden />}
                count={counts.priceAge}
                resetHref={sectionResetHref(filters, "priceAge", view)}
              >
                <RangeSlider
                  label={t(locale, "filters.priceLabel")}
                  minName="priceMin"
                  maxName="priceMax"
                  min={0}
                  max={500_000}
                  step={10_000}
                  initialMin={filters.priceMin}
                  initialMax={filters.priceMax}
                  format="price-cop"
                  presets={[
                    { label: t(locale, "filters.preset.price.cheap"), max: 150_000 },
                    {
                      label: t(locale, "filters.preset.price.standard"),
                      min: 150_000,
                      max: 250_000,
                    },
                    { label: t(locale, "filters.preset.price.luxury"), min: 250_000 },
                  ]}
                />
                <ChipRow>
                  <PresetChip
                    name="card"
                    value="1"
                    checked={filters.paymentByCard ?? false}
                    label={t(locale, "filters.chip.card")}
                  />
                </ChipRow>

                <RangeSlider
                  label={t(locale, "filters.ageLabel")}
                  minName="ageMin"
                  maxName="ageMax"
                  min={18}
                  max={60}
                  step={1}
                  initialMin={filters.ageMin}
                  initialMax={filters.ageMax}
                  format="age-years"
                  presets={[
                    { label: t(locale, "filters.preset.age.young"), max: 25 },
                    {
                      label: t(locale, "filters.preset.age.twenties"),
                      min: 20,
                      max: 29,
                    },
                    { label: t(locale, "filters.preset.age.mature"), min: 30 },
                  ]}
                />
              </SectionCard>

              <SectionCard
                title={t(locale, "filters.section.attentionContact.title")}
                eyebrow={t(locale, "filters.section.attentionContact.eyebrow")}
                icon={<Heart className="h-4 w-4" aria-hidden />}
                count={counts.attentionContact}
                resetHref={sectionResetHref(filters, "attentionContact", view)}
              >
                <Field label={t(locale, "filters.field.attention")}>
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

                <Field label={t(locale, "filters.field.contact")}>
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
                title={t(locale, "filters.section.meeting.title")}
                eyebrow={t(locale, "filters.section.meeting.eyebrow")}
                icon={<MapPinned className="h-4 w-4" aria-hidden />}
                count={counts.meetingContext}
                resetHref={sectionResetHref(filters, "meetingContext", view)}
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
                title={t(locale, "filters.section.services.title")}
                eyebrow={t(locale, "filters.section.services.eyebrow")}
                icon={<Sparkles className="h-4 w-4" aria-hidden />}
                count={counts.services}
                resetHref={sectionResetHref(filters, "services", view)}
              >
                <Field label={t(locale, "filters.field.servicesGeneral")}>
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

                <Field label={t(locale, "filters.field.servicesSpecial")}>
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
                title={t(locale, "filters.section.content.title")}
                eyebrow={t(locale, "filters.section.content.eyebrow")}
                icon={<Film className="h-4 w-4" aria-hidden />}
                count={counts.content}
                resetHref={sectionResetHref(filters, "content", view)}
              >
                <ChipRow>
                  <FlagChip
                    name="verified"
                    checked={filters.verifiedOnly ?? false}
                    label={t(locale, "filters.flag.verified")}
                    icon={<ShieldCheck className="h-3 w-3" aria-hidden />}
                  />
                  <FlagChip
                    name="face"
                    checked={filters.faceVisible ?? false}
                    label={t(locale, "filters.flag.face")}
                    icon={<Eye className="h-3 w-3" aria-hidden />}
                  />
                  <FlagChip
                    name="video"
                    checked={filters.withVideo ?? false}
                    label={t(locale, "filters.flag.video")}
                    icon={<Video className="h-3 w-3" aria-hidden />}
                  />
                  <FlagChip
                    name="audio"
                    checked={filters.withAudio ?? false}
                    label={t(locale, "filters.flag.audio")}
                    icon={<Mic className="h-3 w-3" aria-hidden />}
                  />
                  <FlagChip
                    name="reviews"
                    checked={filters.withReviews ?? false}
                    label={t(locale, "filters.flag.reviews")}
                    icon={<MessageSquare className="h-3 w-3" aria-hidden />}
                  />
                  <FlagChip
                    name="now"
                    checked={filters.availableNow ?? false}
                    label={t(locale, "filters.flag.now")}
                    icon={<Clock className="h-3 w-3" aria-hidden />}
                  />
                </ChipRow>
              </SectionCard>

              <SectionCard
                title={t(locale, "filters.section.appearance.title")}
                eyebrow={t(locale, "filters.section.appearance.eyebrow")}
                icon={<UserSquare className="h-4 w-4" aria-hidden />}
                count={counts.appearance}
                resetHref={sectionResetHref(filters, "appearance", view)}
              >
                {(Object.keys(APPEARANCE_CATALOG) as Array<
                  keyof typeof APPEARANCE_CATALOG
                >).map((key) => (
                  <Field key={key} label={appearanceLabels[key]}>
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

            {/* Sticky action bar — anchored at the bottom of the modal so the
                primary CTA is always reachable, and the live filter count
                stays visible while the user picks chips.

                Edges align with the modal body padding (-mx-5 / -mx-7,
                -mb-5 / -mb-6) so the bar bleeds flush. Background is
                fully opaque + carries a soft upward fade so chips
                scrolling underneath cleanly disappear instead of ghosting
                through. */}
            <div
              data-testid="filters-sticky-bar"
              className="sticky bottom-0 z-10 -mx-5 -mb-5 flex flex-col gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 shadow-[0_-12px_24px_-18px_rgba(20,28,24,0.25)] sm:-mx-7 sm:-mb-6 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-4 lg:col-span-2"
            >
              {/* Top fade — a thin gradient above the bar that softens the
                  edge where the scrolling content meets the action bar.
                  Sits outside the bar's content area, points downward
                  into the bar's surface for visual continuity. */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-[var(--color-surface)] to-transparent"
              />
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  {active > 0
                    ? t(
                        locale,
                        active === 1
                          ? "explorar.filters.advanced.activeSingular"
                          : "explorar.filters.advanced.activePlural",
                        { count: active },
                      )
                    : t(locale, "explorar.filters.advanced.noActive")}
                </span>
                {active > 0 && (
                  <Link
                    href={localizedHref(locale, "/explorar")}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background)] hover:text-[var(--color-brand-highlight)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
                  >
                    <Eraser className="h-3 w-3" aria-hidden />
                    {t(locale, "explorar.filters.advanced.clearAll")}
                  </Link>
                )}
              </div>
              <button
                type="submit"
                className="btn-pulse inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-8 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-colors hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
              >
                <span className="relative z-10 inline-flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden />
                  {t(locale, "explorar.filters.advanced.apply")}
                </span>
              </button>
            </div>
          </FilterForm>
      </FilterModal>
    </div>
  );
}

interface TriggerPillProps {
  active: number;
  locale: SupportedLocale;
}

function TriggerPill({ active, locale }: TriggerPillProps) {
  // Compact toolbar trigger — sits alongside SortMenu instead of as the
  // page-wide banner the previous version was. Active filter count
  // anchors as a small forest dot so the chrome stays tight.
  return (
    <span
      className={`inline-flex h-11 items-center gap-2 rounded-full border bg-[var(--color-surface)] px-4 text-sm font-semibold shadow-[var(--shadow-sm)] transition-[border-color,background,box-shadow,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:shadow-[var(--shadow-md)] ${
        active > 0
          ? "border-[var(--color-brand-primary)]/55 text-[var(--color-brand-primary)] hover:border-[var(--color-brand-primary)]"
          : "border-[var(--color-border)] text-[var(--color-foreground)] hover:border-[var(--color-brand-primary-soft)]"
      }`}
    >
      <SlidersHorizontal className="h-4 w-4" aria-hidden />
      <span>{t(locale, "explorar.filters.triggerLabel")}</span>
      {active > 0 && (
        <span
          aria-hidden
          className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-1.5 text-[10px] font-bold text-[var(--color-surface)]"
        >
          {active}
        </span>
      )}
    </span>
  );
}

interface SectionCardProps {
  title: string;
  /** Italic editorial subtitle — sets tone alongside the brand voice. */
  eyebrow?: string;
  icon: React.ReactNode;
  count?: number;
  /** When provided AND count > 0, renders a "Limpiar" link top-right. */
  resetHref?: string;
  children: React.ReactNode;
}

function SectionCard({
  title,
  eyebrow,
  icon,
  count = 0,
  resetHref,
  children,
}: SectionCardProps) {
  const isActive = count > 0;
  const testId = `filters-section-${title
    .toLowerCase()
    .replaceAll("á", "a")
    .replaceAll("é", "e")
    .replaceAll("í", "i")
    .replaceAll("ó", "o")
    .replaceAll("ú", "u")
    .replaceAll(/\s+/g, "-")}`;
  return (
    <fieldset
      data-testid={testId}
      className={`relative flex flex-col gap-4 rounded-[var(--radius-xl)] bg-[var(--color-surface)] p-4 ring-1 transition-[box-shadow,ring-color] duration-200 ease-[var(--ease-standard)] sm:p-5 ${
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
        <span className="font-[var(--font-display)] text-[14px] font-[420] tracking-[0.04em] normal-case">
          {title}
        </span>
        {isActive && (
          <span
            aria-hidden
            className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-1.5 text-[10px] font-bold text-[var(--color-surface)]"
          >
            {count}
          </span>
        )}
      </legend>
      {eyebrow ? (
        <span className="-mt-2 font-[var(--font-serif)] text-[12px] italic leading-tight text-[var(--color-text-muted)]">
          {eyebrow}
        </span>
      ) : null}
      {/* Hairline gold rule under the legend when active — editorial accent. */}
      {isActive ? (
        <span
          aria-hidden
          className="absolute left-4 right-4 top-[64px] block h-px bg-gradient-to-r from-transparent via-[var(--color-brand-warn)]/40 to-transparent sm:left-5 sm:right-5"
        />
      ) : null}
      {/* Per-section reset link, anchored top-right when filters are active. */}
      {isActive && resetHref ? (
        <Link
          href={resetHref}
          className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-brand-highlight)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] sm:right-5 sm:top-5"
          data-testid={`${testId}-reset`}
        >
          Limpiar
        </Link>
      ) : null}
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
  "chip-animated relative inline-flex h-11 sm:h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium select-none border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-muted)] hover:text-[var(--color-foreground)] hover:border-[var(--color-brand-primary-soft)] focus-within:ring-2 focus-within:ring-[var(--color-brand-primary)]/30 has-checked:border-[var(--color-brand-primary)] has-checked:bg-[var(--color-brand-primary)]/10 has-checked:text-[var(--color-brand-primary)] has-checked:font-semibold";

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
