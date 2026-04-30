"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "biringas:favorites:v1";
const COMPARE_KEY = "biringas:favorites:compare:v1";
export const COMPARE_LIMIT = 3;

interface FavoritesValue {
  favorites: ReadonlyArray<string>;
  compareIds: ReadonlyArray<string>;
  isFavorite: (id: string) => boolean;
  isComparing: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  toggleCompare: (id: string) => void;
  /** Replace the comparison tray with the given ids (capped at COMPARE_LIMIT). */
  setCompare: (ids: ReadonlyArray<string>) => void;
  clearCompare: () => void;
  /** True after the first hydration tick — gate UI that depends on store. */
  ready: boolean;
}

const Ctx = createContext<FavoritesValue | null>(null);

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
    // localStorage may be disabled (private mode quota, etc.) — silent no-op
  }
}

interface ProviderProps {
  children: React.ReactNode;
}

export function FavoritesProvider({ children }: Readonly<ProviderProps>) {
  const [favorites, setFavorites] = useState<ReadonlyArray<string>>([]);
  const [compareIds, setCompareIds] = useState<ReadonlyArray<string>>([]);
  const [ready, setReady] = useState(false);

  // Hydrate from localStorage after mount to keep SSR markup stable.
  useEffect(() => {
    setFavorites(readArray(STORAGE_KEY));
    setCompareIds(readArray(COMPARE_KEY));
    setReady(true);
  }, []);

  // Sync favorites across tabs.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setFavorites(readArray(STORAGE_KEY));
      if (e.key === COMPARE_KEY) setCompareIds(readArray(COMPARE_KEY));
    }
    globalThis.addEventListener("storage", onStorage);
    return () => globalThis.removeEventListener("storage", onStorage);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id)
        ? prev.filter((v) => v !== id)
        : [...prev, id];
      writeArray(STORAGE_KEY, next);
      return next;
    });
    // Removing from favorites also removes from compare tray.
    setCompareIds((prev) => {
      if (!prev.includes(id)) return prev;
      const next = prev.filter((v) => v !== id);
      writeArray(COMPARE_KEY, next);
      return next;
    });
  }, []);

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      let next: string[];
      if (prev.includes(id)) {
        next = prev.filter((v) => v !== id);
      } else if (prev.length >= COMPARE_LIMIT) {
        // Drop the oldest, append the new one — keeps the tray in motion.
        next = [...prev.slice(1), id];
      } else {
        next = [...prev, id];
      }
      writeArray(COMPARE_KEY, next);
      return next;
    });
  }, []);

  const setCompare = useCallback((ids: ReadonlyArray<string>) => {
    const next = ids.slice(0, COMPARE_LIMIT);
    setCompareIds(next);
    writeArray(COMPARE_KEY, next);
  }, []);

  const clearCompare = useCallback(() => {
    setCompareIds([]);
    writeArray(COMPARE_KEY, []);
  }, []);

  const value = useMemo<FavoritesValue>(
    () => ({
      favorites,
      compareIds,
      ready,
      isFavorite: (id) => favorites.includes(id),
      isComparing: (id) => compareIds.includes(id),
      toggleFavorite,
      toggleCompare,
      setCompare,
      clearCompare,
    }),
    [
      favorites,
      compareIds,
      ready,
      toggleFavorite,
      toggleCompare,
      setCompare,
      clearCompare,
    ],
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
