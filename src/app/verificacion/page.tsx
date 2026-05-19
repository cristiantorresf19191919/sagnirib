import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Lock,
  ShieldCheck,
  Video,
} from "lucide-react";

import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { Container } from "@/shared/design-system/components/Container";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";

/**
 * `/verificacion` — public explainer for the two-layer verification
 * process the brand promises across the catalog.
 *
 * The hero copy and trust pills repeatedly claim "verificación en 2
 * capas" / "verificación humana" — without a page that explains it,
 * those claims read as marketing. This page is the proof: documents,
 * timings, who handles the review, what the badge means, what
 * happens if a profile fails. Bookmarked link target from the trust
 * ribbon and from the publish wizard.
 */
export const metadata: Metadata = buildPageMetadata({
  title: "Verificación en 2 capas — cómo nos aseguramos de que sea real",
  description:
    "Cada perfil destacado en Biringas pasa por verificación de identidad y consentimiento de imagen documentado. Aquí explicamos el proceso paso a paso.",
  path: "/verificacion",
});

const STEPS = [
  {
    icon: FileText,
    eyebrow: "Capa 1",
    title: "Identidad",
    body: "Subimos documento oficial vigente y comparamos contra el registro civil. Si los datos no coinciden, el perfil no se publica — ni siquiera como borrador.",
  },
  {
    icon: Video,
    eyebrow: "Capa 2",
    title: "Selfie en vivo + consentimiento",
    body: "Verificación remota con una persona del equipo (no es un bot). Confirmamos rostro contra documento y grabamos el consentimiento explícito para publicar fotos.",
  },
  {
    icon: ShieldCheck,
    eyebrow: "Resultado",
    title: "Insignia verde",
    body: "El escudo dorado en el perfil aparece sólo cuando ambas capas pasaron. Si una caduca, la insignia desaparece automáticamente hasta renovarla.",
  },
];

const FAQ = [
  {
    q: "¿Cuánto tarda la verificación?",
    a: "El 90% de los perfiles queda verificado en menos de 24 horas hábiles. Si hay dudas en el documento, te contactamos para una segunda revisión.",
  },
  {
    q: "¿Qué pasa si un perfil falla la verificación?",
    a: "No se publica. El perfil queda en estado borrador y la persona puede corregir los datos o cancelar el proceso sin que nada se haga público.",
  },
  {
    q: "¿Almacenan mi documento?",
    a: "Encriptado en frío y nunca compartido con terceros. La copia se elimina automáticamente seis meses después de la verificación; sólo guardamos el hash para futuras renovaciones.",
  },
  {
    q: "¿Pueden falsearse las fotos?",
    a: "El consentimiento de imagen documentado y la verificación selfie-en-vivo impiden que terceros suban fotos sin permiso. Cada foto del perfil tiene un timestamp que aparece como “Foto verificada · mes año”.",
  },
  {
    q: "¿La verificación garantiza que tendré una buena experiencia?",
    a: "Garantiza que la persona es real y publicó con consentimiento. La calidad del encuentro depende de la comunicación, expectativas claras y respeto mutuo — para eso están las reseñas y la mensajería.",
  },
];

export default function VerificacionPage() {
  return (
    <>
      <Header />
      <main className="flex flex-col" data-testid="verificacion-page">
        {/* HERO */}
        <section
          aria-labelledby="verificacion-title"
          className="relative isolate overflow-hidden border-b border-[var(--color-border)]/60 bg-[var(--color-background-elevated)]"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 motion-safe:motion-aurora opacity-70"
            style={{
              background:
                "radial-gradient(45% 60% at 18% 20%, rgba(200,166,118,0.14), transparent 70%), radial-gradient(55% 55% at 82% 80%, rgba(47,93,67,0.12), transparent 70%)",
            }}
          />
          <Container width="wide" className="py-20 sm:py-24 lg:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-3 rounded-full bg-[var(--color-surface)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)]">
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--color-gold)] shadow-[0_0_0_3px_rgba(200,166,118,0.18)]"
                />
                Verificación en 2 capas
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--color-brand-primary)]/70"
                />
              </span>

              <h1
                id="verificacion-title"
                className="mt-5 font-[var(--font-display)] text-[clamp(32px,4.5vw,56px)] font-[370] leading-[1.04] tracking-[-0.028em] text-[var(--color-foreground)]"
              >
                Cada perfil que ves aquí{" "}
                <span className="italic font-[340] text-[var(--color-brand-primary)]">
                  pasó por una persona real
                </span>
                .
              </h1>

              <p className="mx-auto mt-5 max-w-2xl font-[var(--font-serif)] text-[17px] leading-[1.55] text-[var(--color-text-muted)]">
                Sin bots, sin catfish, sin perfiles auto-generados. La
                insignia dorada del escudo no se compra — se gana con dos
                capas independientes de verificación humana.
              </p>
            </div>
          </Container>
        </section>

        {/* STEPS */}
        <section
          aria-labelledby="verificacion-steps-title"
          className="border-b border-[var(--color-border)]/60 bg-[var(--color-background)] py-20"
        >
          <Container width="wide">
            <header className="mx-auto max-w-2xl text-center">
              <h2
                id="verificacion-steps-title"
                className="font-[var(--font-display)] text-[clamp(26px,3.4vw,40px)] font-[370] leading-[1.05] tracking-[-0.022em] text-[var(--color-foreground)]"
              >
                Cómo funciona el proceso.
              </h2>
            </header>

            <ol className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
              {STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <li
                    key={step.title}
                    className="flex h-full flex-col gap-4 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-7"
                  >
                    <span
                      aria-hidden
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/20"
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
                      {step.eyebrow}
                    </span>
                    <h3 className="text-xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                      {step.body}
                    </p>
                  </li>
                );
              })}
            </ol>
          </Container>
        </section>

        {/* PRIVACY PROMISE */}
        <section className="border-b border-[var(--color-border)]/60 bg-[var(--color-background-elevated)] py-16">
          <Container width="wide">
            <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-8 md:grid-cols-[auto_1fr]">
              <span
                aria-hidden
                className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)] text-[var(--color-cream)] shadow-[var(--shadow-glow-primary)]"
              >
                <Lock className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <h2 className="font-[var(--font-display)] text-[clamp(22px,2.8vw,32px)] font-[370] leading-[1.1] tracking-[-0.02em] text-[var(--color-foreground)]">
                  Tu identidad no se cruza con tu perfil.
                </h2>
                <p className="mt-3 font-[var(--font-serif)] text-[15.5px] leading-[1.55] text-[var(--color-text-muted)]">
                  El equipo que verifica documentos no tiene acceso al
                  contenido público del perfil. El equipo que publica
                  fotos no ve el documento. Sólo el hash de verificación
                  conecta ambos lados — y se elimina junto con la cuenta
                  si decides darte de baja.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* FAQ */}
        <section
          aria-labelledby="verificacion-faq-title"
          className="bg-[var(--color-background)] py-20"
        >
          <Container width="wide">
            <header className="mx-auto max-w-2xl text-center">
              <h2
                id="verificacion-faq-title"
                className="font-[var(--font-display)] text-[clamp(26px,3.4vw,40px)] font-[370] leading-[1.05] tracking-[-0.022em] text-[var(--color-foreground)]"
              >
                Preguntas frecuentes.
              </h2>
            </header>
            <dl className="mx-auto mt-10 flex max-w-3xl flex-col gap-3">
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-[border-color,background] duration-200 ease-[var(--ease-standard)] open:border-[var(--color-brand-primary)]/40 open:bg-[var(--color-background-elevated)]"
                >
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-sm font-semibold text-[var(--color-foreground)]">
                    <span className="flex-1">{item.q}</span>
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand-primary)] opacity-50 transition-transform duration-200 group-open:rotate-90 group-open:opacity-100"
                      aria-hidden
                    />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                    {item.a}
                  </p>
                </details>
              ))}
            </dl>

            <div className="mt-12 flex flex-col items-center gap-4 text-center">
              <p className="max-w-xl text-sm text-[var(--color-text-muted)]">
                ¿Eres acompañante y quieres aparecer verificada?
              </p>
              <Link
                href="/publicar"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-6 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
              >
                Publica tu perfil verificado
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
