"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "biringas:saved-searches";
const MAX_SAVED = 12;

export interface SavedSearch {
  id: string;
  /** Human label (e.g. "Bogotá · Top rated"). */
  label: string;
  /** Replay URL — usually `/explorar?…`. */
  href: string;
  /** ISO timestamp of when this search was saved. */
  savedAt: string;
}

interface SavedSearchesApi {
  ready: boolean;
  searches: ReadonlyArray<SavedSearch>;
  /** Save a new search. Idempotent on `href` — duplicates collapse. */
  save: (input: { label: string; href: string }) => SavedSearch;
  remove: (id: string) => void;
  clear: () => void;
}

function readFromStorage(): SavedSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SavedSearch =>
        typeof item?.id === "string" &&
        typeof item?.label === "string" &&
        typeof item?.href === "string" &&
        typeof item?.savedAt === "string",
    );
  } catch {
    return [];
  }
}

function writeToStorage(items: SavedSearch[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Quota / private-mode failures are non-fatal.
  }
}

/* --- Module-level store ---------------------------------------------------
 * Hoisting the cache + listeners outside the hook gives us a `useSyncExternalStore`-
 * compatible source. That keeps the hydration story clean (server snapshot
 * = empty + not-ready; client snapshot = hydrated from localStorage) without
 * the `react-hooks/set-state-in-effect` warning a manual `useState`/`useEffect`
 * pair triggers.
 */
const EMPTY: ReadonlyArray<SavedSearch> = [];
let cache: ReadonlyArray<SavedSearch> | null = null;
const listeners = new Set<() => void>();

function ensureCache(): ReadonlyArray<SavedSearch> {
  if (cache === null) cache = readFromStorage();
  return cache;
}

function setCache(next: ReadonlyArray<SavedSearch>) {
  cache = next;
  writeToStorage([...next]);
  for (const cb of listeners) cb();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

const getServerSearches = () => EMPTY;
const getServerReady = () => false;
const getClientReady = () => cache !== null;

/**
 * Tiny saved-searches store backed by localStorage.
 *
 * No global provider — each consumer hydrates independently after mount
 * (`ready` guard avoids SSR/CSR text mismatches). Idempotent on `href`
 * so re-saving the same search bumps it to the top instead of growing
 * a stack of duplicates.
 *
 * Designed to be drop-in swappable for a Firestore-backed
 * `user_saved_searches` collection later: the public API (`save` /
 * `remove` / `clear`) stays identical; only the storage layer changes.
 */
export function useSavedSearches(): SavedSearchesApi {
  const searches = useSyncExternalStore(
    subscribe,
    ensureCache,
    getServerSearches,
  );
  const ready = useSyncExternalStore(subscribe, getClientReady, getServerReady);

  const save = useCallback<SavedSearchesApi["save"]>(({ label, href }) => {
    const id = `saved-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const next: SavedSearch = {
      id,
      label: label.trim(),
      href,
      savedAt: new Date().toISOString(),
    };
    const current = ensureCache();
    const deduped = current.filter((s) => s.href !== href);
    const updated = [next, ...deduped].slice(0, MAX_SAVED);
    setCache(updated);
    return next;
  }, []);

  const remove = useCallback<SavedSearchesApi["remove"]>((id) => {
    const current = ensureCache();
    setCache(current.filter((s) => s.id !== id));
  }, []);

  const clear = useCallback<SavedSearchesApi["clear"]>(() => {
    setCache(EMPTY);
  }, []);

  return { ready, searches, save, remove, clear };
}
