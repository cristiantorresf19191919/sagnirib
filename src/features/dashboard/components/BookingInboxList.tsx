"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPinned,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import type {
  BookingMeetingType,
  BookingRequestRecord,
  BookingContactPreference,
} from "@/server/biringas";
import { toast } from "@/shared/ui/toast";

import { respondToBooking } from "../actions/respond-booking";
import { RateBuyerInline } from "./RateBuyerInline";

const STATUS_LABEL: Record<BookingRequestRecord["status"], string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  declined: "Rechazada",
  cancelled: "Cancelada",
  completed: "Completada",
};

const STATUS_CLS: Record<BookingRequestRecord["status"], string> = {
  pending:
    "border-[var(--color-brand-warn)]/45 bg-[var(--color-brand-warn)]/12 text-[var(--color-brand-accent-strong)]",
  confirmed:
    "border-[var(--color-brand-primary)]/40 bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary)]",
  declined:
    "border-[var(--color-brand-highlight)]/40 bg-[var(--color-brand-highlight)]/12 text-[var(--color-brand-highlight)]",
  cancelled:
    "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]",
  completed:
    "border-[var(--color-brand-secondary)]/40 bg-[var(--color-brand-secondary)]/12 text-[var(--color-brand-secondary-strong)]",
};

const MEETING_LABEL: Record<BookingMeetingType, string> = {
  outcall: "A domicilio",
  incall: "En su lugar",
  videocall: "Videollamada",
};

const CONTACT_LABEL: Record<BookingContactPreference, string> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  platform: "Mensajería Biringas",
};

const CONTACT_ICON: Record<BookingContactPreference, LucideIcon> = {
  whatsapp: MessageCircle,
  telegram: MessageCircle,
  platform: PhoneCall,
};

type Filter = "all" | BookingRequestRecord["status"];

interface BookingInboxListProps {
  initialBookings: ReadonlyArray<BookingRequestRecord>;
}

const DATE_FORMAT = new Intl.DateTimeFormat("es-CO", {
  weekday: "short",
  day: "numeric",
  month: "short",
});
const SUBMITTED_FORMAT = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Inbox list — incoming booking requests with confirm / decline /
 * complete actions.
 *
 * Initial data is server-fetched in `/mi-cuenta` and passed in as
 * `initialBookings`. Mutations call the `respondToBooking` server
 * action which enforces ownership server-side; this list updates
 * optimistically so the user feels instant. On error we roll back
 * and surface a toast.
 *
 * Filter chips collapse the list to a single status — handy when the
 * inbox grows past a couple dozen requests.
 */
export function BookingInboxList({
  initialBookings,
}: Readonly<BookingInboxListProps>) {
  const [bookings, setBookings] =
    useState<ReadonlyArray<BookingRequestRecord>>(initialBookings);
  const [filter, setFilter] = useState<Filter>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (filter === "all") return bookings;
    return bookings.filter((b) => b.status === filter);
  }, [bookings, filter]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: bookings.length,
      pending: 0,
      confirmed: 0,
      declined: 0,
      cancelled: 0,
      completed: 0,
    };
    for (const b of bookings) c[b.status] += 1;
    return c;
  }, [bookings]);

  const handleAction = (
    id: string,
    action: "confirmed" | "declined" | "completed",
  ) => {
    setPendingId(id);
    const before = bookings;
    // Optimistic update.
    setBookings(
      bookings.map((b) => (b.id === id ? { ...b, status: action } : b)),
    );
    startTransition(async () => {
      const result = await respondToBooking({ id, action });
      if (result.ok) {
        toast.success(
          action === "confirmed"
            ? "Reserva confirmada"
            : action === "declined"
              ? "Reserva rechazada"
              : "Reserva marcada como completada",
        );
      } else {
        setBookings(before);
        toast.error(
          "No pudimos actualizar la reserva",
          result.error?.message ?? "Intentá de nuevo en un momento.",
        );
      }
      setPendingId(null);
    });
  };

  if (bookings.length === 0) {
    return (
      <div className="rounded-[var(--radius-2xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/60 p-10 text-center">
        <p className="font-[var(--font-display)] text-xl font-[370] text-[var(--color-foreground)]">
          Aún sin solicitudes
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
          Cuando alguien envíe una propuesta a tu perfil, vas a verla aquí
          con todos los detalles antes de aceptar o rechazar.
        </p>
      </div>
    );
  }

  const filterChips: ReadonlyArray<{ key: Filter; label: string }> = [
    { key: "all", label: "Todas" },
    { key: "pending", label: "Pendientes" },
    { key: "confirmed", label: "Confirmadas" },
    { key: "completed", label: "Completadas" },
    { key: "declined", label: "Rechazadas" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Filter chips */}
      <div
        role="tablist"
        aria-label="Filtrar solicitudes"
        className="flex flex-wrap items-center gap-1.5"
      >
        {filterChips.map((c) => {
          const active = filter === c.key;
          return (
            <button
              key={c.key}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setFilter(c.key)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-[border-color,background,color] duration-150 ease-[var(--ease-standard)] ${
                active
                  ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-brand-primary-soft)] hover:text-[var(--color-foreground)]"
              }`}
            >
              {c.label}
              <span className="text-[10px] tabular-nums opacity-70">
                {counts[c.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <ul className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {filtered.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              busy={pendingId === booking.id && isPending}
              onAction={handleAction}
            />
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <li className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/60 p-6 text-center text-sm text-[var(--color-text-muted)]">
            Sin resultados para este filtro.
          </li>
        )}
      </ul>
    </div>
  );
}

interface BookingCardProps {
  booking: BookingRequestRecord;
  busy: boolean;
  onAction: (
    id: string,
    action: "confirmed" | "declined" | "completed",
  ) => void;
}

function BookingCard({ booking, busy, onAction }: Readonly<BookingCardProps>) {
  const ContactIcon = CONTACT_ICON[booking.contactPreference];
  const proposedDate = new Date(booking.proposedAt);
  const submittedDate = new Date(booking.submittedAt);
  const isPending = booking.status === "pending";
  const isConfirmed = booking.status === "confirmed";
  const isCompleted = booking.status === "completed";

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]"
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-background-elevated)] px-5 py-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
            {booking.listingSlug}
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-foreground)]">
            <Calendar
              className="h-4 w-4 text-[var(--color-brand-primary)]"
              aria-hidden
            />
            {DATE_FORMAT.format(proposedDate)} ·{" "}
            <span className="font-normal text-[var(--color-text-muted)]">
              {booking.durationHours}h · {MEETING_LABEL[booking.meetingType]}
            </span>
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${STATUS_CLS[booking.status]}`}
        >
          {isConfirmed && <CheckCircle2 className="h-3 w-3" aria-hidden />}
          {STATUS_LABEL[booking.status]}
        </span>
      </header>

      <div className="flex flex-col gap-4 px-5 py-4">
        <p className="font-[var(--font-serif)] text-sm leading-relaxed text-[var(--color-foreground)]">
          “{booking.message}”
        </p>

        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--color-text-muted)]">
          <li className="inline-flex items-center gap-1.5">
            <ContactIcon className="h-3 w-3" aria-hidden />
            {CONTACT_LABEL[booking.contactPreference]}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Clock className="h-3 w-3" aria-hidden />
            Recibida {SUBMITTED_FORMAT.format(submittedDate)}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <MapPinned className="h-3 w-3" aria-hidden />
            {MEETING_LABEL[booking.meetingType]}
          </li>
          <li className="inline-flex items-center gap-1.5 text-[var(--color-text-subtle)]">
            <ShieldCheck className="h-3 w-3" aria-hidden />
            ID solicitante oculto hasta confirmar
          </li>
        </ul>

        {isPending && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--color-border)]/60 pt-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => onAction(booking.id, "declined")}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-xs font-semibold text-[var(--color-foreground)] transition-colors duration-150 hover:border-[var(--color-brand-highlight)]/50 hover:bg-[var(--color-brand-highlight)]/8 hover:text-[var(--color-brand-highlight)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-highlight)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ThumbsDown className="h-3.5 w-3.5" aria-hidden />
              Rechazar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onAction(booking.id, "confirmed")}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--color-brand-primary)] px-4 text-xs font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
              {busy ? "Confirmando…" : "Confirmar"}
            </button>
          </div>
        )}

        {isConfirmed && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--color-border)]/60 pt-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => onAction(booking.id, "completed")}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--color-brand-primary)]/40 bg-[var(--color-brand-primary)]/10 px-3.5 text-xs font-semibold text-[var(--color-brand-primary)] transition-colors duration-150 hover:bg-[var(--color-brand-primary)]/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              Marcar como completada
            </button>
          </div>
        )}

        {isCompleted && (
          <div className="border-t border-[var(--color-border)]/60 pt-3">
            <RateBuyerInline
              bookingId={booking.id}
              existingRating={booking.buyerReview?.rating}
            />
          </div>
        )}
      </div>
    </motion.li>
  );
}

// Silence unused import — X is reserved for the future "cancel" affordance
// surfaced when the seller wants to cancel a previously confirmed booking.
void X;
