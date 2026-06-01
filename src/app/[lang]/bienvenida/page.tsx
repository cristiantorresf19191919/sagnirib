import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { isSupportedLocale } from "@/core/i18n/constants";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { WelcomeExperience } from "@/features/onboarding/components/WelcomeExperience";
import { getSession } from "@/server/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isSupportedLocale(lang) ? lang : "es";
  return buildPageMetadata({
    title: t(locale, "bienvenida.metadata.title"),
    description: t(locale, "bienvenida.metadata.description"),
    pathname: "/bienvenida",
    locale,
    indexable: false,
  });
}

/**
 * `/bienvenida` — post-signup welcome screen.
 *
 * The publisher signup flow redirects here on success (instead of straight
 * to `/mi-cuenta`) so a newly-created account gets a celebratory, fully
 * choreographed onboarding moment before landing on their dashboard. The
 * "Ver mi perfil" CTA inside `WelcomeExperience` is what carries them on.
 *
 * Auth-gated: only logged-in users see it; anonymous visitors bounce to the
 * login surface. Rendered full-bleed (no Header/Footer) so the animation
 * owns the whole viewport.
 */
export default async function BienvenidaPage({
  params,
}: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  const session = await getSession().catch(() => null);
  if (!session) {
    const next = localizedHref(lang, "/bienvenida");
    redirect(
      `${localizedHref(lang, "/ingresar")}?next=${encodeURIComponent(next)}`,
    );
  }

  return (
    <main data-testid="bienvenida" className="relative isolate">
      <WelcomeExperience />
    </main>
  );
}
