import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { brandConfig } from "@/core/branding/brand-config";
import { defaultMetadata } from "@/core/seo/default-metadata";
import {
  organizationJsonLd,
  websiteJsonLd,
} from "@/core/seo/structured-data";
import { AgeGate } from "@/features/age-gate/AgeGate";
import { readAgeAck } from "@/features/age-gate/cookie";
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

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08060C",
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

  return (
    <html
      lang={brandConfig.defaultLocale}
      className={`h-full antialiased ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)]">
        {/*
         * Brand-wide structured data per home SEO Route Contract — emitted
         * once at the layout root so every page inherits it. Page-level
         * schemas are added separately when their contract requires them.
         */}
        <JsonLdScript data={organizationJsonLd()} />
        <JsonLdScript data={websiteJsonLd()} />

        {acknowledged ? <Providers>{children}</Providers> : <AgeGate />}
      </body>
    </html>
  );
}
