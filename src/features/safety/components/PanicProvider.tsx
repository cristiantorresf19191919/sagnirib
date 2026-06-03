"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { PanicNewsScreen } from "./PanicNewsScreen";

/**
 * Quick-exit ("panic") safety layer.
 *
 * Browsing an adult catalog in a shared or public space is risky — a partner,
 * relative or colleague glancing at the screen is the threat model. The panic
 * switch instantly paints a full-viewport, ordinary-looking news site over the
 * entire app (no header, no Biringas logo, nothing that hints at what was on
 * screen a second ago), and renames the browser tab to match. The real user
 * restores the site with a discreet gesture an onlooker wouldn't guess
 * (`Escape`, or clicking the news masthead).
 *
 * Mounted high in the provider tree so `usePanic().trigger()` is reachable
 * from any client component (e.g. the subtle header button) and so the overlay
 * sits above every page.
 */
interface PanicContextValue {
  active: boolean;
  trigger: () => void;
  release: () => void;
}

const PanicContext = createContext<PanicContextValue | null>(null);

export function usePanic(): PanicContextValue {
  const ctx = useContext(PanicContext);
  if (!ctx) {
    throw new Error("usePanic must be used within <PanicProvider>");
  }
  return ctx;
}

export function PanicProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);

  const trigger = useCallback(() => setActive(true), []);
  const release = useCallback(() => setActive(false), []);

  // While disguised: swap the tab title, freeze background scroll, and let the
  // user slip back out with Escape. Everything is restored on release.
  useEffect(() => {
    if (!active) return;
    const prevTitle = document.title;
    document.title = "El Espectador | Noticias de Colombia y el Mundo";
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setActive(false);
      }
    }
    window.addEventListener("keydown", onKey, true);

    return () => {
      document.title = prevTitle;
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey, true);
    };
  }, [active]);

  const value = useMemo<PanicContextValue>(
    () => ({ active, trigger, release }),
    [active, trigger, release],
  );

  return (
    <PanicContext.Provider value={value}>
      {children}
      {active && <PanicNewsScreen onExit={release} />}
    </PanicContext.Provider>
  );
}
