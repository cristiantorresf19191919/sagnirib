"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";

import { useAuthSession } from "@/features/auth/lib/use-auth-session";

import {
  addFavoriteAction,
  removeFavoriteAction,
  syncAnonymousFavoritesAction,
} from "../actions/favorites";

const STORAGE_KEY = "biringas:favorites:v1";
const SLUGS_STORAGE_KEY = "biringas:favorites:slugs:v1";
const COMPARE_KEY = "biringas:favorites:compare:v1";
const SYNCED_USER_KEY = "biringas:favorites:synced-uid:v1";
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
  /**
   * Toggle a favorite. `listingSlug` is required when the toggle could
   * fire a server-side `addFavorite` (i.e. for authenticated users) —
   * the server uses it as the slug snapshot per ADR-013. Anonymous
   * toggles ignore it.
   */
  toggleFavorite: (id: string, listingSlug?: string) => void;
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

/**
 * Slug map kept alongside the favorite ids so the dual-write code path
 * can pass `listingSlug` to the server action without a roundtrip back
 * to the catalog. Populated whenever `toggleFavorite` is called with a
 * slug; surviving entries from a previous session simply default to
 * the id when missing (the server schema still validates).
 */
function readSlugMap(): Record<string, string> {
  if (globalThis.window === undefined) return {};
  try {
    const raw = globalThis.localStorage.getItem(SLUGS_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "string") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function writeSlugMap(map: Record<string, string>) {
  if (globalThis.window === undefined) return;
  try {
    globalThis.localStorage.setItem(SLUGS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

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

/**
 * Local-only toggle. Returns whether the listing ended up favorited so
 * the caller can decide which server action to dispatch.
 */
function toggleFavoriteValue(id: string): boolean {
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
  return !isFav;
}

/** Rolls back a failed dual-write — restores the prior favorited state. */
function rollbackFavorite(id: string, wasFavorited: boolean) {
  ensureHydrated();
  const currentlyFav = cache.favorites.includes(id);
  if (currentlyFav === wasFavorited) return; // already in the right state
  const nextFavorites = wasFavorited
    ? [...cache.favorites, id]
    : cache.favorites.filter((v) => v !== id);
  commit({ favorites: nextFavorites });
}

/**
 * Merges a server-side favorites snapshot into the local cache (union,
 * never delete). Called when the provider mounts with an
 * `initialFavorites` hydrated from `listMyFavorites()` SSR, and again
 * after a sign-in syncs the anonymous shortlist with the server.
 */
function mergeServerFavorites(serverIds: ReadonlyArray<string>) {
  ensureHydrated();
  if (serverIds.length === 0) return;
  const existing = new Set(cache.favorites);
  const merged = [...cache.favorites];
  for (const id of serverIds) {
    if (!existing.has(id)) {
      merged.push(id);
      existing.add(id);
    }
  }
  if (merged.length === cache.favorites.length) return;
  commit({ favorites: merged });
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
  /**
   * Server-fetched favorites for the current session (ADR-013).
   * Merged with the localStorage shortlist on mount — union, never
   * delete. Empty / undefined for anonymous visitors.
   */
  initialFavorites?: ReadonlyArray<string>;
}

export function FavoritesProvider({
  children,
  initialFavorites,
}: Readonly<ProviderProps>) {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const { status, user } = useAuthSession();
  const isAuthed = status === "authenticated" && !!user;
  const uid = user?.uid ?? null;

  /**
   * One-shot hydration with the SSR favorites snapshot. The provider
   * gets a fresh `initialFavorites` on each request, so we key the
   * effect on the array reference + length to avoid re-merging the
   * same data after a refresh.
   */
  const seededRef = useRef<string | null>(null);
  useEffect(() => {
    if (!initialFavorites || initialFavorites.length === 0) return;
    const sig = initialFavorites.slice().sort().join(",");
    if (seededRef.current === sig) return;
    seededRef.current = sig;
    mergeServerFavorites(initialFavorites);
  }, [initialFavorites]);

  /**
   * Anonymous → signed-in merge. Once per (uid, session lifetime),
   * upload whatever the user had in localStorage so favorites pile up
   * onto the server side. Stored as a flag in localStorage so a
   * reload doesn't re-fire the sync.
   */
  useEffect(() => {
    if (!isAuthed || !uid) return;
    if (globalThis.window === undefined) return;
    const syncedUid = globalThis.localStorage.getItem(SYNCED_USER_KEY);
    if (syncedUid === uid) return;
    const localIds = readArray(STORAGE_KEY);
    if (localIds.length === 0) {
      globalThis.localStorage.setItem(SYNCED_USER_KEY, uid);
      return;
    }
    const slugs = readSlugMap();
    const items = localIds.map((id) => ({
      listingId: id,
      // Fallback to the id itself when no slug snapshot exists — the
      // server schema accepts any [a-z0-9-] string of the right length;
      // it will not match a real listing but the merge still succeeds
      // and the display layer renders an empty card placeholder. New
      // toggles always carry the real slug.
      listingSlug: (slugs[id] ?? id).toLowerCase(),
    }));
    let cancelled = false;
    void syncAnonymousFavoritesAction({ items }).then((res) => {
      if (cancelled) return;
      if (res.ok && globalThis.window !== undefined) {
        globalThis.localStorage.setItem(SYNCED_USER_KEY, uid);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthed, uid]);

  const toggleFavorite = useCallback(
    (id: string, listingSlug?: string) => {
      // Always remember the latest slug we've seen for this id — used
      // by both the immediate dual-write and the future anonymous →
      // signed-in merge if the user logs in later in the session.
      if (listingSlug && globalThis.window !== undefined) {
        const slugs = readSlugMap();
        if (slugs[id] !== listingSlug) {
          slugs[id] = listingSlug;
          writeSlugMap(slugs);
        }
      }
      const nowFavorited = toggleFavoriteValue(id);
      if (!isAuthed) return;
      // Fire-and-forget. Rollback on failure (network, auth expired,
      // limit reached). The optimistic UI already moved; the rollback
      // moves it back so the user sees the truth.
      void (nowFavorited
        ? addFavoriteAction({
            listingId: id,
            listingSlug: (listingSlug ?? id).toLowerCase(),
          })
        : removeFavoriteAction({ listingId: id })
      ).then((res) => {
        if (!res.ok) rollbackFavorite(id, !nowFavorited);
      });
    },
    [isAuthed],
  );

  const value = useMemo<FavoritesValue>(
    () => ({
      favorites: snapshot.favorites,
      compareIds: snapshot.compare,
      ready: snapshot.ready,
      isFavorite: (id) => snapshot.favorites.includes(id),
      isComparing: (id) => snapshot.compare.includes(id),
      toggleFavorite,
      toggleCompare: toggleCompareValue,
      setCompare: setCompareValue,
      clearCompare: clearCompareValue,
    }),
    [snapshot, toggleFavorite],
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
