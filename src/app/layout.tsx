import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono, Newsreader } from "next/font/google";

import { brandConfig } from "@/core/branding/brand-config";
import { defaultMetadata } from "@/core/seo/default-metadata";
import {
  organizationJsonLd,
  websiteJsonLd,
} from "@/core/seo/structured-data";
import { AgeGate } from "@/features/age-gate/AgeGate";
import { readAgeAck } from "@/features/age-gate/cookie";
import { listMyFavorites } from "@/server/favorites";
import { ThemeScript } from "@/shared/layout/ThemeScript";
import "@/styles/globals.css";

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
}: Readonly<{ children: React.ReactNode }>) {
  const acknowledged = await readAgeAck();
  // SSR hydration for the favorites provider (ADR-013). Anonymous
  // sessions return an empty array — no auth error is thrown, so the
  // layout stays a single trivial await for both states.
  const initialFavorites = await listMyFavorites();

  return (
    <html
      lang={brandConfig.defaultLocale}
      className={`h-full antialiased ${sans.variable} ${mono.variable} ${display.variable} ${serif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)]">
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
          <AgeGate />
        )}
      </body>
    </html>
  );
}
