"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  type LucideIcon,
} from "lucide-react";
import { useSyncExternalStore } from "react";

import {
  dismissToast,
  getServerToasts,
  getToasts,
  subscribe,
  type Toast,
  type ToastKind,
} from "./toast-store";

const KIND_ICON: Record<ToastKind, LucideIcon> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const KIND_ACCENT: Record<
  ToastKind,
  { ring: string; icon: string; rail: string }
> = {
  success: {
    ring: "ring-[var(--color-brand-primary)]/30",
    icon: "text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/12",
    rail: "bg-[var(--color-brand-primary)]",
  },
  error: {
    ring: "ring-[var(--color-brand-highlight)]/40",
    icon: "text-[var(--color-brand-highlight)] bg-[var(--color-brand-highlight)]/12",
    rail: "bg-[var(--color-brand-highlight)]",
  },
  info: {
    ring: "ring-[var(--color-border)]",
    icon: "text-[var(--color-foreground)] bg-[var(--color-surface-muted)]",
    rail: "bg-[var(--color-brand-secondary)]",
  },
};

/**
 * Global toast stack — mounts once at the root and renders any toast
 * pushed via `pushToast` / `toast.success(…)` / etc.
 *
 * Layout: bottom-center on mobile (avoids the sticky filters bar),
 * bottom-right on sm+ (Material Design + Vercel pattern). Each toast
 * carries a colored left rail that telegraphs `kind` at a glance, and
 * the dismiss button is always rendered for keyboard users even when
 * the toast auto-dismisses.
 *
 * Animation: framer-motion stagger via `AnimatePresence`. Toasts enter
 * from the bottom with a spring; exit fades + slides down.
 */
export function Toaster() {
  const items = useSyncExternalStore(subscribe, getToasts, getServerToasts);

  return (
    <div
      aria-live="polite"
      aria-label="Notificaciones"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:items-end sm:px-0"
    >
      <AnimatePresence initial={false}>
        {items.map((toast) => (
          <ToastCard key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastCardProps {
  toast: Toast;
}

function ToastCard({ toast }: Readonly<ToastCardProps>) {
  const Icon = KIND_ICON[toast.kind];
  const accent = KIND_ACCENT[toast.kind];
  return (
    <motion.div
      role={toast.kind === "error" ? "alert" : "status"}
      layout
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.5 }}
      className={`pointer-events-auto relative flex w-full max-w-[420px] items-start gap-3 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 pl-5 shadow-[var(--shadow-lg)] ring-1 ${accent.ring}`}
    >
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 w-1 ${accent.rail}`}
      />
      <span
        aria-hidden
        className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${accent.icon}`}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug text-[var(--color-foreground)]">
          {toast.title}
        </p>
        {toast.description && (
          <p className="mt-0.5 text-xs leading-snug text-[var(--color-text-muted)]">
            {toast.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismissToast(toast.id)}
        aria-label="Descartar notificación"
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </motion.div>
  );
}
