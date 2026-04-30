import { ArrowRight } from "lucide-react";

import { brandConfig } from "@/core/branding/brand-config";
import { brandCopy } from "@/core/branding/brand-copy";
import { Button } from "@/shared/design-system/components/Button";
import { Container } from "@/shared/design-system/components/Container";
import { Sparkle } from "@/shared/design-system/components/Sparkle";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_10%,rgba(47,93,67,0.10),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(229,162,58,0.10),transparent_50%)]"
      />

      <Container
        width="wide"
        className="flex flex-col items-center gap-7 py-20 text-center sm:py-28 lg:py-36"
      >
        <Sparkle tone="primary" size={36} aria-hidden />
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)]">
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-primary)]"
          />
          Marketplace de acompañamiento · Colombia
        </span>

        <h1
          id="hero-title"
          className="max-w-3xl text-5xl font-bold leading-[0.95] tracking-tight text-[var(--color-foreground)] sm:text-6xl lg:text-7xl"
        >
          {brandCopy.homeHeroTitle}
        </h1>

        <p className="max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
          {brandCopy.homeHeroSubtitle}. {brandConfig.description}
        </p>

        <div className="mt-2 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Button
            href="/explorar"
            variant="primary"
            size="lg"
            glow
            className="w-full sm:w-auto"
          >
            {brandCopy.primaryCta}
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Button>
          <Button
            href="#como-funciona"
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            {brandCopy.secondaryCta}
          </Button>
        </div>

        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-[var(--color-text-subtle)] sm:text-sm">
          <li className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-primary)]"
            />
            Perfiles verificados
          </li>
          <li className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-secondary)]"
            />
            Cobertura en 5 ciudades
          </li>
          <li className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-accent)]"
            />
            Sólo mayores de 18
          </li>
        </ul>
      </Container>
    </section>
  );
}
