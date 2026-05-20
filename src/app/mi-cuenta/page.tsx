import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  MapPin,
  Plus,
  Sparkles,
} from "lucide-react";

import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { AvailabilityStrip } from "@/features/biringas/components/AvailabilityStrip";
import { BookingInboxList } from "@/features/dashboard/components/BookingInboxList";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
import { ReferralCard } from "@/features/dashboard/components/ReferralCard";
import { getSession } from "@/server/auth";
import {
  getMyReferralStats,
  listMyDrafts,
  listMyIncomingBookings,
  type DraftSummary,
  type ReferralStats,
  referralCodeForUid,
} from "@/server/biringas";
import { Container } from "@/shared/design-system/components/Container";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";

export const metadata: Metadata = buildPageMetadata({
  title: "Mi cuenta — Biringas",
  description:
    "Panel del modelo: solicitudes recibidas, edición de perfil y agenda semanal.",
  path: "/mi-cuenta",
  indexable: false,
});

/**
 * `/mi-cuenta` — seller dashboard.
 *
 * Auth-gated. Anonymous users bounce to `/ingresar?next=/mi-cuenta`.
 * Authenticated users see three tabs (Solicitudes / Mi perfil /
 * Agenda) backed by the new owner-side barrel functions
 * (`listMyIncomingBookings`, `listMyDrafts`).
 *
 * Anyone authenticated can land here — the gating for "do I actually
 * have a listing" happens INSIDE the tabs (each shows a friendly
 * empty state that points at `/publicar`). This avoids the dashboard
 * feeling like a forbidden zone for users still deciding whether to
 * publish.
 */
export default async function MiCuentaPage() {
  const session = await getSession().catch(() => null);
  if (!session) {
    redirect("/ingresar?next=/mi-cuenta");
  }

  // Read all three projections in parallel. Each degrades on failure
  // so the dashboard still renders with a friendly empty/zero state.
  // The referral stats fall back to a uid-derived code-only view so
  // the share surface keeps working even when the redemption store
  // is unreachable.
  const [drafts, bookings, referralStats] = await Promise.all([
    listMyDrafts().catch((err) => {
      console.error("[mi-cuenta] listMyDrafts failed", err);
      return [] as ReadonlyArray<DraftSummary>;
    }),
    listMyIncomingBookings().catch((err) => {
      console.error("[mi-cuenta] listMyIncomingBookings failed", err);
      return [];
    }),
    getMyReferralStats().catch((err) => {
      console.error("[mi-cuenta] getMyReferralStats failed", err);
      return {
        code: referralCodeForUid(session.uid),
        redemptions: 0,
        creditCop: 0,
        hasRedeemed: false,
      } satisfies ReferralStats;
    }),
  ]);

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const greetingName =
    drafts[0]?.displayName ??
    session.email?.split("@")[0] ??
    "modelo";

  return (
    <>
      <Header hideCatalogCta />
      <main
        data-testid="mi-cuenta"
        className="relative isolate bg-[var(--color-background)] py-12 sm:py-16"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_15%_5%,rgba(47,93,67,0.10),transparent_55%),radial-gradient(circle_at_85%_15%,rgba(229,162,58,0.10),transparent_55%)]"
        />
        <Container width="wide">
          <DashboardShell
            greetingName={greetingName}
            pendingCount={pendingCount}
            tabs={{
              inbox: <BookingInboxList initialBookings={bookings} />,
              profile: <ProfileTab drafts={drafts} />,
              agenda: <AgendaTab drafts={drafts} />,
              referrals: (
                <ReferralCard
                  code={referralStats.code}
                  redemptions={referralStats.redemptions}
                  creditCop={referralStats.creditCop}
                  hasRedeemed={referralStats.hasRedeemed}
                />
              ),
            }}
          />
        </Container>
      </main>
      <Footer />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Profile tab — list of drafts + edit / preview links                       */
/* -------------------------------------------------------------------------- */

interface TabProps {
  drafts: ReadonlyArray<DraftSummary>;
}

function ProfileTab({ drafts }: Readonly<TabProps>) {
  if (drafts.length === 0) {
    return <EmptyDraftsState />;
  }
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
        {drafts.length === 1
          ? "Tu perfil publicado:"
          : `Tenés ${drafts.length} perfiles publicados.`}
      </p>

      <ul className="flex flex-col gap-3">
        {drafts.map((d) => (
          <li
            key={d.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]"
          >
            <div className="flex flex-col gap-1">
              <span className="inline-flex items-center gap-2 text-base font-semibold text-[var(--color-foreground)]">
                {d.displayName}
                <BadgeCheck
                  className="h-4 w-4 text-[var(--color-brand-warn)]"
                  aria-label="En revisión"
                />
              </span>
              <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--color-text-muted)]">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {d.city}
                </span>
                <span aria-hidden>·</span>
                <span className="capitalize">{d.category}</span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-warn)]/15 px-2 py-0.5 font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-accent-strong)]">
                  <Clock className="h-2.5 w-2.5" aria-hidden />
                  En revisión
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/p/${d.preferredSlug}`}
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-xs font-semibold text-[var(--color-foreground)] transition-colors hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)]"
              >
                Ver perfil
              </Link>
              <Link
                href={`/publicar?edit=${d.id}`}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--color-brand-primary)] px-4 text-xs font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)]"
              >
                Editar
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-background-elevated)] p-4 text-xs text-[var(--color-text-muted)]">
        <p className="leading-relaxed">
          Mientras tu perfil está en revisión humana, aparece sólo para vos.
          Te avisamos en cuanto pase la verificación de 2 capas — suele
          tardar menos de 24 horas hábiles.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Agenda tab — synthesised availability + heads-up about live edit         */
/* -------------------------------------------------------------------------- */

function AgendaTab({ drafts }: Readonly<TabProps>) {
  if (drafts.length === 0) {
    return <EmptyDraftsState />;
  }
  const first = drafts[0]!;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
        Disponibilidad pública que ven los visitantes en tu perfil{" "}
        <span className="font-semibold text-[var(--color-foreground)]">
          {first.displayName}
        </span>
        :
      </p>
      <AvailabilityStrip listingSlug={first.preferredSlug} />
      <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-background-elevated)] p-4 text-xs text-[var(--color-text-muted)]">
        <p className="font-semibold text-[var(--color-foreground)]">
          Próximamente: edición manual.
        </p>
        <p className="mt-1 leading-relaxed">
          Vas a poder fijar tus franjas reales con un par de toques. Por
          ahora la grilla se calcula a partir de tu historial de
          confirmaciones; si querés ocultar una franja específica, escribinos
          al soporte.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function EmptyDraftsState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[var(--radius-2xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/60 p-10 text-center">
      <span
        aria-hidden
        className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/20"
      >
        <Sparkles className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="font-[var(--font-display)] text-[clamp(20px,2.4vw,26px)] font-[370] leading-[1.1] tracking-[-0.02em] text-[var(--color-foreground)]">
        Aún no publicaste un perfil
      </h2>
      <p className="max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
        Cuando publiques tu perfil verás aquí solicitudes, podrás editar tus
        fotos y ajustar tu agenda en cualquier momento.
      </p>
      <Link
        href="/publicar"
        className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        <Plus className="h-4 w-4" aria-hidden />
        Publica tu perfil
      </Link>
    </div>
  );
}
