import { brandConfig } from "@/core/branding/brand-config";
import { Container } from "@/shared/design-system/components/Container";
import { Logo } from "@/shared/design-system/components/Logo";

import { acknowledgeAge } from "./action";

/**
 * Full-page age acknowledgment interstitial.
 *
 * Renders only when the `biringas_age_ack` cookie is missing. The accept
 * button is a Server Action form submit — works without JS. The "Salir"
 * link is a plain anchor to a neutral destination so a misclick on a public
 * device cannot leave residual state.
 */
export function AgeGate() {
  return (
    <main className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <header className="border-b border-[var(--color-border)]/60">
        <Container width="wide" className="flex h-16 items-center">
          <Logo link={false} />
        </Container>
      </header>
      <section className="flex flex-1 items-center justify-center px-4 py-12">
        <Container width="narrow" className="text-center">
          <span className="inline-block text-xs uppercase tracking-[0.4em] text-[var(--color-text-subtle)]">
            Verificación de edad
          </span>
          <h1 className="mt-6 text-3xl font-semibold leading-tight text-[var(--color-foreground)] sm:text-4xl">
            Sólo personas mayores de 18 años
          </h1>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
            {brandConfig.name} es un marketplace para mayores de edad.
            Al continuar declaras que tienes <span className="text-[var(--color-foreground)]">18 años o más</span> y aceptas ver contenido para adultos.
          </p>
          <form
            action={acknowledgeAge}
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <button
              type="submit"
              className="inline-flex h-14 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-brand-primary)] px-8 text-base font-semibold text-[var(--color-background)] shadow-[var(--shadow-glow-primary)] transition-colors hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
            >
              Tengo 18 años o más
            </button>
            <a
              href="https://www.google.com"
              rel="noopener noreferrer"
              className="inline-flex h-14 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-8 text-base font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-brand-primary)] hover:text-[var(--color-foreground)]"
            >
              Salir del sitio
            </a>
          </form>
          <p className="mt-10 text-xs text-[var(--color-text-subtle)]">
            Si eres menor de edad, abandona este sitio. La acción guardará una cookie de un año en este dispositivo.
          </p>
        </Container>
      </section>
    </main>
  );
}
