"use client";

import { useSyncExternalStore } from "react";

const NOOP_SUBSCRIBE = () => () => {};
const SERVER_SNAPSHOT = () => false;
const CLIENT_SNAPSHOT = () => true;

/**
 * Returns `false` on the server and on the first client render (so SSR
 * markup hydrates cleanly), then flips to `true` after hydration.
 *
 * Use this when a client component must gate a portal, a `window`-only
 * API, or a browser-specific render path on having actually mounted in
 * the browser. Backed by `useSyncExternalStore` so it does not trigger
 * the `react-hooks/set-state-in-effect` lint that a manual
 * `useEffect(() => setMounted(true), [])` does.
 */
export function useClientMounted(): boolean {
  return useSyncExternalStore(
    NOOP_SUBSCRIBE,
    CLIENT_SNAPSHOT,
    SERVER_SNAPSHOT,
  );
}
