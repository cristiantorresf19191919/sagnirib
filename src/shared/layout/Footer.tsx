import { brandConfig } from "@/core/branding/brand-config";
import { Container } from "@/shared/design-system/components/Container";
import { Logo } from "@/shared/design-system/components/Logo";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-[var(--color-border)]/60 bg-[var(--color-background-elevated)]">
      <Container
        width="wide"
        className="flex flex-col gap-10 py-12 lg:flex-row lg:items-start lg:justify-between"
      >
        <div className="max-w-md">
          <Logo size="sm" link={false} />
          <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {brandConfig.description}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
              Producto
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href="/explorar"
                  className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-foreground)]"
                >
                  Explorar
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
              Legal
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-muted)]">
              <li>Términos — en redacción</li>
              <li>Privacidad — en redacción</li>
              <li>Aviso legal — en redacción</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
              Acceso
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-muted)]">
              <li>Sólo mayores de 18 años.</li>
              <li>Servicio limitado a Colombia.</li>
            </ul>
          </div>
        </div>
      </Container>
      <div className="border-t border-[var(--color-border)]/40">
        <Container
          width="wide"
          className="flex flex-col items-start gap-2 py-6 text-xs text-[var(--color-text-subtle)] sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            © {year} {brandConfig.legalName}. Todos los derechos reservados.
          </span>
          <span>{brandConfig.tagline}</span>
        </Container>
      </div>
    </footer>
  );
}
