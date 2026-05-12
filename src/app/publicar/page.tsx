import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { EnrollmentWizard } from "@/features/enrollment/components/EnrollmentWizard";
import type { EnrollmentCatalogs } from "@/features/enrollment/lib/catalogs";
import { getSession } from "@/server/auth";
import {
  ATTENTION_CATALOG,
  CONTACT_CATALOG,
  MEETING_CONTEXT_CATALOG,
  SERVICE_CATALOG,
  SUPPORTED_CITIES,
} from "@/server/biringas";
import { Container } from "@/shared/design-system/components/Container";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";

export const metadata: Metadata = buildPageMetadata({
  title: "Publica tu perfil — Biringas",
  description:
    "Crea tu anuncio en Biringas: detalles, descripción y plan de publicación. Verificación humana antes de salir al catálogo.",
  path: "/publicar",
  // Page is funnel-only — never indexable, even when global indexing flips on.
  indexable: false,
});

export default async function PublicarPage() {
  // Auth gate. The wizard submits via a Server Action that already calls
  // `requireAuth()` — this redirect just gives an anonymous user a friendly
  // entry point instead of letting them fill the entire form and get
  // rejected at submit time. `next` is read by `/ingresar` once that
  // ?next= forwarding lands (PR2 follow-up).
  const session = await getSession().catch(() => null);
  if (!session) {
    redirect("/ingresar?next=/publicar");
  }

  const catalogs: EnrollmentCatalogs = {
    cities: SUPPORTED_CITIES,
    services: SERVICE_CATALOG,
    meetingContexts: MEETING_CONTEXT_CATALOG,
    attention: ATTENTION_CATALOG,
    contact: CONTACT_CATALOG,
  };

  return (
    <>
      <Header />
      <main className="bg-[var(--color-background)] pb-20 pt-8 sm:pt-10">
        <Container width="wide" className="flex flex-col gap-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex flex-col gap-2">
              <Link
                href="/"
                className="inline-flex w-fit items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-primary)] transition-colors hover:text-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                Volver al catálogo
              </Link>
              <h1 className="text-3xl font-bold leading-[1.05] tracking-tight text-[var(--color-foreground)] sm:text-4xl">
                Publica tu perfil en Biringas
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
                Tres pasos. Diez minutos. Tu perfil sale al catálogo después de
                una verificación rápida — y empieza a recibir contactos esa
                misma semana.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-primary)]"
              />
              Verificación humana
            </span>
          </header>

          <EnrollmentWizard catalogs={catalogs} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
