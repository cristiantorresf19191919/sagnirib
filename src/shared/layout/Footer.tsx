import Link from "next/link";
import { ShieldCheck, MapPin, ArrowUpRight } from "lucide-react";

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
            <h3 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]"><span aria-hidden className="inline-block h-px w-6 bg-gradient-to-r from-[var(--color-gold)] to-transparent" />
              Producto
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/explorar"
                  className="group/prod inline-flex items-center gap-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand-primary)]"
                >
                  Explorar
                  <ArrowUpRight
                    className="h-3 w-3 opacity-0 transition-[opacity,transform] duration-200 ease-[var(--ease-standard)] group-hover/prod:translate-x-0.5 group-hover/prod:-translate-y-0.5 group-hover/prod:opacity-100"
                    aria-hidden
                  />
                </Link>
              </li>
              <li>
                <Link
                  href="/#como-funciona"
                  className="group/prod inline-flex items-center gap-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand-primary)]"
                >
                  Cómo funciona
                  <ArrowUpRight
                    className="h-3 w-3 opacity-0 transition-[opacity,transform] duration-200 ease-[var(--ease-standard)] group-hover/prod:translate-x-0.5 group-hover/prod:-translate-y-0.5 group-hover/prod:opacity-100"
                    aria-hidden
                  />
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]"><span aria-hidden className="inline-block h-px w-6 bg-gradient-to-r from-[var(--color-gold)] to-transparent" />
              Legal
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/legal/terminos"
                  className="group/legal inline-flex items-center gap-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand-primary)]"
                >
                  Términos y condiciones
                  <ArrowUpRight
                    className="h-3 w-3 opacity-0 transition-[opacity,transform] duration-200 ease-[var(--ease-standard)] group-hover/legal:translate-x-0.5 group-hover/legal:-translate-y-0.5 group-hover/legal:opacity-100"
                    aria-hidden
                  />
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacidad"
                  className="group/legal inline-flex items-center gap-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand-primary)]"
                >
                  Política de privacidad
                  <ArrowUpRight
                    className="h-3 w-3 opacity-0 transition-[opacity,transform] duration-200 ease-[var(--ease-standard)] group-hover/legal:translate-x-0.5 group-hover/legal:-translate-y-0.5 group-hover/legal:opacity-100"
                    aria-hidden
                  />
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/aviso-legal"
                  className="group/legal inline-flex items-center gap-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand-primary)]"
                >
                  Aviso legal
                  <ArrowUpRight
                    className="h-3 w-3 opacity-0 transition-[opacity,transform] duration-200 ease-[var(--ease-standard)] group-hover/legal:translate-x-0.5 group-hover/legal:-translate-y-0.5 group-hover/legal:opacity-100"
                    aria-hidden
                  />
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]"><span aria-hidden className="inline-block h-px w-6 bg-gradient-to-r from-[var(--color-gold)] to-transparent" />
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
                  href={`/explorar?city=${encodeURIComponent(city)}`}
                  className="group/city inline-flex items-center gap-1.5 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand-primary)]"
                >
                  <span
                    aria-hidden
                    className="inline-block h-1 w-1 rotate-45 bg-[var(--color-gold)]/0 transition-[background,transform] duration-200 ease-[var(--ease-standard)] group-hover/city:bg-[var(--color-gold)] group-hover/city:scale-125"
                  />
                  <span className="relative">
                    {city}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-[var(--color-brand-primary)]/50 transition-transform duration-300 ease-[var(--ease-standard)] group-hover/city:scale-x-100"
                    />
                  </span>
                  <ArrowUpRight
                    className="h-3 w-3 opacity-0 transition-[opacity,transform] duration-200 ease-[var(--ease-standard)] group-hover/city:translate-x-0.5 group-hover/city:-translate-y-0.5 group-hover/city:opacity-100"
                    aria-hidden
                  />
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
