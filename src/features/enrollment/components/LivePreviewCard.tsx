"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, ShieldCheck } from "lucide-react";

import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";

import { formatCop } from "../lib/pricing";
import type { EnrollmentDraft } from "../lib/types";

interface LivePreviewCardProps {
  draft: EnrollmentDraft;
}

const MAX_CHIPS = 4;

/**
 * Live, catalog-style preview of the profile being built — the right-rail
 * "how visitors will see you" card. Mirrors the public catalog card's
 * vocabulary (cover photo, name, city · category, rate, short bio, service
 * chips) and updates as the modelo types/uploads, closing the feedback loop
 * the short-bio copy promises ("aparece debajo de tu foto principal").
 *
 * Purely presentational; reads the wizard draft, writes nothing.
 */
export function LivePreviewCard({ draft }: LivePreviewCardProps) {
  const locale = useActiveLocale();
  const { details, description } = draft;

  const cover = description.gallery.find((g) => g.previewUrl)?.previewUrl;
  const name = details.displayName.trim() || t(locale, "publicar.preview.namePlaceholder");
  const hasName = details.displayName.trim().length > 0;
  const price = details.pricePerHour
    ? formatCop(Number(details.pricePerHour))
    : t(locale, "publicar.preview.priceEmpty");
  const cityCategory = [details.city, details.category]
    .filter(Boolean)
    .join(" · ");
  const shortBio =
    description.shortBio.trim() || t(locale, "publicar.preview.bioPlaceholder");
  const hasBio = description.shortBio.trim().length > 0;
  const chips = description.services.slice(0, MAX_CHIPS);
  const extraChips = description.services.length - chips.length;

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-brand-primary)]">
        {t(locale, "publicar.preview.kicker")}
      </span>

      <article className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]">
        {/* Cover */}
        <div className="relative aspect-[4/5] w-full bg-[var(--color-surface-muted)]">
          <AnimatePresence mode="popLayout" initial={false}>
            {cover ? (
              <motion.img
                key={cover}
                src={cover}
                alt=""
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[var(--color-text-subtle)]"
              >
                <ImagePlus className="h-6 w-6" aria-hidden />
                <span className="px-4 text-center text-[11px] font-medium">
                  {t(locale, "publicar.preview.noPhoto")}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Review badge — every profile passes human review. */}
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[var(--color-foreground)]/75 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--color-surface)] backdrop-blur">
            <ShieldCheck className="h-2.5 w-2.5" aria-hidden />
            {t(locale, "publicar.preview.reviewBadge")}
          </span>

          {/* Name + location over a gradient scrim, like the catalog cards. */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--color-foreground)]/80 via-[var(--color-foreground)]/20 to-transparent p-3">
            <p
              className={`truncate text-base font-bold leading-tight ${
                hasName
                  ? "text-[var(--color-surface)]"
                  : "text-[var(--color-surface)]/60"
              }`}
            >
              {name}
            </p>
            {cityCategory && (
              <p className="truncate text-[11px] font-medium capitalize text-[var(--color-surface)]/85">
                {cityCategory}
              </p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-2.5 p-3">
          <p
            className={`text-[13px] font-bold ${
              details.pricePerHour
                ? "text-[var(--color-brand-primary)]"
                : "text-[var(--color-text-subtle)]"
            }`}
          >
            {price}
          </p>

          <p
            className={`line-clamp-2 text-[12px] leading-relaxed ${
              hasBio
                ? "text-[var(--color-text-muted)]"
                : "italic text-[var(--color-text-subtle)]"
            }`}
          >
            {shortBio}
          </p>

          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {chips.map((service) => (
                <span
                  key={service}
                  className="inline-flex items-center rounded-full bg-[var(--color-surface-muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)]"
                >
                  {service}
                </span>
              ))}
              {extraChips > 0 && (
                <span className="inline-flex items-center rounded-full bg-[var(--color-surface-muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-brand-primary)]">
                  {t(locale, "publicar.preview.moreServices", {
                    count: extraChips,
                  })}
                </span>
              )}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
