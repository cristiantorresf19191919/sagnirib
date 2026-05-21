import { brandConfig } from "@/core/branding/brand-config";
import { type SupportedLocale } from "@/core/branding/brand-config";
import { t } from "@/core/i18n/messages";
import { Button } from "@/shared/design-system/components/Button";
import { Container } from "@/shared/design-system/components/Container";
import { Logo } from "@/shared/design-system/components/Logo";
import { Sparkle } from "@/shared/design-system/components/Sparkle";
import { FadeIn } from "@/shared/motion/FadeIn";

import { acknowledgeAge } from "./action";

interface AgeGateProps {
  /** Locale chosen for the current request — supplied by the layout so the
   *  age gate stays a Server Component and can render copy in either ES or EN
   *  without a client roundtrip. */
  locale: SupportedLocale;
}

/**
 * Full-page age acknowledgment interstitial.
 *
 * Renders only when the `biringas_age_ack` cookie is missing. The accept
 * button is a Server Action form submit — works without JS. The "Salir"
 * link is a plain anchor to a neutral destination so a misclick on a public
 * device cannot leave residual state.
 */
export function AgeGate({ locale }: Readonly<AgeGateProps>) {
  return (
    <main className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <header className="border-b border-[var(--color-border)]">
        <Container width="wide" className="flex h-16 items-center">
          <Logo link={false} />
        </Container>
      </header>
      <section className="flex flex-1 items-center justify-center px-4 py-12">
        <Container width="narrow" className="text-center">
          <FadeIn delay={0.05}>
            <Sparkle tone="primary" size={32} className="mx-auto" />
          </FadeIn>
          <FadeIn delay={0.12}>
            <span className="mt-6 inline-block text-xs uppercase tracking-[0.4em] text-[var(--color-text-subtle)]">
              {t(locale, "ageGate.kicker")}
            </span>
          </FadeIn>
          <FadeIn delay={0.18} y={12}>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-[var(--color-foreground)] sm:text-4xl">
              {t(locale, "ageGate.title")}
            </h1>
          </FadeIn>
          <FadeIn delay={0.26}>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
              {t(locale, "ageGate.body.prefix", { brand: brandConfig.name })}{" "}
              <span className="text-[var(--color-foreground)]">
                {t(locale, "ageGate.body.emphasis")}
              </span>{" "}
              {t(locale, "ageGate.body.suffix")}
            </p>
          </FadeIn>
          <FadeIn delay={0.34}>
            <form
              action={acknowledgeAge}
              className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center"
            >
              <Button type="submit" variant="primary" size="lg" glow>
                {t(locale, "ageGate.cta.confirm")}
              </Button>
              <Button
                href="https://www.google.com"
                variant="outline"
                size="lg"
                rel="noopener noreferrer"
              >
                {t(locale, "ageGate.cta.exit")}
              </Button>
            </form>
          </FadeIn>
          <FadeIn delay={0.42}>
            <p className="mt-10 text-xs text-[var(--color-text-subtle)]">
              {t(locale, "ageGate.footer")}
            </p>
          </FadeIn>
        </Container>
      </section>
    </main>
  );
}
