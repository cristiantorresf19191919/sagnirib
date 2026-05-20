"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Root-level boundary — only runs when the root layout itself throws.
 * Replaces `<html>` and `<body>`, so we cannot rely on theme tokens or
 * `globals.css` having loaded. Styles are inline and use literal brand
 * values to stay legible under the worst-case render path.
 */
export default function GlobalError({
  error,
  reset,
}: Readonly<GlobalErrorProps>) {
  useEffect(() => {
    console.error("[app] global boundary caught:", error);
  }, [error]);

  return (
    <html lang="es">
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
            Error inesperado
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
            Algo se rompió del lado nuestro.
          </h1>
          <p
            style={{
              fontSize: "0.9375rem",
              lineHeight: 1.55,
              color: "#5A5247",
              margin: 0,
            }}
          >
            Estamos al tanto. Probá recargar — si sigue sin funcionar, intentá
            de nuevo en unos minutos.
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
              Ref: {error.digest}
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
            Intentar de nuevo
          </button>
        </main>
      </body>
    </html>
  );
}
