"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Clock, MapPinned, MessageSquare, X } from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useState, useTransition } from "react";

import { useAuthSession } from "@/features/auth/lib/use-auth-session";
import { toast } from "@/shared/ui/toast";

import { requestBooking } from "../actions/request-booking";

/**
 * UI mirror of the server-side `BOOKING_LIMITS` constant. See the source
 * in `src/server/biringas/booking-types.ts` — server is the source of
 * truth and rejects mismatched values via the schema. Keeping a copy
 * here so this client component stays free of any server-only import.
 */
const BOOKING_LIMITS = {
  messageMin: 12,
  messageMax: 1000,
} as const;

const DURATIONS = [1, 2, 3, 4, 8, 12, 24] as const;
const MEETING_TYPES = [
  { value: "outcall", label: "A domicilio", help: "Ella va al lugar acordado" },
  { value: "incall", label: "En su lugar", help: "Tú vas al lugar de ella" },
  { value: "videocall", label: "Videollamada", help: "100% remoto" },
] as const;
const CONTACT_PREFS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telegram", label: "Telegram" },
  { value: "platform", label: "Mensajería de Biringas" },
] as const;

interface BookingRequestModalProps {
  listingSlug: string;
  listingName: string;
  /** Default city of the encounter — pre-filled from listing data. */
  defaultCity?: string;
}

/**
 * Booking-request modal — the primary conversion surface on the profile
 * page. Opens from a sticky CTA; collects the buyer's intent (date +
 * duration + meeting type + message + contact preference) and posts to
 * the `requestBooking` Server Action.
 *
 * Anonymous users see a sign-in nudge inside the modal — the auth gate
 * is also enforced server-side, so this is UX, not security.
 *
 * Date input uses native `<input type="date">` for accessibility +
 * keyboard input; default value is set to "tomorrow" so the most common
 * case is one tap.
 */
export function BookingRequestModal({
  listingSlug,
  listingName,
  defaultCity,
}: Readonly<BookingRequestModalProps>) {
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
        data-testid="booking-request-cta"
        className="btn-pulse inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-6 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        <Calendar className="h-4 w-4" aria-hidden />
        Reservar encuentro
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <BookingRequestOverlay
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
  listingSlug: string;
  listingName: string;
  defaultCity?: string;
  onClose: () => void;
}

function BookingRequestOverlay({
  listingSlug,
  listingName,
  defaultCity,
  onClose,
}: Readonly<OverlayProps>) {
  const { status } = useAuthSession();
  const [proposedAt, setProposedAt] = useState(() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [durationHours, setDurationHours] = useState<number>(2);
  const [meetingType, setMeetingType] = useState<string>("outcall");
  const [contactPreference, setContactPreference] = useState<string>(
    "whatsapp",
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await requestBooking({
        listingSlug,
        proposedAt,
        durationHours,
        meetingType,
        contactPreference,
        message: message.trim(),
      });
      if (result.ok) {
        toast.success(
          "Solicitud enviada",
          `${listingName} recibirá tu propuesta y confirmará pronto.`,
        );
        onClose();
      } else {
        const friendly =
          result.error?.kind === "booking-disabled"
            ? "El sistema de reservas estará disponible muy pronto."
            : result.error?.message ?? "No pudimos enviar la solicitud.";
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
        aria-label="Cerrar"
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
              Reservar con {listingName}
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Tu propuesta llega como solicitud; ella confirma fecha y
              detalles antes de cualquier pago.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-[var(--color-background-elevated)] px-5 py-5 sm:px-7 sm:py-6">
          {status === "anonymous" ? (
            <AnonymousNudge onClose={onClose} />
          ) : status === "loading" ? (
            <p className="text-sm text-[var(--color-text-muted)]">Cargando…</p>
          ) : (
            <form
              onSubmit={onSubmit}
              data-testid="booking-request-form"
              className="flex flex-col gap-5"
            >
              {/* Date + duration row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field icon={Calendar} label="Fecha propuesta">
                  <input
                    type="date"
                    required
                    value={proposedAt}
                    onChange={(e) => setProposedAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
                  />
                </Field>
                <Field icon={Clock} label="Duración">
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
                  >
                    {DURATIONS.map((h) => (
                      <option key={h} value={h}>
                        {h === 24 ? "24 horas (overnight)" : `${h} hora${h === 1 ? "" : "s"}`}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Meeting type */}
              <Field icon={MapPinned} label="Tipo de encuentro">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {MEETING_TYPES.map((opt) => {
                    const checked = meetingType === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`group cursor-pointer rounded-[var(--radius-lg)] border p-3 text-left transition-[border-color,background] duration-150 ease-[var(--ease-standard)] ${
                          checked
                            ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/8"
                            : "border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-brand-primary-soft)]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="meetingType"
                          value={opt.value}
                          checked={checked}
                          onChange={() => setMeetingType(opt.value)}
                          className="sr-only"
                        />
                        <span className="block text-sm font-semibold text-[var(--color-foreground)]">
                          {opt.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-[var(--color-text-muted)]">
                          {opt.help}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </Field>

              {/* Contact preference */}
              <Field icon={MessageSquare} label="¿Cómo prefieres que te contacte?">
                <div className="flex flex-wrap gap-2">
                  {CONTACT_PREFS.map((opt) => {
                    const checked = contactPreference === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-[border-color,background,color] duration-150 ease-[var(--ease-standard)] ${
                          checked
                            ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]"
                            : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-muted)] hover:border-[var(--color-brand-primary-soft)] hover:text-[var(--color-foreground)]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="contactPreference"
                          value={opt.value}
                          checked={checked}
                          onChange={() => setContactPreference(opt.value)}
                          className="sr-only"
                        />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              </Field>

              {/* Message */}
              <Field icon={MessageSquare} label="Mensaje para ella">
                <textarea
                  required
                  minLength={BOOKING_LIMITS.messageMin}
                  maxLength={BOOKING_LIMITS.messageMax}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Contexto del encuentro${
                    defaultCity ? ` (ej: ${defaultCity}, hotel céntrico)` : ""
                  }. Mínimo ${BOOKING_LIMITS.messageMin} caracteres.`}
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
                  Tu identidad y contacto se comparten solo con {listingName}.
                </p>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-pulse inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPending ? "Enviando…" : "Enviar solicitud"}
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
}

function Field({ icon: Icon, label, children }: Readonly<FieldProps>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
        <Icon className="h-3 w-3" aria-hidden />
        {label}
      </span>
      {children}
    </label>
  );
}

function AnonymousNudge({ onClose }: Readonly<{ onClose: () => void }>) {
  return (
    <div className="flex flex-col gap-4 py-2">
      <p className="text-sm text-[var(--color-text-muted)]">
        Para enviar una solicitud de reserva, ingresa con tu cuenta — tu
        identidad nunca se publica y solo se comparte con ella tras la
        confirmación.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/ingresar"
          onClick={onClose}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)]"
        >
          Ingresar para reservar
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-foreground)]"
        >
          Más tarde
        </button>
      </div>
    </div>
  );
}
