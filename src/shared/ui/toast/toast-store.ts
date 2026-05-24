"use client";

/**
 * Tiny in-memory toast store.
 *
 * Pub/sub pattern using a Set of listeners so any component can subscribe
 * via `useSyncExternalStore` without prop drilling. The store is module-
 * scoped (lives for the life of the SPA), so toasts fired from anywhere
 * — server-action callbacks, theme toggles, store hooks — surface in the
 * one global Toaster mounted in the root provider.
 *
 * Why hand-rolled instead of `sonner` / `react-hot-toast`: this project
 * already uses framer-motion for overlay animation and avoids dependencies
 * that bring their own un-themed styles. ~120 lines for a fully theme-
 * tokenised toast is the cheaper trade.
 */

export type ToastKind = "success" | "error" | "info";

export interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
  /** Auto-dismiss after this many ms. `null` keeps the toast until dismissed. */
  durationMs: number | null;
}

const listeners = new Set<() => void>();
let toasts: ReadonlyArray<Toast> = [];

function emit() {
  for (const cb of listeners) cb();
}

export function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getToasts(): ReadonlyArray<Toast> {
  return toasts;
}

const EMPTY_TOASTS: ReadonlyArray<Toast> = [];

export function getServerToasts(): ReadonlyArray<Toast> {
  return EMPTY_TOASTS;
}

let counter = 0;
function nextId() {
  counter += 1;
  return `toast-${Date.now()}-${counter}`;
}

interface PushArgs {
  kind?: ToastKind;
  title: string;
  description?: string;
  /** ms to auto-dismiss. Defaults: success 3500, info 4000, error 6000. */
  durationMs?: number | null;
}

export function pushToast({
  kind = "info",
  title,
  description,
  durationMs,
}: PushArgs): string {
  const id = nextId();
  const defaultDuration =
    kind === "error" ? 6000 : kind === "success" ? 3500 : 4000;
  const finalDuration =
    durationMs === undefined ? defaultDuration : durationMs;
  const toast: Toast = {
    id,
    kind,
    title,
    description,
    durationMs: finalDuration,
  };
  toasts = [...toasts, toast];
  emit();
  if (finalDuration !== null) {
    if (typeof window !== "undefined") {
      window.setTimeout(() => dismissToast(id), finalDuration);
    }
  }
  return id;
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

/* Convenience helpers — call sites read better than `pushToast({ kind: "success", … })`. */
export const toast = {
  success: (title: string, description?: string) =>
    pushToast({ kind: "success", title, description }),
  error: (title: string, description?: string) =>
    pushToast({ kind: "error", title, description }),
  info: (title: string, description?: string) =>
    pushToast({ kind: "info", title, description }),
};
