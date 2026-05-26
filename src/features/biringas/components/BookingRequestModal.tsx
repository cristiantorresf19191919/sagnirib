"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Clock, MapPinned, MessageSquare, X } from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { usePathname } from "next/navigation";
import type { SupportedLocale } from "@/core/branding/brand-config";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";
import { useAuthSession } from "@/features/auth/lib/use-auth-session";
import { useClientMounted } from "@/shared/lib/use-client-mounted";
import { toast } from "@/shared/ui/toast";

import { requestBooking } from "../actions/request-booking";
import {
  composeProposedAt,
  firstAvailableDay,
  firstAvailableSlot,
  getUpcomingAvailability,
  type Slot,
} from "../lib/availability";
import { BookingDatePicker } from "./BookingDatePicker";

const BOOKING_LIMITS = {
  messageMin: 12,
  messageMax: 1000,
} as const;

const DURATIONS = [1, 2, 3, 4, 8, 12, 24] as const;
const MEETING_TYPES = ["outcall", "incall", "videocall"] as const;
const CONTACT_PREFS = ["whatsapp", "telegram", "platform"] as const;

interface BookingRequestModalProps {
  listingSlug: string;
  listingName: string;
  defaultCity?: string;
}

export function BookingRequestModal({
  listingSlug,
  listingName,
  defaultCity,
}: Readonly<BookingRequestModalProps>) {
  const locale = useActiveLocale();
  const [open, setOpen] = useState(false);
  const mounted = useClientMounted();

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
        data-testid="booking-request-cta"
        className="btn-pulse inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-6 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        <Calendar className="h-4 w-4" aria-hidden />
        {t(locale, "booking.cta")}
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <BookingRequestOverlay
                locale={locale}
                listingSlug={listingSlug}
                listingName={listingName}
                defaultCity={defaultCity}
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
  locale: SupportedLocale;
  listingSlug: string;
  listingName: string;
  defaultCity?: string;
  onClose: () => void;
}

function BookingRequestOverlay({
  locale,
  listingSlug,
  listingName,
  defaultCity,
  onClose,
}: Readonly<OverlayProps>) {
  const { status } = useAuthSession();

  const upcomingDays = useMemo(
    () => getUpcomingAvailability(listingSlug, 14),
    [listingSlug],
  );
  const initialDay = useMemo(
    () => firstAvailableDay(upcomingDays),
    [upcomingDays],
  );
  const [proposedDate, setProposedDate] = useState<string>(
    () => initialDay.isoDate,
  );
  const [proposedSlot, setProposedSlot] = useState<Slot>(
    () => firstAvailableSlot(initialDay),
  );
  const handleDateChange = useCallback(
    (next: { date: string; slot: Slot }) => {
      setProposedDate(next.date);
      setProposedSlot(next.slot);
    },
    [],
  );
  const [durationHours, setDurationHours] = useState<number>(2);
  const [meetingType, setMeetingType] = useState<string>("outcall");
  const [contactPreference, setContactPreference] = useState<string>("whatsapp");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await requestBooking({
        listingSlug,
        proposedAt: composeProposedAt(proposedDate, proposedSlot),
        durationHours,
        meetingType,
        contactPreference,
        message: message.trim(),
      });
      if (result.ok) {
        toast.success(
          t(locale, "booking.toast.title"),
          t(locale, "booking.toast.body", { name: listingName }),
        );
        onClose();
      } else {
        const friendly =
          result.error?.kind === "booking-disabled"
            ? t(locale, "booking.error.disabled")
            : result.error?.message ?? t(locale, "booking.error.default");
        setError(friendly);
      }
    });
  };

  return (
    <motion.div
      key="booking-overlay"
      className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-title"
    >
      <button
        type="button"
        aria-label={t(locale, "booking.modal.close")}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[rgba(20,28,24,0.55)] backdrop-blur-sm"
      />
      <motion.div
        layout
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 280, damping: 28, mass: 0.6 }}
        className="relative z-10 m-0 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-background-elevated)] shadow-[var(--shadow-lg)] sm:m-4 sm:max-h-[88vh] sm:max-w-xl sm:rounded-[var(--radius-2xl)]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 sm:px-7">
          <div className="flex min-w-0 flex-col">
            <h2
              id="booking-title"
              className="text-base font-semibold tracking-tight text-[var(--color-foreground)] sm:text-lg"
            >
              {t(locale, "booking.modal.title", { name: listingName })}
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              {t(locale, "booking.modal.subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(locale, "booking.modal.close")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-[var(--color-background-elevated)] px-5 py-5 sm:px-7 sm:py-6">
          {status === "anonymous" ? (
            <AnonymousNudge locale={locale} onClose={onClose} />
          ) : status === "loading" ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              {t(locale, "booking.modal.loading")}
            </p>
          ) : (
            <form
              onSubmit={onSubmit}
              data-testid="booking-request-form"
              className="flex flex-col gap-5"
            >
              <Field
                icon={Calendar}
                label={t(locale, "booking.field.date")}
                help={t(locale, "booking.field.date.help")}
              >
                <BookingDatePicker
                  listingSlug={listingSlug}
                  selectedDate={proposedDate}
                  selectedSlot={proposedSlot}
                  onChange={handleDateChange}
                />
              </Field>
              <Field icon={Clock} label={t(locale, "booking.field.duration")}>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30 sm:max-w-[50%]"
                >
                  {DURATIONS.map((h) => (
                    <option key={h} value={h}>
                      {h === 24
                        ? t(locale, "booking.field.duration.overnight")
                        : t(
                            locale,
                            h === 1
                              ? "booking.field.duration.hour.singular"
                              : "booking.field.duration.hour.plural",
                            { n: h },
                          )}
                    </option>
                  ))}
                </select>
              </Field>

              {/* Meeting type */}
              <Field
                icon={MapPinned}
                label={t(locale, "booking.field.meetingType")}
              >
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {MEETING_TYPES.map((value) => {
                    const checked = meetingType === value;
                    return (
                      <label
                        key={value}
                        className={`group cursor-pointer rounded-[var(--radius-lg)] border p-3 text-left transition-[border-color,background] duration-150 ease-[var(--ease-standard)] ${
                          checked
                            ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/8"
                            : "border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-brand-primary-soft)]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="meetingType"
                          value={value}
                          checked={checked}
                          onChange={() => setMeetingType(value)}
                          className="sr-only"
                        />
                        <span className="block text-sm font-semibold text-[var(--color-foreground)]">
                          {t(locale, `booking.meetingType.${value}.label`)}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-[var(--color-text-muted)]">
                          {t(locale, `booking.meetingType.${value}.help`)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </Field>

              {/* Contact preference */}
              <Field
                icon={MessageSquare}
                label={t(locale, "booking.field.contact")}
              >
                <div className="flex flex-wrap gap-2">
                  {CONTACT_PREFS.map((value) => {
                    const checked = contactPreference === value;
                    return (
                      <label
                        key={value}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-[border-color,background,color] duration-150 ease-[var(--ease-standard)] ${
                          checked
                            ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]"
                            : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-muted)] hover:border-[var(--color-brand-primary-soft)] hover:text-[var(--color-foreground)]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="contactPreference"
                          value={value}
                          checked={checked}
                          onChange={() => setContactPreference(value)}
                          className="sr-only"
                        />
                        {t(locale, `booking.contact.${value}`)}
                      </label>
                    );
                  })}
                </div>
              </Field>

              {/* Message */}
              <Field
                icon={MessageSquare}
                label={t(locale, "booking.field.message")}
              >
                <textarea
                  required
                  minLength={BOOKING_LIMITS.messageMin}
                  maxLength={BOOKING_LIMITS.messageMax}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    defaultCity
                      ? t(locale, "booking.field.message.placeholderWithCity", {
                          city: defaultCity,
                          min: BOOKING_LIMITS.messageMin,
                        })
                      : t(locale, "booking.field.message.placeholder", {
                          min: BOOKING_LIMITS.messageMin,
                        })
                  }
                  rows={4}
                  className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-sm leading-relaxed text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
                />
                <span className="mt-1 block self-end text-right text-[10px] tabular-nums text-[var(--color-text-subtle)]">
                  {message.length} / {BOOKING_LIMITS.messageMax}
                </span>
              </Field>

              {error && (
                <p
                  role="alert"
                  className="rounded-[var(--radius-md)] border border-[var(--color-brand-highlight)]/40 bg-[var(--color-brand-highlight)]/10 px-3 py-2 text-xs text-[var(--color-brand-highlight)]"
                >
                  {error}
                </p>
              )}

              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] text-[var(--color-text-subtle)]">
                  {t(locale, "booking.privacy", { name: listingName })}
                </p>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-pulse inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPending
                    ? t(locale, "booking.submitting")
                    : t(locale, "booking.submit")}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

interface FieldProps {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  children: React.ReactNode;
  help?: string;
}

function Field({ icon: Icon, label, children, help }: Readonly<FieldProps>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
        <Icon className="h-3 w-3" aria-hidden />
        {label}
      </span>
      {help && (
        <span className="text-[11px] leading-snug text-[var(--color-text-muted)]">
          {help}
        </span>
      )}
      {children}
    </label>
  );
}

function AnonymousNudge({
  locale,
  onClose,
}: Readonly<{ locale: SupportedLocale; onClose: () => void }>) {
  const pathname = usePathname();
  const ingresarBase = localizedHref(locale, "/ingresar");
  const ingresarHref = pathname
    ? `${ingresarBase}?next=${encodeURIComponent(pathname)}`
    : ingresarBase;
  return (
    <div className="flex flex-col gap-4 py-2">
      <p className="text-sm text-[var(--color-text-muted)]">
        {t(locale, "booking.anonymous.body")}
      </p>
      <div className="flex items-center gap-3">
        <Link
          href={ingresarHref}
          onClick={onClose}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)]"
        >
          {t(locale, "booking.anonymous.cta")}
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-foreground)]"
        >
          {t(locale, "booking.anonymous.later")}
        </button>
      </div>
    </div>
  );
}
