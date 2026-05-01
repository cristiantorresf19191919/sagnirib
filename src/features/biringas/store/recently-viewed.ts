"use client";

const STORAGE_KEY = "biringas:recently-viewed:v1";
const MAX_ENTRIES = 12;

/**
 * Snapshot of a profile the user has visited. Kept tiny on purpose — only
 * what we need to render a thumbnail card without a server round-trip.
 *
 * Stored client-side in `localStorage`; server never sees it. If the schema
 * needs to grow, bump the storage key suffix (`v1` → `v2`) so old entries
 * are silently dropped instead of mis-parsed.
 */
export interface RecentEntry {
  id: string;
  slug: string;
  name: string;
  image: string;
  city: string;
  /** Pre-formatted price string (e.g. "$200.000 / hora"). */
  price: string;
  /** ISO timestamp of when the user viewed the profile. */
  viewedAt: string;
}

interface Snapshot {
  entries: ReadonlyArray<RecentEntry>;
  /** Flips to true once we've read localStorage at least once on the client. */
  ready: boolean;
}

const SERVER_SNAPSHOT: Snapshot = Object.freeze({ entries: [], ready: false });

let cache: Snapshot = SERVER_SNAPSHOT;
let storageBound = false;
const listeners = new Set<() => void>();

function isEntry(value: unknown): value is RecentEntry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.slug === "string" &&
    typeof v.name === "string" &&
    typeof v.image === "string" &&
    typeof v.city === "string" &&
    typeof v.price === "string" &&
    typeof v.viewedAt === "string"
  );
}

function read(): RecentEntry[] {
  if (globalThis.window === undefined) return [];
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry);
  } catch {
    return [];
  }
}

function write(entries: ReadonlyArray<RecentEntry>) {
  if (globalThis.window === undefined) return;
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage disabled (private mode, quota) — silent no-op.
  }
}

function ensureHydrated() {
  if (cache !== SERVER_SNAPSHOT) return;
  if (globalThis.window === undefined) return;
  cache = { entries: read(), ready: true };
  if (!storageBound) {
    storageBound = true;
    globalThis.addEventListener("storage", (e) => {
      if (e.key !== STORAGE_KEY) return;
      cache = { entries: read(), ready: true };
      emit();
    });
  }
}

function emit() {
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  ensureHydrated();
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): Snapshot {
  ensureHydrated();
  return cache;
}

export function getServerSnapshot(): Snapshot {
  return SERVER_SNAPSHOT;
}

/**
 * Push a profile to the front of the recently-viewed list, deduping by id
 * and capping at `MAX_ENTRIES`. Idempotent — calling it twice in a row with
 * the same listing is safe and only updates `viewedAt`.
 */
export function recordView(entry: Omit<RecentEntry, "viewedAt">) {
  ensureHydrated();
  const stamped: RecentEntry = { ...entry, viewedAt: new Date().toISOString() };
  const without = cache.entries.filter((e) => e.id !== entry.id);
  const next = [stamped, ...without].slice(0, MAX_ENTRIES);
  cache = { entries: next, ready: true };
  write(next);
  emit();
}

/** Test-only / settings escape hatch — clears all recently-viewed entries. */
export function clearRecentlyViewed() {
  ensureHydrated();
  cache = { entries: [], ready: true };
  write([]);
  emit();
}
