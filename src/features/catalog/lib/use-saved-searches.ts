"use client";

import { useCallback, useEffect, useState } from "react";

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
  const [searches, setSearches] = useState<ReadonlyArray<SavedSearch>>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSearches(readFromStorage());
    setReady(true);
  }, []);

  const save = useCallback<SavedSearchesApi["save"]>(({ label, href }) => {
    const id = `saved-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const next: SavedSearch = {
      id,
      label: label.trim(),
      href,
      savedAt: new Date().toISOString(),
    };
    setSearches((prev) => {
      const deduped = prev.filter((s) => s.href !== href);
      const updated = [next, ...deduped].slice(0, MAX_SAVED);
      writeToStorage(updated);
      return updated;
    });
    return next;
  }, []);

  const remove = useCallback<SavedSearchesApi["remove"]>((id) => {
    setSearches((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      writeToStorage(updated);
      return updated;
    });
  }, []);

  const clear = useCallback<SavedSearchesApi["clear"]>(() => {
    setSearches([]);
    writeToStorage([]);
  }, []);

  return { ready, searches, save, remove, clear };
}
