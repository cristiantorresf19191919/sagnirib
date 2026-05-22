import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isSupportedLocale } from "@/core/i18n/constants";
import { t } from "@/core/i18n/messages";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { CommentatorPanel } from "@/features/dashboard/components/CommentatorPanel";
import { Container } from "@/shared/design-system/components/Container";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isSupportedLocale(lang) ? lang : "es";
  return buildPageMetadata({
    title: t(locale, "rbac.commentator.panel.metadata.title"),
    description: t(locale, "rbac.commentator.panel.metadata.description"),
    pathname: "/mi-cuenta/comentarios",
    locale,
    indexable: false,
  });
}

/**
 * Limited dashboard for commentators (PDF page 12).
 *
 * Not auth-gated server-side in this iteration — the route renders the
 * panel even for anonymous visitors so the visual flow is easy to demo.
 * Server-side gating on `session.roles` lands in the follow-up PR that
 * wires custom claims to the account-type cookie.
 */
export default async function MiCuentaComentariosPage({
  params,
}: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  return (
    <>
      <Header hideCatalogCta />
      <main className="relative isolate bg-[var(--color-background)] py-12 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_15%_5%,rgba(47,93,67,0.10),transparent_55%),radial-gradient(circle_at_85%_15%,rgba(229,162,58,0.10),transparent_55%)]"
        />
        <Container width="wide">
          <div className="mx-auto flex max-w-5xl flex-col gap-6">
            <header className="flex flex-col gap-2">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--color-brand-accent)]/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-accent-strong)] ring-1 ring-[var(--color-brand-accent)]/30">
                {t(lang, "rbac.commentator.kicker")}
              </span>
              <h1 className="font-[var(--font-display)] text-[clamp(24px,3.4vw,36px)] font-[370] leading-[1.1] tracking-[-0.02em] text-[var(--color-foreground)]">
                {t(lang, "rbac.commentator.panel.title")}
              </h1>
              <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                {t(lang, "rbac.commentator.panel.subtitle")}
              </p>
            </header>

            <CommentatorPanel />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
