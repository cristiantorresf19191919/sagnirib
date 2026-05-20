import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { VerificationWizard } from "@/features/verification/components/VerificationWizard";
import { getSession } from "@/server/auth";
import { getMyVerification } from "@/server/verification";
import { Container } from "@/shared/design-system/components/Container";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";

export const metadata: Metadata = buildPageMetadata({
  title: "Verifica tu identidad — Biringas",
  description:
    "Sube tu documento de identidad (anverso + reverso) y una selfie sosteniéndolo. El equipo de Biringas valida cada perfil antes de aprobarlo en el catálogo.",
  path: "/verificacion/enviar",
  // Funnel-only — never indexable.
  indexable: false,
});

/**
 * 3-step wizard for KYC verification basic level (ADR-014).
 *
 *   Step 1 — documento de identidad anverso
 *   Step 2 — documento de identidad reverso
 *   Step 3 — selfie sosteniendo el documento
 *
 * Each step is one file upload with the same compress → ticket → PUT →
 * confirm pipeline used in `/publicar`. The 3 paths are then sent to
 * `submitVerification` which writes `verifications/{uid}` in Firestore.
 *
 * Auth gate redirects anonymous visitors to /ingresar with a friendly
 * next= param. If the current user already has a pending verification,
 * we render a status screen instead of letting them re-submit.
 */
export default async function VerificacionEnviarPage() {
  const session = await getSession().catch(() => null);
  if (!session) {
    redirect("/ingresar?next=/verificacion/enviar");
  }
  const current = await getMyVerification();

  return (
    <>
      <Header />
      <main className="bg-[var(--color-background)] pb-20 pt-8 sm:pt-10">
        <Container width="wide" className="flex flex-col gap-8">
          <header className="flex flex-col gap-3">
            <h1 className="text-3xl font-bold leading-[1.05] tracking-tight text-[var(--color-foreground)] sm:text-4xl">
              Verifica tu identidad
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
              Tres archivos. Cinco minutos. Tu perfil pasa a revisión y se
              activa en el catálogo cuando confirmamos que eres tú.
            </p>
          </header>

          <VerificationWizard initialStatus={current?.status ?? "not_submitted"} initialRecord={current ?? null} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
