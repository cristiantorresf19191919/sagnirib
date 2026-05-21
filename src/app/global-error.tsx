"use client";

import { useEffect, useSyncExternalStore } from "react";

import { brandConfig, type SupportedLocale } from "@/core/branding/brand-config";
import { isSupportedLocale } from "@/core/i18n/constants";
import { t } from "@/core/i18n/messages";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Root-level boundary — only runs when the root layout itself throws.
 * Replaces `<html>` and `<body>`, so we cannot rely on theme tokens or
 * `globals.css` having loaded. Styles are inline and use literal brand
 * values to stay legible under the worst-case render path.
 *
 * Locale detection here is best-effort because the proxy's `x-locale`
 * header isn't visible to client components — we parse it from the
 * pathname after hydration and fall back to the default.
 */
function readLocaleFromPath(): SupportedLocale {
  if (typeof window === "undefined") return brandConfig.defaultLocale;
  const first = window.location.pathname.split("/", 2)[1] ?? "";
  return isSupportedLocale(first) ? first : brandConfig.defaultLocale;
}

const NOOP_SUBSCRIBE = () => () => {};
const getServerLocale = (): SupportedLocale => brandConfig.defaultLocale;

export default function GlobalError({
  error,
  reset,
}: Readonly<GlobalErrorProps>) {
  // useSyncExternalStore preserves SSR-safe hydration: server + first
  // client render both return defaultLocale; the post-hydration snapshot
  // then reads the actual locale from the path. No setState-in-effect.
  const locale = useSyncExternalStore(
    NOOP_SUBSCRIBE,
    readLocaleFromPath,
    getServerLocale,
  );

  useEffect(() => {
    console.error("[app] global boundary caught:", error);
  }, [error]);

  return (
    <html lang={locale}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F4EFE3",
          color: "#1A1814",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          padding: "2rem",
        }}
      >
        <main
          role="alert"
          style={{
            maxWidth: "28rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <p
            style={{
              fontSize: "0.6875rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.28em",
              color: "#2F5D43",
              margin: 0,
            }}
          >
            {t(locale, "error.globalKicker")}
          </p>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            {t(locale, "error.globalTitle")}
          </h1>
          <p
            style={{
              fontSize: "0.9375rem",
              lineHeight: 1.55,
              color: "#5A5247",
              margin: 0,
            }}
          >
            {t(locale, "error.globalBody")}
          </p>
          {error.digest ? (
            <p
              style={{
                fontSize: "0.6875rem",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "#7C7468",
                margin: 0,
              }}
            >
              {t(locale, "error.ref")} {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "0.5rem",
              height: "2.75rem",
              padding: "0 1.25rem",
              borderRadius: "9999px",
              border: "none",
              backgroundColor: "#2F5D43",
              color: "#F4EFE3",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t(locale, "error.globalRetry")}
          </button>
        </main>
      </body>
    </html>
  );
}
