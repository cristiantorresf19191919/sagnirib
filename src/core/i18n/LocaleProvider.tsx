"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  brandConfig,
  type SupportedLocale,
} from "@/core/branding/brand-config";

const LocaleContext = createContext<SupportedLocale>(brandConfig.defaultLocale);

interface LocaleProviderProps {
  /** Locale resolved server-side by `readLocale()` and forwarded
   *  through `Providers`. Stays stable for the request. */
  value: SupportedLocale;
  children: ReactNode;
}

/**
 * React context that broadcasts the active locale to deep client
 * components. Populated from the root layout (server side) so the
 * first paint already carries the right value — no flicker.
 *
 * Why a context instead of prop-drilling: deep components like the
 * BookingRequestModal, the OnboardingQuiz, the gallery aria labels,
 * and the SafeCheckin surfaces all live many levels below the Header
 * and don't share a closest-common-parent that could thread a prop.
 * The context keeps each consumer self-contained.
 */
export function LocaleProvider({
  value,
  children,
}: Readonly<LocaleProviderProps>) {
  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

/**
 * Read the active locale from anywhere in the client tree. Returns
 * the brand default if the provider isn't mounted (shouldn't happen
 * in normal app rendering — the safety belt is for one-off Storybook
 * stories or isolated tests).
 */
export function useLocale(): SupportedLocale {
  return useContext(LocaleContext);
}
