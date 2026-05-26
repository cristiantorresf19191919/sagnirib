import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { isSupportedLocale } from "@/core/i18n/constants";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { VerificationWizard } from "@/features/verification/components/VerificationWizard";
import { getSession } from "@/server/auth";
import { getMyPerson, getMyPersons } from "@/server/persons";
import { getMyVerificationView } from "@/server/verification";
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
    title: t(locale, "verificacion.enviar.metadata.title"),
    description: t(locale, "verificacion.enviar.metadata.description"),
    pathname: "/verificacion/enviar",
    locale,
    indexable: false,
  });
}

/**
 * Whitelist a `?next=...` query param to relative app paths only. The
 * client-side wizard already validates the param post-mount; doing it
 * server-side first lets us thread the value cleanly through redirects
 * (single-person auto-pick) without breaking the post-KYC return path.
 */
function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  return raw;
}

/**
 * 3-step wizard for KYC verification basic level (ADR-014, ADR-018).
 *
 * Per ADR-018 KYC is per-person. The `?personId=...` query param tells
 * the wizard WHICH person is being verified:
 *
 *   - `?personId=<id>` → wizard scoped to that person (must be owned
 *      by the authenticated caller; otherwise 404).
 *   - missing personId, exactly one person on the account → auto-pick
 *      and redirect with `?personId=<theOnlyOne>`.
 *   - missing personId, multiple persons → redirect to `/mi-cuenta`
 *      so the user picks from the profile list (each profile card
 *      links back here with its own personId).
 *   - missing personId, zero persons → redirect to `/publicar` (the
 *      publish wizard is what creates the first person).
 */
export default async function VerificacionEnviarPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ personId?: string; next?: string }>;
}>) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();
  const session = await getSession().catch(() => null);
  const { personId: personIdRaw, next: nextRaw } = await searchParams;
  const nextPath = safeNextPath(nextRaw);

  if (!session) {
    const back =
      localizedHref(lang, "/verificacion/enviar") +
      (personIdRaw ? `?personId=${encodeURIComponent(personIdRaw)}` : "") +
      (nextPath
        ? `${personIdRaw ? "&" : "?"}next=${encodeURIComponent(nextPath)}`
        : "");
    redirect(`${localizedHref(lang, "/ingresar")}?next=${encodeURIComponent(back)}`);
  }

  // No personId: pick a default if possible, otherwise punt to the
  // dashboard / publish flow so the user knows WHICH modelo they are
  // verifying.
  if (!personIdRaw) {
    const persons = await getMyPersons();
    if (persons.length === 1) {
      const onlyId = persons[0]!.id;
      const qs = new URLSearchParams({ personId: onlyId });
      if (nextPath) qs.set("next", nextPath);
      redirect(`${localizedHref(lang, "/verificacion/enviar")}?${qs.toString()}`);
    }
    if (persons.length === 0) {
      redirect(localizedHref(lang, "/publicar"));
    }
    redirect(localizedHref(lang, "/mi-cuenta"));
  }

  const person = await getMyPerson(personIdRaw);
  if (!person) {
    notFound();
  }

  const view = await getMyVerificationView(person.id);

  return (
    <>
      <Header />
      <main className="bg-[var(--color-background)] pb-20 pt-8 sm:pt-10">
        <Container width="wide" className="flex flex-col gap-8">
          <header className="flex flex-col gap-3">
            <h1 className="text-3xl font-bold leading-[1.05] tracking-tight text-[var(--color-foreground)] sm:text-4xl">
              {t(lang, "verificacion.enviar.title")}
            </h1>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
              {person.displayName}
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
              {t(lang, "verificacion.enviar.subtitle")}
            </p>
          </header>

          <VerificationWizard
            personId={person.id}
            personDisplayName={person.displayName}
            initialStatus={view?.record.status ?? "not_submitted"}
            initialRecord={view?.record ?? null}
            initialReadUrls={view?.readUrls ?? null}
          />
        </Container>
      </main>
      <Footer />
    </>
  );
}
