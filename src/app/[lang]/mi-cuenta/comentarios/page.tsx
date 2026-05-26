import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { localizedHref } from "@/core/i18n/href";
import { isSupportedLocale } from "@/core/i18n/constants";
import { t } from "@/core/i18n/messages";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { CommentatorPanel } from "@/features/dashboard/components/CommentatorPanel";
import { getSession } from "@/server/auth";
import { ACCOUNT_TYPE_PUBLISHER, getMyAccountType } from "@/server/users";
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
 * Limited dashboard for commentators (PDF page 12). Auth-gated: anonymous
 * visitors get redirected to the localized sign-in page with `?next=` so
 * they return here after authenticating. The commentator role itself is
 * minted by `signUpWithIdToken` / `loginWithIdToken` when the account-type
 * cookie is set; this page does not gate on the role string yet — the
 * `/mi-cuenta` router redirects users with `account-type=commentator` here,
 * so role-string drift between sessions stays cookie-driven by design.
 */
export default async function MiCuentaComentariosPage({
  params,
}: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  const session = await getSession().catch(() => null);
  if (!session) {
    redirect(
      localizedHref(
        lang,
        `/ingresar?next=${encodeURIComponent("/mi-cuenta/comentarios")}`,
      ),
    );
  }

  // ADR-019 — publisher-locked accounts have their own dashboard at
  // `/mi-cuenta`. Send them there so the bidirectional redirect closes
  // the loop (commentators are sent here from `/mi-cuenta`, publishers
  // are sent away from `/comentarios`). Without this, a publisher who
  // typed the URL directly would land on the commentator surface
  // unintentionally.
  const accountType = await getMyAccountType().catch(() => null);
  if (accountType === ACCOUNT_TYPE_PUBLISHER) {
    redirect(localizedHref(lang, "/mi-cuenta"));
  }

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
