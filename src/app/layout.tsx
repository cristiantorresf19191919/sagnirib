import type { Metadata, Viewport } from "next";

import { brandConfig } from "@/core/branding/brand-config";
import { defaultMetadata } from "@/core/seo/default-metadata";
import "@/styles/globals.css";

import { Providers } from "./providers";

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08060C",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang={brandConfig.defaultLocale}
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
