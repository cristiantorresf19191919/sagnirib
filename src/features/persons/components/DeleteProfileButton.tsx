"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { t } from "@/core/i18n/messages";
import { deletePersonAction } from "@/features/persons/actions/delete-person";
import { toast } from "@/shared/ui/toast/toast-store";

interface DeleteProfileButtonProps {
  locale: SupportedLocale;
  personId: string;
  displayName: string;
  hasPublishedListing: boolean;
}

const OVERLAY: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const PANEL: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.98,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  },
};

/**
 * Trash icon button next to a profile card's contextual action.
 * Opens a confirm-by-typing modal (ADR-020) — the destructive button
 * stays disabled until the user types the displayName verbatim.
 *
 * When the parent person already has a published listing, the modal
 * is rendered in "blocked" mode: it explains the limitation and the
 * destructive button never enables. The trash trigger itself stays
 * clickable — pretending it's not there would just confuse the
 * partner UX where deleting an old modelo is a common ask.
 */
export function DeleteProfileButton({
  locale,
  personId,
  displayName,
  hasPublishedListing,
}: Readonly<DeleteProfileButtonProps>) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t(locale, "miCuenta.profile.action.delete", {
          name: displayName,
        })}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-[border-color,background,color,transform] duration-200 hover:-translate-y-[1px] hover:border-[var(--color-brand-highlight)]/55 hover:text-[var(--color-brand-highlight)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-highlight)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>

      <AnimatePresence>
        {open ? (
          <DeleteProfileModal
            locale={locale}
            personId={personId}
            displayName={displayName}
            hasPublishedListing={hasPublishedListing}
            onClose={() => setOpen(false)}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

interface DeleteProfileModalProps {
  locale: SupportedLocale;
  personId: string;
  displayName: string;
  hasPublishedListing: boolean;
  onClose: () => void;
}

/**
 * Modal mounts only while `open === true` in the parent, so the
 * `value` state below resets to "" on each open — no effect needed.
 */
function DeleteProfileModal({
  locale,
  personId,
  displayName,
  hasPublishedListing,
  onClose,
}: Readonly<DeleteProfileModalProps>) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputId = useId();

  // Body scroll lock for the lifetime of the modal.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const typedMatch = value.trim() === displayName.trim();
  const confirmEnabled = !hasPublishedListing && typedMatch && !submitting;

  function tryClose() {
    if (submitting) return;
    onClose();
  }

  async function onConfirm() {
    setSubmitting(true);
    try {
      const result = await deletePersonAction(personId);
      if (!result.ok) {
        toast.error(
          t(locale, "miCuenta.profile.delete.toast.error.title"),
          t(locale, "miCuenta.profile.delete.toast.error.body"),
        );
        setSubmitting(false);
        return;
      }
      if (result.outcome === "blocked-published-listing") {
        // Race: listing got published between page render and submit.
        toast.error(
          t(locale, "miCuenta.profile.delete.toast.blocked.title"),
          t(locale, "miCuenta.profile.delete.toast.blocked.body"),
        );
        setSubmitting(false);
        return;
      }
      toast.success(
        t(locale, "miCuenta.profile.delete.toast.success.title"),
        t(locale, "miCuenta.profile.delete.toast.success.body", {
          name: displayName,
        }),
      );
      onClose();
      // The dashboard re-fetches `getMyPersons` which now filters out
      // the soft-deleted row.
      router.refresh();
    } catch (err) {
      console.error("[delete-profile] action threw", err);
      toast.error(
        t(locale, "miCuenta.profile.delete.toast.error.title"),
        t(locale, "miCuenta.profile.delete.toast.error.body"),
      );
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      variants={OVERLAY}
      initial="hidden"
      animate="visible"
      exit="exit"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${inputId}-title`}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) tryClose();
      }}
    >
      <motion.div
        variants={PANEL}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative flex w-full max-w-md flex-col gap-5 overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-[var(--color-foreground)] shadow-[var(--shadow-2xl)] sm:p-7"
      >
        <button
          type="button"
          onClick={tryClose}
          aria-label={t(locale, "miCuenta.profile.delete.modal.cancel")}
          disabled={submitting}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-background-elevated)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <div className="flex flex-col gap-2 pr-8">
          <span
            aria-hidden
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-brand-highlight)]/12 text-[var(--color-brand-highlight)] ring-1 ring-[var(--color-brand-highlight)]/30"
          >
            <Trash2 className="h-5 w-5" aria-hidden />
          </span>
          <h2
            id={`${inputId}-title`}
            className="font-[var(--font-display)] text-xl font-[420] leading-[1.2] tracking-[-0.01em]"
          >
            {t(locale, "miCuenta.profile.delete.modal.title", {
              name: displayName,
            })}
          </h2>
          <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
            {hasPublishedListing
              ? t(locale, "miCuenta.profile.delete.modal.blocked.body")
              : t(locale, "miCuenta.profile.delete.modal.body")}
          </p>
        </div>

        {hasPublishedListing ? null : (
          <div className="flex flex-col gap-2">
            <label
              htmlFor={inputId}
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]"
            >
              {t(locale, "miCuenta.profile.delete.modal.typeToConfirm", {
                name: displayName,
              })}
            </label>
            <input
              id={inputId}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoComplete="off"
              autoFocus
              disabled={submitting}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background-elevated)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none transition-[border-color] duration-150 focus:border-[var(--color-brand-highlight)] disabled:cursor-not-allowed disabled:opacity-60"
              placeholder={displayName}
            />
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={tryClose}
            disabled={submitting}
            className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-xs font-semibold text-[var(--color-foreground)] transition-[background,border-color] duration-200 hover:bg-[var(--color-background-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t(locale, "miCuenta.profile.delete.modal.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!confirmEnabled}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[var(--color-brand-highlight)] px-5 text-xs font-semibold text-[var(--color-surface)] shadow-[var(--shadow-md)] transition-[background,transform,opacity] duration-200 hover:-translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-highlight)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            )}
            {t(locale, "miCuenta.profile.delete.modal.confirm")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
