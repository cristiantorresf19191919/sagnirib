"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Flag, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState, useTransition } from "react";

import { useLocale } from "@/core/i18n/LocaleProvider";
import { t } from "@/core/i18n/messages";
import { toast } from "@/shared/ui/toast";

import { reportListing } from "../actions/report-listing";

/** Mirror of the server-side REPORT_REASONS list. Kept here so this
 *  client component avoids any server-only import; server is the source
 *  of truth and rejects unknown reasons. */
const REPORT_REASONS = [
  { value: "fake_photos", labelKey: "report.reason.photos" },
  { value: "scam", labelKey: "report.reason.scam" },
  { value: "harassment", labelKey: "report.reason.harassment" },
  { value: "minor_concern", labelKey: "report.reason.safety" },
  { value: "underage", labelKey: "report.reason.minor" },
  { value: "spam", labelKey: "report.reason.spam" },
  { value: "other", labelKey: "report.reason.other" },
] as const;

const DETAIL_MAX = 1000;

interface ReportListingMenuProps {
  listingSlug: string;
  listingName: string;
}

/**
 * Discreet report affordance on the profile page. Renders a small
 * outline icon button that opens a typed-reason modal. The reason set
 * mirrors the server schema; on submit fires a toast and closes the
 * modal regardless of whether the reporter is authenticated (anonymous
 * reports are allowed for safety-critical categories — see the barrel's
 * `reportListing` docstring).
 */
export function ReportListingMenu({
  listingSlug,
  listingName,
}: Readonly<ReportListingMenuProps>) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t(locale, "report.triggerAria", { name: listingName })}
        title={t(locale, "report.title")}
        data-testid="report-listing-trigger"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-colors duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-brand-highlight)]/40 hover:bg-[var(--color-brand-highlight)]/8 hover:text-[var(--color-brand-highlight)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-highlight)]"
      >
        <Flag className="h-4 w-4" aria-hidden />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <ReportOverlay
                listingSlug={listingSlug}
                listingName={listingName}
                onClose={() => setOpen(false)}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

interface OverlayProps {
  listingSlug: string;
  listingName: string;
  onClose: () => void;
}

function ReportOverlay({
  listingSlug,
  listingName,
  onClose,
}: Readonly<OverlayProps>) {
  const locale = useLocale();
  const [reason, setReason] = useState<string>("");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const requiresDetail = reason === "other";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError(t(locale, "report.chooseReason"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await reportListing({
        listingSlug,
        reason,
        detail: detail.trim() || undefined,
      });
      if (result.ok) {
        toast.success(
          t(locale, "report.successTitle"),
          t(locale, "report.successBody"),
        );
        onClose();
      } else {
        setError(result.error?.message ?? t(locale, "report.failed"));
      }
    });
  };

  return (
    <motion.div
      key="report-overlay"
      className="fixed inset-0 z-[130] flex items-end justify-center sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-title"
    >
      <button
        type="button"
        aria-label={t(locale, "report.cancel")}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[rgba(20,28,24,0.55)] backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 280, damping: 28, mass: 0.6 }}
        className="relative z-10 m-0 flex w-full max-h-[92dvh] flex-col overflow-hidden rounded-t-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-background-elevated)] shadow-[var(--shadow-lg)] sm:m-4 sm:max-h-[88vh] sm:max-w-md sm:rounded-[var(--radius-2xl)]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
          <div className="flex min-w-0 flex-col">
            <h2
              id="report-title"
              className="text-base font-semibold tracking-tight text-[var(--color-foreground)]"
            >
              {t(locale, "report.titleWithName", { name: listingName })}
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              {t(locale, "report.confidential")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(locale, "report.cancel")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>

        <form
          onSubmit={onSubmit}
          data-testid="report-listing-form"
          className="flex flex-col gap-4 overflow-y-auto bg-[var(--color-background-elevated)] px-5 py-5 sm:px-6 sm:py-6"
        >
          <fieldset className="flex flex-col gap-2">
            <legend className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
              {t(locale, "report.legend")}
            </legend>
            {REPORT_REASONS.map((r) => {
              const checked = reason === r.value;
              return (
                <label
                  key={r.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-[var(--radius-lg)] border p-3 transition-[border-color,background] duration-150 ease-[var(--ease-standard)] ${
                    checked
                      ? "border-[var(--color-brand-highlight)]/60 bg-[var(--color-brand-highlight)]/8"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand-highlight)]/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={checked}
                    onChange={() => setReason(r.value)}
                    className="mt-0.5 h-4 w-4 accent-[var(--color-brand-highlight)]"
                  />
                  <span className="text-sm text-[var(--color-foreground)]">
                    {t(locale, r.labelKey)}
                  </span>
                </label>
              );
            })}
          </fieldset>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
              {t(locale, "report.detailLabel")}{" "}
              {requiresDetail
                ? t(locale, "report.detailRequired")
                : t(locale, "report.detailOptional")}
            </span>
            <textarea
              required={requiresDetail}
              maxLength={DETAIL_MAX}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder={t(locale, "report.detailPlaceholder")}
              rows={3}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-sm leading-relaxed text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-highlight)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-highlight)]/30"
            />
            <span className="self-end text-[10px] tabular-nums text-[var(--color-text-subtle)]">
              {detail.length} / {DETAIL_MAX}
            </span>
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-[var(--radius-md)] border border-[var(--color-brand-highlight)]/40 bg-[var(--color-brand-highlight)]/10 px-3 py-2 text-xs text-[var(--color-brand-highlight)]"
            >
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-foreground)]"
            >
              {t(locale, "report.cancel")}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-brand-highlight)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[0_8px_22px_-10px_rgba(196,81,75,0.45)] transition-[background,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:bg-[var(--color-brand-highlight)]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-highlight)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending
                ? t(locale, "report.submitting")
                : t(locale, "report.submit")}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
