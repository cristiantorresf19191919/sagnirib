"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";

import { useLocale } from "@/core/i18n/LocaleProvider";
import { t } from "@/core/i18n/messages";
import { toast } from "@/shared/ui/toast";

import { useSafeCheckins } from "../lib/use-safe-checkins";

interface SafeCheckinSetupProps {
  /** Booking the check-in is anchored to (optional — ad-hoc check-ins
   *  work too). Used as the surface label and as part of the alert
   *  message context. */
  listingName?: string;
  listingSlug?: string;
  city?: string;
  /** Default deadline = now + this many minutes (the duration of the
   *  encounter the user just booked + a 30-min buffer). */
  defaultMinutes: number;
  /** Called after the user arms a check-in or dismisses the surface. */
  onClose: () => void;
}

const BUFFER_PRESETS = [60, 120, 240] as const;

/**
 * Inline setup card for a new Safe Check-in. Designed to surface
 * right after a booking is filed — the modal can replace its body
 * with this card so the user doesn't have to navigate anywhere.
 *
 * Three controls:
 *   1. Trusted contact name + phone (E.164 preferred).
 *   2. Buffer minutes — how long after the agreed end-time before
 *      the alert fires.
 *   3. Two CTAs: "Activar" arms the check-in; "Más tarde" dismisses
 *      the card without arming.
 *
 * No server call. Everything stays in localStorage.
 */
export function SafeCheckinSetup({
  listingName,
  listingSlug,
  city,
  defaultMinutes,
  onClose,
}: Readonly<SafeCheckinSetupProps>) {
  const locale = useLocale();
  const { arm } = useSafeCheckins();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bufferMin, setBufferMin] = useState<number>(BUFFER_PRESETS[1]);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError(t(locale, "safe.contactNameMissing"));
      return;
    }
    const digits = phone.replace(/[^\d+]/g, "");
    if (digits.length < 8) {
      setError(t(locale, "safe.whatsappInvalid"));
      return;
    }
    const totalMs = (defaultMinutes + bufferMin) * 60_000;
    arm({
      listingName,
      listingSlug,
      city,
      trustedContact: { name: name.trim(), phone: digits },
      deadlineMs: Date.now() + totalMs,
    });
    toast.success(
      t(locale, "safe.toast.title"),
      t(locale, "safe.toastShort", {
        hours: Math.round((defaultMinutes + bufferMin) / 60),
      }),
    );
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-4 rounded-[var(--radius-2xl)] border border-[var(--color-brand-primary)]/35 bg-[var(--color-brand-primary)]/6 p-5"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)] text-[var(--color-surface)] shadow-[var(--shadow-sm)]"
        >
          <ShieldCheck className="h-5 w-5" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-primary)]">
            <Sparkles className="h-3 w-3" aria-hidden />
            {t(locale, "safe.eyebrow")}
          </span>
          <h3 className="mt-1 text-base font-semibold text-[var(--color-foreground)]">
            {t(locale, "safe.heading")}
          </h3>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-muted)]">
            {t(locale, "safe.body")}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
              {t(locale, "safe.contactNameLabel")}
            </span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t(locale, "safe.namePlaceholder")}
              maxLength={40}
              className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
              {t(locale, "safe.whatsappLabelShort")}
            </span>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t(locale, "safe.whatsappPlaceholder")}
              inputMode="tel"
              autoComplete="tel"
              className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
            />
          </label>
        </div>

        <fieldset className="flex flex-col gap-1">
          <legend className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
            {t(locale, "safe.notifyMe")}{" "}
            {defaultMinutes >= 60
              ? t(locale, "safe.afterHours", { n: defaultMinutes / 60 })
              : t(locale, "safe.afterMinutes", { n: defaultMinutes })}{" "}
            +
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {BUFFER_PRESETS.map((mins) => {
              const active = bufferMin === mins;
              return (
                <label
                  key={mins}
                  className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-[border-color,background,color] duration-150 ease-[var(--ease-standard)] ${
                    active
                      ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-brand-primary-soft)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="buffer"
                    value={mins}
                    checked={active}
                    onChange={() => setBufferMin(mins)}
                    className="sr-only"
                  />
                  {mins >= 60
                    ? t(locale, "safe.bufferHoursShort", { n: mins / 60 })
                    : t(locale, "safe.bufferMinutesShort", { n: mins })}
                </label>
              );
            })}
          </div>
        </fieldset>

        {error && (
          <p
            role="alert"
            className="text-[11px] text-[var(--color-brand-highlight)]"
          >
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-foreground)]"
          >
            {t(locale, "safe.skip")}
          </button>
          <button
            type="submit"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--color-brand-primary)] px-4 text-xs font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            {t(locale, "safe.activateShort")}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
