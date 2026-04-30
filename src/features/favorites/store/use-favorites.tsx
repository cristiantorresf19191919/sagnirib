"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

const STORAGE_KEY = "biringas:favorites:v1";
const COMPARE_KEY = "biringas:favorites:compare:v1";
export const COMPARE_LIMIT = 3;

interface Snapshot {
  favorites: ReadonlyArray<string>;
  compare: ReadonlyArray<string>;
  /** Flips to true once we've read localStorage at least once on the client. */
  ready: boolean;
}

interface FavoritesValue {
  favorites: ReadonlyArray<string>;
  compareIds: ReadonlyArray<string>;
  isFavorite: (id: string) => boolean;
  isComparing: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  toggleCompare: (id: string) => void;
  setCompare: (ids: ReadonlyArray<string>) => void;
  clearCompare: () => void;
  ready: boolean;
}

/* ------------------------------------------------------------------------ */
/* External store                                                           */
/*                                                                          */
/* This file owns the favorites + compare state in a module-level cache so  */
/* React can subscribe via `useSyncExternalStore`. Why: the React 19        */
/* `react-hooks/set-state-in-effect` rule rejects the older "hydrate via    */
/* useEffect → setState" pattern, and useSyncExternalStore is the canonical */
/* way to subscribe to an external mutable source while keeping SSR snapshots*/
/* stable.                                                                  */
/* ------------------------------------------------------------------------ */

const SERVER_SNAPSHOT: Snapshot = Object.freeze({
  favorites: [],
  compare: [],
  ready: false,
});

let cache: Snapshot = SERVER_SNAPSHOT;
let storageBound = false;
const listeners = new Set<() => void>();

function readArray(key: string): string[] {
  if (globalThis.window === undefined) return [];
  try {
    const raw = globalThis.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

function writeArray(key: string, value: ReadonlyArray<string>) {
  if (globalThis.window === undefined) return;
  try {
    globalThis.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage may be disabled (private mode, quota) — silent no-op.
  }
}

function ensureHydrated() {
  if (cache !== SERVER_SNAPSHOT) return;
  if (globalThis.window === undefined) return;
  cache = {
    favorites: readArray(STORAGE_KEY),
    compare: readArray(COMPARE_KEY),
    ready: true,
  };
  if (!storageBound) {
    storageBound = true;
    globalThis.addEventListener("storage", (e) => {
      if (e.key !== STORAGE_KEY && e.key !== COMPARE_KEY) return;
      cache = {
        favorites: readArray(STORAGE_KEY),
        compare: readArray(COMPARE_KEY),
        ready: true,
      };
      emit();
    });
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  ensureHydrated();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Snapshot {
  ensureHydrated();
  return cache;
}

function getServerSnapshot(): Snapshot {
  return SERVER_SNAPSHOT;
}

function commit(next: { favorites?: ReadonlyArray<string>; compare?: ReadonlyArray<string> }) {
  cache = {
    favorites: next.favorites ?? cache.favorites,
    compare: next.compare ?? cache.compare,
    ready: true,
  };
  if (next.favorites !== undefined) writeArray(STORAGE_KEY, next.favorites);
  if (next.compare !== undefined) writeArray(COMPARE_KEY, next.compare);
  emit();
}

function toggleFavoriteValue(id: string) {
  ensureHydrated();
  const isFav = cache.favorites.includes(id);
  const nextFavorites = isFav
    ? cache.favorites.filter((v) => v !== id)
    : [...cache.favorites, id];
  // Removing from favorites also drops it from the compare tray.
  const nextCompare = cache.compare.includes(id)
    ? cache.compare.filter((v) => v !== id)
    : cache.compare;
  commit({ favorites: nextFavorites, compare: nextCompare });
}

function toggleCompareValue(id: string) {
  ensureHydrated();
  let next: string[];
  if (cache.compare.includes(id)) {
    next = cache.compare.filter((v) => v !== id);
  } else if (cache.compare.length >= COMPARE_LIMIT) {
    // Drop the oldest, append — keeps the tray in motion when full.
    next = [...cache.compare.slice(1), id];
  } else {
    next = [...cache.compare, id];
  }
  commit({ compare: next });
}

function setCompareValue(ids: ReadonlyArray<string>) {
  ensureHydrated();
  commit({ compare: ids.slice(0, COMPARE_LIMIT) });
}

function clearCompareValue() {
  ensureHydrated();
  commit({ compare: [] });
}

/* ------------------------------------------------------------------------ */
/* React bindings                                                           */
/* ------------------------------------------------------------------------ */

const Ctx = createContext<FavoritesValue | null>(null);

interface ProviderProps {
  children: React.ReactNode;
}

export function FavoritesProvider({ children }: Readonly<ProviderProps>) {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const value = useMemo<FavoritesValue>(
    () => ({
      favorites: snapshot.favorites,
      compareIds: snapshot.compare,
      ready: snapshot.ready,
      isFavorite: (id) => snapshot.favorites.includes(id),
      isComparing: (id) => snapshot.compare.includes(id),
      toggleFavorite: toggleFavoriteValue,
      toggleCompare: toggleCompareValue,
      setCompare: setCompareValue,
      clearCompare: clearCompareValue,
    }),
    [snapshot],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFavorites(): FavoritesValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useFavorites must be used inside <FavoritesProvider />");
  }
  return ctx;
}
