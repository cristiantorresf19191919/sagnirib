import type { Metadata } from "next";

import { Container } from "@/shared/design-system/components/Container";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

/**
 * Password recovery route. Funnel-only — never indexable.
 *
 * Copy is BRAND_HANDSHAKE_TODO across the page.
 */

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  robots: { index: false, follow: false },
};

export default function RecuperarPage() {
  return (
    <Container width="narrow" className="py-16 sm:py-24">
      <div className="mx-auto flex max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-2">
          {/* BRAND_HANDSHAKE_TODO */}
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            Recuperar contraseña
          </h1>
          {/* BRAND_HANDSHAKE_TODO */}
          <p className="text-sm text-[var(--color-text-muted)]">
            Te enviamos un correo con instrucciones para reestablecer tu acceso.
          </p>
        </div>

        <ResetPasswordForm />
      </div>
    </Container>
  );
}
