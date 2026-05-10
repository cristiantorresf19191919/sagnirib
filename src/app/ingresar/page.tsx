import type { Metadata } from "next";

import { Container } from "@/shared/design-system/components/Container";
import { SignInForm } from "@/features/auth/components/SignInForm";

/**
 * Sign-in route.
 *
 * SEO: noindex — auth surfaces should not be indexable. (When the SEO
 * Route Contract for `/ingresar` is written, this metadata moves into the
 * `buildPageMetadata` factory; for now an inline noindex is safe.)
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
    <Container width="narrow" className="py-16 sm:py-24">
      <div className="mx-auto flex max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-2">
          {/* BRAND_HANDSHAKE_TODO: page heading */}
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            Iniciar sesión
          </h1>
          {/* BRAND_HANDSHAKE_TODO: page subhead */}
          <p className="text-sm text-[var(--color-text-muted)]">
            Accedé con tu email o cuenta de Google.
          </p>
        </div>

        <SignInForm />
      </div>
    </Container>
  );
}
