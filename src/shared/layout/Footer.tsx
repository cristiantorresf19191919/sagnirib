import Link from "next/link";
import { ShieldCheck, MapPin } from "lucide-react";

import { brandConfig } from "@/core/branding/brand-config";
import { SUPPORTED_CITIES } from "@/server/biringas";
import { Container } from "@/shared/design-system/components/Container";
import { Logo } from "@/shared/design-system/components/Logo";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer data-testid="footer" className="relative isolate overflow-hidden border-t border-[var(--color-border)] bg-[var(--color-background-elevated)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-[var(--color-brand-primary)]/40 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 motion-safe:motion-blob-a"
        style={{
          background:
            "radial-gradient(circle at 12% 100%, rgba(47,93,67,0.08), transparent 45%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 motion-safe:motion-blob-b"
        style={{
          background:
            "radial-gradient(circle at 88% 0%, rgba(229,162,58,0.07), transparent 45%)",
        }}
      />
      <Container
        width="wide"
        className="grid grid-cols-1 gap-12 py-16 lg:grid-cols-12"
      >
        <div className="lg:col-span-5">
          <Logo size="md" link={false} />
          <p className="mt-5 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
            {brandConfig.description}
          </p>
          <p className="mt-3 max-w-md text-base font-medium text-[var(--color-foreground)]">
            {brandConfig.tagline}.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-primary)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/20">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              Perfiles verificados
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)]">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              Servicio en Colombia
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
              Producto
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/explorar"
                  className="group inline-flex items-center gap-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand-primary)]"
                >
                  Explorar
                </Link>
              </li>
              <li>
                <Link
                  href="/#como-funciona"
                  className="group inline-flex items-center gap-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand-primary)]"
                >
                  Cómo funciona
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
              Legal
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[var(--color-text-muted)]">
              <li className="opacity-70">Términos — en redacción</li>
              <li className="opacity-70">Privacidad — en redacción</li>
              <li className="opacity-70">Aviso legal — en redacción</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
              Acceso
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[var(--color-text-muted)]">
              <li>Sólo mayores de 18 años</li>
              <li>Servicio limitado a Colombia</li>
            </ul>
          </div>
        </div>

        {/* City directory — SEO + UX. Each city is a real anchor that
            search engines index and humans use to deep-link the catalog. */}
        <div
          data-testid="footer-city-directory"
          className="lg:col-span-12"
        >
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
            Ciudades
          </h3>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm sm:grid-cols-3 lg:grid-cols-6">
            {SUPPORTED_CITIES.map((city) => (
              <li key={city}>
                <Link
                  href={`/?city=${encodeURIComponent(city)}`}
                  className="group inline-flex items-center gap-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand-primary)]"
                >
                  {city}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <div className="border-t border-[var(--color-border)]/70">
        <Container
          width="wide"
          className="flex flex-col items-start gap-3 py-6 text-xs text-[var(--color-text-subtle)] sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            © {year} {brandConfig.legalName}. Todos los derechos reservados.
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-highlight)]/10 px-3 py-1 font-semibold uppercase tracking-[0.2em] text-[var(--color-brand-highlight)] ring-1 ring-[var(--color-brand-highlight)]/25">
            <span>+18</span>
            <span className="font-normal normal-case tracking-normal text-[var(--color-text-muted)]">
              Plataforma para personas mayores de edad
            </span>
          </span>
        </Container>
      </div>
    </footer>
  );
}
