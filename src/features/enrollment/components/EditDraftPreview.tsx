"use client";

import { ImageIcon, MapPin, Phone, Sparkles } from "lucide-react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { t } from "@/core/i18n/messages";
import { formatPriceCop } from "@/features/biringas/format";

import type { EnrollmentCatalogs } from "../lib/catalogs";
import type { AttributesValues, DetailsValues } from "../lib/types";

interface EditDraftPreviewProps {
  locale: SupportedLocale;
  details: DetailsValues;
  attributes: AttributesValues;
  catalogs: EnrollmentCatalogs;
}

function labelFor<T extends { id: string; label: string }>(
  catalog: ReadonlyArray<T>,
  id: string,
): string {
  return catalog.find((c) => c.id === id)?.label ?? id;
}

/**
 * Live "so this is how it'll look" card mirroring the public catalog tile.
 * Bound to the same state the form mutates, so every keystroke or chip tap
 * reflects instantly — turns a long form into a tangible, confidence-building
 * edit-with-preview surface. Photos live outside the editor (verified
 * separately), so the media slot is an intentional branded placeholder.
 */
export function EditDraftPreview({
  locale,
  details,
  attributes,
  catalogs,
}: Readonly<EditDraftPreviewProps>) {
  const name = details.displayName.trim() || t(locale, "editar.preview.namePlaceholder");
  const age = Number(details.age);
  const price = Number(details.pricePerHour);
  const rate = Number.isFinite(price) && price > 0 ? formatPriceCop(price) : null;
  const attentionLabels = details.attention.map((id) =>
    labelFor(catalogs.attention, id),
  );
  const tags = [attributes.ethnicity, attributes.hair, attributes.body].filter(
    Boolean,
  );

  return (
    <div className="overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
          {t(locale, "editar.preview.eyebrow")}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand-primary)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-primary)]">
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-primary)] motion-safe:animate-pulse"
          />
          {t(locale, "editar.preview.live")}
        </span>
      </div>

      {/* Media slot — photos are verified separately, so this is a branded
          placeholder rather than an upload. */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(47,93,67,0.12),transparent_60%),radial-gradient(circle_at_80%_85%,rgba(229,162,58,0.14),transparent_55%)]">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
          <span
            aria-hidden
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface)]/70 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-border)]"
          >
            <ImageIcon className="h-5 w-5" aria-hidden />
          </span>
          <span className="max-w-[80%] text-[11px] leading-snug text-[var(--color-text-muted)]">
            {t(locale, "editar.preview.photoNote")}
          </span>
        </div>
        {rate ? (
          <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full bg-[var(--color-foreground)]/85 px-2.5 py-1 text-xs font-semibold text-[var(--color-surface)] backdrop-blur-sm">
            {rate}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex items-baseline gap-1.5">
          <span className="truncate font-[var(--font-display)] text-base font-[420] tracking-[-0.01em] text-[var(--color-foreground)]">
            {name}
          </span>
          {Number.isFinite(age) && age > 0 ? (
            <span className="shrink-0 text-sm text-[var(--color-text-muted)]">
              · {age}
            </span>
          ) : null}
        </div>

        {(details.city || details.category) && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--color-text-muted)]">
            {details.city ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" aria-hidden />
                {details.city}
              </span>
            ) : null}
            {details.city && details.category ? <span aria-hidden>·</span> : null}
            {details.category ? (
              <span className="capitalize">{details.category}</span>
            ) : null}
          </div>
        )}

        {tags.length > 0 ? (
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 shrink-0 text-[var(--color-brand-accent-strong)]" aria-hidden />
            <span className="truncate text-[11px] text-[var(--color-text-muted)]">
              {tags.join(" · ")}
            </span>
          </div>
        ) : null}

        {attentionLabels.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5 pt-0.5">
            {attentionLabels.map((label) => (
              <li
                key={label}
                className="inline-flex items-center rounded-full bg-[var(--color-brand-primary)]/8 px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-foreground)] ring-1 ring-[var(--color-brand-primary)]/15"
              >
                {label}
              </li>
            ))}
          </ul>
        ) : null}

        {details.contactChannels.length > 0 ? (
          <div className="flex items-center gap-1.5 pt-1 text-[11px] text-[var(--color-text-subtle)]">
            <Phone className="h-3 w-3" aria-hidden />
            {details.contactChannels
              .map((id) => labelFor(catalogs.contact, id))
              .join(" · ")}
          </div>
        ) : null}
      </div>
    </div>
  );
}
