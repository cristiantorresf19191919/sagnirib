"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "biringas:safe-checkins:v1";

export type SafeCheckinStatus = "armed" | "alerting" | "resolved" | "cancelled";

export interface SafeCheckin {
  /** Identifier — derived from booking id when armed at booking time;
   *  otherwise a synthetic uuid for ad-hoc check-ins. */
  id: string;
  /** Optional human label so the user knows which booking this is. */
  listingName?: string;
  listingSlug?: string;
  city?: string;
  /** Pre-filled message + delivery channel for the trusted contact. */
  trustedContact: {
    name: string;
    /** E.164 phone (`+57…`) preferred for WhatsApp deep link. */
    phone: string;
  };
  /** Epoch ms — when the alert fires if not checked in. */
  deadlineMs: number;
  /** Set when the user taps "Estoy bien". */
  resolvedAt?: number;
  /** Set when the deadline crosses without check-in. */
  alertedAt?: number;
  status: SafeCheckinStatus;
}

/* -------------------------------------------------------------------------- */
/* Storage helpers                                                            */
/* -------------------------------------------------------------------------- */

function read(): SafeCheckin[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c): c is SafeCheckin =>
        c &&
        typeof c === "object" &&
        typeof c.id === "string" &&
        typeof c.deadlineMs === "number" &&
        typeof c.trustedContact?.phone === "string",
    );
  } catch {
    return [];
  }
}

function write(items: SafeCheckin[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Quota / private-mode failures are non-fatal.
  }
}

const listeners = new Set<() => void>();

function notify() {
  for (const cb of listeners) cb();
}

let cache: SafeCheckin[] | null = null;

function getAll(): SafeCheckin[] {
  if (cache === null) cache = read();
  return cache;
}

function setAll(next: SafeCheckin[]) {
  cache = next;
  write(next);
  notify();
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

export interface SafeCheckinsApi {
  ready: boolean;
  checkins: ReadonlyArray<SafeCheckin>;
  arm: (input: Omit<SafeCheckin, "id" | "status">) => SafeCheckin;
  resolve: (id: string) => void;
  cancel: (id: string) => void;
  markAlerting: (id: string) => void;
}

/**
 * Hook that exposes the safe-checkin store + mutators. All state lives
 * in localStorage — no server round-trip — which is the right privacy
 * default for a feature whose entire promise is "what happens stays on
 * your device unless YOU choose to send it."
 *
 * Tick semantics:
 *  - `arm()` writes a new entry and schedules nothing — the consumer
 *    that polls deadlines (SafeCheckinWatcher) handles transitions.
 *  - `resolve()` flips the status to `resolved` and keeps the record
 *    for ~24h so the UI can show a brief "checked in safely" trail.
 *  - `cancel()` is the explicit teardown; deletes the record.
 */
export function useSafeCheckins(): SafeCheckinsApi {
  const [items, setItems] = useState<ReadonlyArray<SafeCheckin>>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(getAll());
    setReady(true);
    const onChange = () => setItems(getAll().slice());
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  const arm = useCallback<SafeCheckinsApi["arm"]>((input) => {
    const id = `checkin-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const next: SafeCheckin = { ...input, id, status: "armed" };
    setAll([...getAll(), next]);
    return next;
  }, []);

  const resolve = useCallback<SafeCheckinsApi["resolve"]>((id) => {
    setAll(
      getAll().map((c) =>
        c.id === id ? { ...c, status: "resolved", resolvedAt: Date.now() } : c,
      ),
    );
  }, []);

  const cancel = useCallback<SafeCheckinsApi["cancel"]>((id) => {
    setAll(getAll().filter((c) => c.id !== id));
  }, []);

  const markAlerting = useCallback<SafeCheckinsApi["markAlerting"]>((id) => {
    setAll(
      getAll().map((c) =>
        c.id === id && c.status === "armed"
          ? { ...c, status: "alerting", alertedAt: Date.now() }
          : c,
      ),
    );
  }, []);

  return { ready, checkins: items, arm, resolve, cancel, markAlerting };
}

/**
 * Builds the WhatsApp deep-link the alert modal copies into the
 * trusted-contact's chat. International format is preserved — the
 * phone must come in already-cleaned (e.g. "+573001234567"). Falls
 * back to the universal share URL when the phone is malformed.
 */
export function buildWhatsAppLink(
  phone: string,
  message: string,
): string {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length < 8) {
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * Composes the alert text sent to the trusted contact when a check-in
 * deadline passes. Deliberately calm — the message announces the
 * automated nature so the recipient knows what to do.
 */
export function buildAlertMessage(checkin: SafeCheckin): string {
  const meta: string[] = [];
  if (checkin.listingName) meta.push(`con ${checkin.listingName}`);
  if (checkin.city) meta.push(`en ${checkin.city}`);
  const deadlineLabel = new Date(checkin.deadlineMs).toLocaleTimeString(
    "es-CO",
    { hour: "2-digit", minute: "2-digit" },
  );
  return [
    "Esta es una alerta automática de Safe Check-in (Biringas).",
    `No hice mi check-in del encuentro programado para las ${deadlineLabel} ${meta.join(" ")}.`,
    "Si todo está bien, probablemente me confirme en unos minutos.",
    "Si no recibís un mensaje mío en 15 minutos, por favor llamame o avisá a las autoridades.",
  ]
    .filter(Boolean)
    .join(" ");
}
