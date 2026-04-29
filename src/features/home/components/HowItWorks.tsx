import { Compass, ShieldCheck, Sparkles } from "lucide-react";

import { Container } from "@/shared/design-system/components/Container";

interface Step {
  index: string;
  icon: typeof Compass;
  title: string;
  description: string;
}

const STEPS: ReadonlyArray<Step> = [
  {
    index: "01",
    icon: Compass,
    title: "Explora el catálogo",
    description:
      "Filtra por ciudad, tipo de evento o disponibilidad y revisa perfiles con fotos, idiomas y reseñas.",
  },
  {
    index: "02",
    icon: ShieldCheck,
    title: "Verifica antes de elegir",
    description:
      "Cada acompañante destacada pasa por un check de identidad y consentimiento de imagen documentado.",
  },
  {
    index: "03",
    icon: Sparkles,
    title: "Contrata sin fricción",
    description:
      "Reserva directo desde el perfil. Pagos y mensajería se conectan en una próxima versión — hoy es entrada al MVP.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="how-title"
      className="relative scroll-mt-24 border-y border-[var(--color-border)]/40 bg-[var(--color-background-elevated)] py-16 sm:py-20 lg:py-24"
    >
      <Container width="wide">
        <div className="flex flex-col gap-3">
          <span className="text-xs uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
            Cómo funciona
          </span>
          <h2
            id="how-title"
            className="max-w-2xl text-3xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-4xl"
          >
            Tres pasos para encontrar la compañía adecuada.
          </h2>
        </div>

        <ol className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map(({ index, icon: Icon, title, description }) => (
            <li
              key={index}
              className="group relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-6 transition-colors duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary)]/60"
            >
              <div className="flex items-start justify-between gap-4">
                <span
                  aria-hidden
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-text-subtle)]"
                >
                  {index}
                </span>
                <span
                  aria-hidden
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-background-elevated)] text-[var(--color-brand-primary-strong)] ring-1 ring-[var(--color-brand-primary)]/30 transition-colors group-hover:text-[var(--color-brand-primary)] group-hover:ring-[var(--color-brand-primary)]/60"
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-[var(--color-foreground)]">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {description}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
