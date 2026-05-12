import type { Metadata } from "next";

import { Container } from "@/shared/design-system/components/Container";
import { SignUpForm } from "@/features/auth/components/SignUpForm";

/**
 * Sign-up route. Funnel-only — never indexable.
 *
 * Copy is BRAND_HANDSHAKE_TODO across the page.
 */

export const metadata: Metadata = {
  title: "Crear cuenta",
  robots: { index: false, follow: false },
};

export default function RegistrarsePage() {
  return (
    <Container width="narrow" className="py-16 sm:py-24">
      <div className="mx-auto flex max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-2">
          {/* BRAND_HANDSHAKE_TODO: page heading */}
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            Crear cuenta
          </h1>
          {/* BRAND_HANDSHAKE_TODO: page subhead */}
          <p className="text-sm text-[var(--color-text-muted)]">
            Necesitás una cuenta para publicar tu perfil o dejar reseñas.
          </p>
        </div>

        <SignUpForm />
      </div>
    </Container>
  );
}
