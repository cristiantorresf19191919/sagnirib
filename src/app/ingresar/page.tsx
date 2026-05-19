import type { Metadata } from "next";

import { Container } from "@/shared/design-system/components/Container";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";
import { SignInForm } from "@/features/auth/components/SignInForm";

/**
 * Sign-in route.
 *
 * SEO: noindex — auth surfaces should not be indexable.
 *
 * Copy is BRAND_HANDSHAKE_TODO across the page — a writer can search for
 * that token to find every visible string.
 */

export const metadata: Metadata = {
  title: "Ingresar",
  robots: { index: false, follow: false },
};

export default function IngresarPage() {
  return (
    <>
      <Header hideCatalogCta />
      <main className="relative isolate bg-[var(--color-background)] py-20 sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_50%_0%,rgba(47,93,67,0.08),transparent_60%)]"
        />
        <Container width="narrow">
          <div className="mx-auto flex max-w-sm flex-col gap-7">
            <header className="flex flex-col gap-3">
              <span className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-brand-primary)]">
                <span
                  aria-hidden
                  className="inline-block h-px w-8 bg-gradient-to-r from-[var(--color-gold)] to-transparent"
                />
                Acceso
              </span>
              {/* BRAND_HANDSHAKE_TODO: page heading */}
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-[var(--color-foreground)] sm:text-4xl">
                Iniciar sesión
              </h1>
              {/* BRAND_HANDSHAKE_TODO: page subhead */}
              <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                Accedé con tu email o cuenta de Google.
              </p>
            </header>

            <SignInForm />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
