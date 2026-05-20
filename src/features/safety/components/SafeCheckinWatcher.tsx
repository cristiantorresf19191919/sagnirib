"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  PhoneCall,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  buildAlertMessage,
  buildWhatsAppLink,
  useSafeCheckins,
  type SafeCheckin,
} from "../lib/use-safe-checkins";

/**
 * Global Safe Check-in surface. Mounted once in `Providers`.
 *
 *  - Polls the localStorage store every 15s while the tab is visible.
 *  - For `armed` check-ins, renders a compact countdown banner above
 *    the bottom edge (similar position to the BackOnlinePill but in a
 *    different colour family so they never get confused).
 *  - When a deadline crosses, transitions the entry to `alerting`
 *    and renders a modal that offers a one-tap WhatsApp alert to the
 *    trusted contact PLUS the "Estoy bien" all-clear button.
 *
 * Privacy contract: no network at any point. The contact data, the
 * deadlines, and the alert message all live and die on the device.
 * The only outbound channel is the user-initiated WhatsApp deep link.
 */
export function SafeCheckinWatcher() {
  const { checkins, resolve, cancel, markAlerting } = useSafeCheckins();
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const tick = () => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        return;
      }
      setNow(Date.now());
    };
    const id = window.setInterval(tick, 15_000);
    tick();
    return () => window.clearInterval(id);
  }, []);

  // Transition armed → alerting when the clock passes the deadline.
  useEffect(() => {
    for (const c of checkins) {
      if (c.status === "armed" && now >= c.deadlineMs) {
        markAlerting(c.id);
      }
    }
  }, [checkins, now, markAlerting]);

  const armed = useMemo(
    () => checkins.filter((c) => c.status === "armed"),
    [checkins],
  );
  const alerting = useMemo(
    () => checkins.find((c) => c.status === "alerting"),
    [checkins],
  );

  return (
    <>
      {alerting && (
        <SafeCheckinAlertModal
          checkin={alerting}
          onConfirmOk={() => resolve(alerting.id)}
          onDismiss={() => cancel(alerting.id)}
        />
      )}
      {!alerting && armed.length > 0 && (
        <SafeCheckinBanner
          checkin={armed[0]!}
          now={now}
          onConfirmOk={() => resolve(armed[0]!.id)}
          onCancel={() => cancel(armed[0]!.id)}
        />
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Active-checkin banner                                                      */
/* -------------------------------------------------------------------------- */

interface BannerProps {
  checkin: SafeCheckin;
  now: number;
  onConfirmOk: () => void;
  onCancel: () => void;
}

function SafeCheckinBanner({
  checkin,
  now,
  onConfirmOk,
  onCancel,
}: Readonly<BannerProps>) {
  const remainingMs = Math.max(0, checkin.deadlineMs - now);
  const minutes = Math.floor(remainingMs / 60_000);
  const seconds = Math.floor((remainingMs % 60_000) / 1000);

  return (
    <AnimatePresence>
      <motion.aside
        key="safe-checkin-banner"
        role="status"
        aria-live="polite"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{
          type: "spring",
          stiffness: 280,
          damping: 26,
          mass: 0.55,
        }}
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[115] flex items-end justify-center px-4 sm:bottom-auto sm:left-4 sm:top-20 sm:right-auto sm:items-start sm:justify-start sm:px-0"
      >
        <div className="pointer-events-auto flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-full border border-[var(--color-brand-accent)]/45 bg-[var(--color-surface)] py-2 pl-3 pr-2 shadow-[var(--shadow-lg)] ring-1 ring-[var(--color-brand-accent)]/20">
          <ShieldCheck
            className="h-4 w-4 shrink-0 text-[var(--color-brand-accent-strong)]"
            aria-hidden
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-xs font-semibold text-[var(--color-foreground)]">
              Safe Check-in activo
            </span>
            <span className="truncate text-[10px] text-[var(--color-text-muted)]">
              <Clock className="inline h-2.5 w-2.5" aria-hidden />{" "}
              {minutes}:{seconds.toString().padStart(2, "0")} restante
              {checkin.listingName ? ` · ${checkin.listingName}` : ""}
            </span>
          </div>
          <button
            type="button"
            onClick={onConfirmOk}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-[var(--color-brand-primary)] px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-surface)] transition-colors hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
          >
            Estoy bien
          </button>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancelar check-in"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
          >
            <X className="h-3 w-3" aria-hidden />
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/* Deadline-crossed alert modal                                               */
/* -------------------------------------------------------------------------- */

interface AlertProps {
  checkin: SafeCheckin;
  onConfirmOk: () => void;
  onDismiss: () => void;
}

function SafeCheckinAlertModal({
  checkin,
  onConfirmOk,
  onDismiss,
}: Readonly<AlertProps>) {
  const message = useMemo(() => buildAlertMessage(checkin), [checkin]);
  const waLink = useMemo(
    () => buildWhatsAppLink(checkin.trustedContact.phone, message),
    [checkin.trustedContact.phone, message],
  );

  return (
    <AnimatePresence>
      <motion.div
        key="safe-checkin-alert"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="safe-checkin-alert-title"
        className="fixed inset-0 z-[125] flex items-end justify-center sm:items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        <div
          aria-hidden
          className="absolute inset-0 bg-[rgba(15,3,8,0.7)] backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.97 }}
          transition={{
            type: "spring",
            stiffness: 280,
            damping: 28,
            mass: 0.6,
          }}
          className="relative z-10 m-0 flex w-full max-w-md flex-col gap-4 rounded-t-[var(--radius-2xl)] border border-[var(--color-brand-highlight)]/40 bg-[var(--color-surface)] p-6 shadow-[var(--shadow-lg)] sm:m-4 sm:rounded-[var(--radius-2xl)]"
        >
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-brand-highlight)]/15 text-[var(--color-brand-highlight)] ring-1 ring-[var(--color-brand-highlight)]/40"
            >
              <AlertTriangle className="h-6 w-6" aria-hidden />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <h2
                id="safe-checkin-alert-title"
                className="font-[var(--font-display)] text-xl font-[370] text-[var(--color-foreground)]"
              >
                ¿Estás bien?
              </h2>
              <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                Pasó el horario de tu Safe Check-in. Si todo está bien,
                tocá <strong>Estoy bien</strong>. Si necesitás ayuda, podés
                avisar a {checkin.trustedContact.name} con un toque.
              </p>
            </div>
          </div>

          {/* Pre-filled message preview */}
          <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background-elevated)] p-3 font-[var(--font-serif)] text-[12.5px] leading-relaxed text-[var(--color-foreground)]">
            {message}
          </pre>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <button
              type="button"
              onClick={onConfirmOk}
              className="btn-pulse inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Estoy bien
            </button>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                // Resolve once the user has acted, so the modal doesn't
                // re-fire next time they open the tab. They can always
                // arm a new check-in later from the booking surface.
                onDismiss();
              }}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--color-brand-highlight)]/50 bg-[var(--color-brand-highlight)]/12 px-5 text-sm font-semibold text-[var(--color-brand-highlight)] transition-colors hover:bg-[var(--color-brand-highlight)]/18 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-highlight)]"
            >
              <PhoneCall className="h-4 w-4" aria-hidden />
              Avisar a {checkin.trustedContact.name}
            </a>
          </div>

          <p className="text-center text-[10.5px] text-[var(--color-text-subtle)]">
            La alerta abre WhatsApp con un mensaje prearmado. Vos decidís si
            tocás <em>Enviar</em>. Nada sale de tu dispositivo sin tu confirmación.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
