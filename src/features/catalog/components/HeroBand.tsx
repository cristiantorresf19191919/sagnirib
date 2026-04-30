import { MapPin } from "lucide-react";

import { Container } from "@/shared/design-system/components/Container";
import { Sparkle } from "@/shared/design-system/components/Sparkle";
import { FadeIn } from "@/shared/motion/FadeIn";

interface HeroBandProps {
  /** Optional title slot — defaults to brand short pitch. */
  title?: string;
  /** Optional descriptive paragraph. */
  description?: string;
  /** Optional location label rendered as a subtle pill. */
  location?: string;
}

/**
 * Compact catalog hero — sparkle + title + descriptive paragraph + location
 * pill. Sits above the category bar to give the home/catalog a sense of
 * place before the filter chrome appears. Layout mirrors the spa app
 * mockup intro screen.
 */
export function HeroBand({
  title = "Encuentra a tu Biringa ideal",
  description = "Perfiles verificados en Colombia. Filtra por ciudad, categoría y disponibilidad — la actividad reciente queda primero.",
  location = "Colombia",
}: HeroBandProps) {
  return (
    <section
      aria-labelledby="hero-band-title"
      className="relative isolate overflow-hidden border-b border-[var(--color-border)]/60 bg-[var(--color-background)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_30%,rgba(47,93,67,0.08),transparent_55%),radial-gradient(circle_at_85%_70%,rgba(229,162,58,0.08),transparent_60%)]"
      />
      <Sparkle
        tone="primary"
        size={28}
        className="pointer-events-none absolute right-[6%] top-10 hidden opacity-70 md:block"
      />
      <Sparkle
        tone="muted"
        size={20}
        className="pointer-events-none absolute right-[14%] bottom-12 hidden opacity-60 lg:block"
      />

      <Container width="wide" className="py-10 sm:py-14">
        <div className="flex flex-col items-start gap-4 sm:max-w-2xl">
          <FadeIn delay={0.04}>
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface)] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)]">
              <MapPin
                className="h-3.5 w-3.5 text-[var(--color-brand-primary)]"
                aria-hidden
              />
              {location}
            </span>
          </FadeIn>
          <FadeIn delay={0.12} y={10}>
            <h1
              id="hero-band-title"
              className="text-3xl font-bold leading-[1.05] tracking-tight text-[var(--color-foreground)] sm:text-4xl lg:text-5xl"
            >
              {title}
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
              {description}
            </p>
          </FadeIn>
        </div>
      </Container>
    </section>
  );
}
