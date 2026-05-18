import type { Metadata } from "next";

import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { FavoritesView } from "@/features/favorites/components/FavoritesView";
import { listAll } from "@/server/biringas";
import { Container } from "@/shared/design-system/components/Container";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";

export const metadata: Metadata = buildPageMetadata({
  title: "Tus favoritas — Biringas",
  description:
    "Guarda los perfiles que te interesan y compáralos lado a lado antes de decidir.",
  path: "/favoritas",
  // User-state surface — never indexable.
  indexable: false,
});

export default async function FavoritesPage() {
  // Pull the full catalog so the client can hydrate selected favorites
  // without a per-card round trip. Mock catalog is small (≈18 entries);
  // when this hits a real provider we'll switch to a `findByIds(ids)` API.
  //
  // Degrade to empty on failure — the favorites view handles an empty
  // dataset already (renders the "todavía no guardaste perfiles" state),
  // which is the right outcome if Firestore is unreachable.
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

        <Container width="wide" className="py-12 sm:py-16">
          <FavoritesView listings={listings} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
