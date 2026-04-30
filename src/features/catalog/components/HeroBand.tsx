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
        className="pointer-events-none absolute inset-0 -z-10 motion-safe:motion-blob-a"
        style={{
          background:
            "radial-gradient(circle at 15% 30%, rgba(47,93,67,0.10), transparent 55%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 motion-safe:motion-blob-b"
        style={{
          background:
            "radial-gradient(circle at 85% 70%, rgba(229,162,58,0.10), transparent 60%)",
        }}
      />
      <Sparkle
        tone="primary"
        size={28}
        className="pointer-events-none absolute right-[6%] top-10 hidden opacity-70 motion-safe:motion-sparkle-float md:block"
      />
      <Sparkle
        tone="muted"
        size={20}
        className="pointer-events-none absolute right-[14%] bottom-12 hidden opacity-60 motion-safe:motion-sparkle-float lg:block"
        style={{ animationDelay: "1.2s", animationDuration: "8s" }}
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
              className="relative text-3xl font-bold leading-[1.05] tracking-tight text-[var(--color-foreground)] sm:text-4xl lg:text-5xl"
            >
              {title}
              <span
                aria-hidden
                className="absolute -bottom-1.5 left-0 block h-[3px] w-24 rounded-full bg-gradient-to-r from-[var(--color-brand-primary)] via-[var(--color-brand-accent)] to-transparent motion-safe:motion-underline-draw sm:w-32"
              />
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)]">
              {description}
            </p>
          </FadeIn>
        </div>
      </Container>
    </section>
  );
}
