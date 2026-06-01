import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";

import { isSupportedLocale } from "@/core/i18n/constants";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { EditDraftForm } from "@/features/enrollment/components/EditDraftForm";
import { draftPayloadToEditValues } from "@/features/enrollment/lib/edit-draft-mapping";
import type { EnrollmentCatalogs } from "@/features/enrollment/lib/catalogs";
import { getSession } from "@/server/auth";
import {
  APPEARANCE_CATALOG,
  ATTENTION_CATALOG,
  CONTACT_CATALOG,
  getMyDraft,
  LANGUAGE_CATALOG,
  MEETING_CONTEXT_CATALOG,
  SERVICE_CATALOG,
  SUPPORTED_CITIES,
} from "@/server/biringas";
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
    title: t(locale, "editar.metadata.title"),
    description: t(locale, "editar.metadata.description"),
    pathname: "/mi-cuenta/borradores",
    locale,
    indexable: false,
  });
}

interface PageProps {
  params: Promise<{ id: string; lang: string }>;
}

export default async function EditarBorradorPage({ params }: PageProps) {
  const { id, lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  const session = await getSession().catch(() => null);
  if (!session) {
    const next = localizedHref(lang, `/mi-cuenta/borradores/${id}/editar`);
    redirect(`${localizedHref(lang, "/ingresar")}?next=${encodeURIComponent(next)}`);
  }

  const draft = await getMyDraft(id);
  if (!draft) notFound();

  // Only drafts in human review are editable. Approved/rejected/cancelled
  // drafts fall back to the read-only detail view.
  if (draft.status !== "pending_review") {
    redirect(localizedHref(lang, `/mi-cuenta/borradores/${id}`));
  }

  const catalogs: EnrollmentCatalogs = {
    cities: SUPPORTED_CITIES,
    services: SERVICE_CATALOG,
    meetingContexts: MEETING_CONTEXT_CATALOG,
    attention: ATTENTION_CATALOG,
    contact: CONTACT_CATALOG,
    appearance: APPEARANCE_CATALOG,
    languages: LANGUAGE_CATALOG,
  };

  const initial = draftPayloadToEditValues(draft.payload);

  return (
    <>
      <Header hideCatalogCta />
      <main className="relative isolate bg-[var(--color-background)] pb-20 pt-8 sm:pt-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_15%_5%,rgba(47,93,67,0.10),transparent_55%),radial-gradient(circle_at_85%_15%,rgba(229,162,58,0.10),transparent_55%)]"
        />
        <Container width="wide" className="flex flex-col gap-8">
          <header className="flex flex-col gap-3">
            <Link
              href={localizedHref(lang, `/mi-cuenta/borradores/${id}`)}
              className="inline-flex w-fit items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-primary)] transition-colors hover:text-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              {t(lang, "editar.back")}
            </Link>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold leading-[1.05] tracking-tight text-[var(--color-foreground)] sm:text-4xl">
                  {t(lang, "editar.title")}
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
                  {t(lang, "editar.subtitle")}
                </p>
              </div>
              <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-brand-accent)]/45 bg-[var(--color-brand-accent)]/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-accent-strong)]">
                <Clock className="h-3 w-3" aria-hidden />
                {t(lang, "draft.pill.pending")}
              </span>
            </div>
          </header>

          <EditDraftForm
            draftId={draft.id}
            ownSlug={draft.payload.details.preferredSlug}
            catalogs={catalogs}
            initial={initial}
          />
        </Container>
      </main>
      <Footer />
    </>
  );
}
