import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Fraunces, Geist, Geist_Mono, Newsreader } from "next/font/google";

import { brandConfig } from "@/core/branding/brand-config";
import { isSupportedLocale } from "@/core/i18n/constants";
import { defaultMetadata } from "@/core/seo/default-metadata";
import {
  organizationJsonLd,
  websiteJsonLd,
} from "@/core/seo/structured-data";
import { AgeGate } from "@/features/age-gate/AgeGate";
import { readAgeAck } from "@/features/age-gate/cookie";
import { listMyFavorites } from "@/server/favorites";
import { ThemeScript } from "@/shared/layout/ThemeScript";
import {
  DEFAULT_THEME,
  isValidTheme,
  THEME_COOKIE,
} from "@/shared/layout/theme-cookie";
import "@/styles/globals.css";
import "@/shared/layout/mobile-nav.css";

import { Providers } from "./providers";

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

/**
 * Editorial display + serif body — used by the cinematic hero on `/` and
 * any future magazine-style surfaces. Loaded with `display: "swap"` so the
 * Geist UI typography keeps Lighthouse green; serif appears once Fraunces
 * is ready and re-flows naturally.
 */
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz", "SOFT"],
  style: ["normal", "italic"],
});

const serif = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F4EFE3",
};

/**
 * Statically pre-render every supported locale at build time. Per ADR-017
 * the `[lang]` segment is the canonical source of truth for the active
 * locale, and `proxy.ts` redirects unprefixed URLs to the user's
 * preferred locale. Any value outside `brandConfig.supportedLocales`
 * returns 404 via the `notFound()` guard below.
 */
export function generateStaticParams() {
  return brandConfig.supportedLocales.map((lang) => ({ lang }));
}

/**
 * Inline JSON-LD payload via JSX children. Browsers do not execute
 * `application/ld+json`, and JSON.stringify renders only data we own — so
 * this stays safe without an extra escaping pass.
 */
function JsonLdScript({ data }: { data: unknown }) {
  return (
    <script type="application/ld+json">{JSON.stringify(data)}</script>
  );
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  // Run the layout's data reads concurrently — they're independent, so this
  // collapses three serial round-trips (age-ack cookie, favorites Firestore
  // read, theme cookie) into one, shaving latency off every navigation.
  // SSR hydration for the favorites provider (ADR-013): anonymous sessions
  // return an empty array (no auth error), so it's safe for both states.
  const [acknowledged, initialFavorites, cookieStore] = await Promise.all([
    readAgeAck(),
    listMyFavorites(),
    cookies(),
  ]);

  // SSR the theme attribute from the cookie so navigations that re-render
  // the layout (e.g. router.refresh() after the locale switcher) keep
  // the user's chosen mood instead of momentarily resetting to default.
  const themeFromCookie = cookieStore.get(THEME_COOKIE)?.value;
  const activeTheme = isValidTheme(themeFromCookie)
    ? themeFromCookie
    : DEFAULT_THEME;

  return (
    <html
      lang={lang}
      data-theme={activeTheme}
      className={`h-full antialiased ${sans.variable} ${mono.variable} ${display.variable} ${serif.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)]">
        {/*
         * Theme pre-paint script. `next/script` with `beforeInteractive`
         * is auto-hoisted into <head> by Next, so placement in body is
         * intentional — keeps the React tree out of <head> entirely.
         */}
        <ThemeScript />
        {/*
         * Brand-wide structured data per home SEO Route Contract — emitted
         * once at the layout root so every page inherits it. Page-level
         * schemas are added separately when their contract requires them.
         */}
        <JsonLdScript data={organizationJsonLd()} />
        <JsonLdScript data={websiteJsonLd()} />

        {acknowledged ? (
          <Providers initialFavorites={initialFavorites}>{children}</Providers>
        ) : (
          <AgeGate locale={lang} />
        )}
      </body>
    </html>
  );
}
