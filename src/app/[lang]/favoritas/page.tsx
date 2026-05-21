import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isSupportedLocale } from "@/core/i18n/constants";
import { t } from "@/core/i18n/messages";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { FavoritesView } from "@/features/favorites/components/FavoritesView";
import { SavedSearchesList } from "@/features/favorites/components/SavedSearchesList";
import { listAll } from "@/server/biringas";
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
    title: t(locale, "favoritas.metadata.title"),
    description: t(locale, "favoritas.metadata.description"),
    pathname: "/favoritas",
    locale,
    indexable: false,
  });
}

export default async function FavoritesPage({
  params,
}: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  const { data: listings } = await listAll({ pageSize: 200 }).catch((err) => {
    console.error("[favoritas] listAll failed", err);
    return { data: [], meta: { total: 0, page: 1, pageSize: 200, totalPages: 1 } };
  });

  return (
    <>
      <Header />
      <main className="relative isolate flex flex-1 flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_15%_5%,rgba(47,93,67,0.10),transparent_55%),radial-gradient(circle_at_85%_15%,rgba(229,162,58,0.10),transparent_55%)]"
        />

        <Container width="wide" className="flex flex-col gap-10 py-12 sm:gap-12 sm:py-16">
          <FavoritesView listings={listings} />
          <SavedSearchesList />
        </Container>
      </main>
      <Footer />
    </>
  );
}
