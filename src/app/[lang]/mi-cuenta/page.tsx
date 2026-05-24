import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  Loader2,
  MapPin,
  Plus,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
} from "lucide-react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { isSupportedLocale } from "@/core/i18n/constants";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import {
  getFirebaseConfig,
  isFirebaseConfigured,
} from "@/core/config/firebase";
import { AvailabilityStrip } from "@/features/biringas/components/AvailabilityStrip";
import { AvailabilityToggle } from "@/features/dashboard/components/AvailabilityToggle";
import { BookingInboxList } from "@/features/dashboard/components/BookingInboxList";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
import { ReferralCard } from "@/features/dashboard/components/ReferralCard";
import { getSession } from "@/server/auth";
import {
  findBySlug,
  getMyReferralStats,
  listMyDrafts,
  listMyIncomingBookings,
  type BiringaListing,
  type DraftSummary,
  type ListingDraftStatus,
  type ReferralStats,
  referralCodeForUid,
} from "@/server/biringas";
import {
  getMyVerification,
  type VerificationRecord,
  type VerificationStatus,
} from "@/server/verification";
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
    title: t(locale, "miCuenta.metadata.title"),
    description: t(locale, "miCuenta.metadata.description"),
    pathname: "/mi-cuenta",
    locale,
    indexable: false,
  });
}

/**
 * `/mi-cuenta` — seller dashboard.
 *
 * Auth-gated. Anonymous users bounce to `/ingresar?next=/mi-cuenta`.
 * Authenticated users see four tabs (Solicitudes / Mi perfil /
 * Agenda / Referrals) backed by the owner-side barrel functions.
 */
export default async function MiCuentaPage({
  params,
}: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  const session = await getSession().catch(() => null);
  if (!session) {
    const next = localizedHref(lang, "/mi-cuenta");
    redirect(`${localizedHref(lang, "/ingresar")}?next=${encodeURIComponent(next)}`);
  }

  const [draftsResult, bookings, referralStats, verification] =
    await Promise.all([
      listMyDrafts().then(
        (value) => ({ value, error: null as string | null }),
        (err: unknown) => {
          console.error("[mi-cuenta] listMyDrafts failed", err);
          return {
            value: [] as ReadonlyArray<DraftSummary>,
            error: err instanceof Error ? err.message : String(err),
          };
        },
      ),
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
      getMyVerification().catch((err) => {
        console.error("[mi-cuenta] getMyVerification failed", err);
        return null as VerificationRecord | null;
      }),
    ]);
  const drafts = draftsResult.value;

  const approvedSlugs = drafts
    .filter((d) => d.status === "approved")
    .map((d) => d.preferredSlug);
  const publishedEntries = await Promise.all(
    approvedSlugs.map(async (slug) => {
      try {
        const listing = await findBySlug(slug);
        return listing ? ([slug, listing] as const) : null;
      } catch (err) {
        console.error("[mi-cuenta] findBySlug failed", { slug, err });
        return null;
      }
    }),
  );
  const publishedBySlug = new Map<string, BiringaListing>(
    publishedEntries.filter(
      (e): e is readonly [string, BiringaListing] => e !== null,
    ),
  );

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const greetingName =
    drafts[0]?.displayName ??
    session.email?.split("@")[0] ??
    t(lang, "miCuenta.fallbackName");

  const firebaseConfig = getFirebaseConfig();
  const diagnostic: DiagnosticInfo = {
    uid: session.uid,
    email: session.email ?? null,
    draftCount: drafts.length,
    draftSlugs: drafts.map((d) => d.preferredSlug),
    adapter: isFirebaseConfigured() ? "firebase" : "mock",
    projectId: firebaseConfig?.projectId ?? null,
    listMyDraftsError: draftsResult.error,
  };
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
              profile: (
                <ProfileTab
                  locale={lang}
                  drafts={drafts}
                  publishedBySlug={publishedBySlug}
                  verification={verification}
                  diagnostic={diagnostic}
                />
              ),
              agenda: <AgendaTab locale={lang} drafts={drafts} />,
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
/*  TEMP diagnostic — remove with the owner-side listings query               */
/* -------------------------------------------------------------------------- */

interface DiagnosticInfo {
  uid: string;
  email: string | null;
  draftCount: number;
  draftSlugs: ReadonlyArray<string>;
  adapter: "firebase" | "mock";
  projectId: string | null;
  listMyDraftsError: string | null;
}

function DiagnosticPanel({ info }: Readonly<{ info: DiagnosticInfo }>) {
  return (
    <details className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-background-elevated)] p-3 text-[11px] text-[var(--color-text-muted)]">
      <summary className="cursor-pointer font-semibold text-[var(--color-foreground)]">
        Detalles de tu cuenta (diagnóstico temporal)
      </summary>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono">
        <dt>uid</dt>
        <dd className="break-all">{info.uid}</dd>
        <dt>email</dt>
        <dd className="break-all">{info.email ?? "(sin email)"}</dd>
        <dt>adapter</dt>
        <dd>{info.adapter}</dd>
        {info.projectId ? (
          <>
            <dt>projectId</dt>
            <dd className="break-all">{info.projectId}</dd>
          </>
        ) : null}
        <dt>drafts</dt>
        <dd>{info.draftCount}</dd>
        {info.draftSlugs.length > 0 ? (
          <>
            <dt>slugs</dt>
            <dd className="break-all">{info.draftSlugs.join(", ")}</dd>
          </>
        ) : null}
        {info.listMyDraftsError ? (
          <>
            <dt>error</dt>
            <dd className="whitespace-pre-wrap break-words text-[var(--color-brand-warn)]">
              {info.listMyDraftsError}
            </dd>
          </>
        ) : null}
      </dl>
      <p className="mt-2 leading-relaxed">
        Si <code>adapter</code> dice <code>mock</code>, el dev no tiene las
        env vars <code>FIREBASE_*</code> cargadas. Si dice{" "}
        <code>firebase</code> y aparece <code>error</code>, lo más probable
        es índice compuesto faltante en Firestore — el mensaje suele venir
        con un link para crearlo en un click.
      </p>
    </details>
  );
}

/* -------------------------------------------------------------------------- */
/*  Profile tab — list of drafts + edit / preview links                       */
/* -------------------------------------------------------------------------- */

interface TabProps {
  locale: SupportedLocale;
  drafts: ReadonlyArray<DraftSummary>;
}

interface ProfileTabProps extends TabProps {
  verification: VerificationRecord | null;
  publishedBySlug: ReadonlyMap<string, BiringaListing>;
  diagnostic?: DiagnosticInfo;
}

function ProfileTab({
  locale,
  drafts,
  publishedBySlug,
  verification,
  diagnostic,
}: Readonly<ProfileTabProps>) {
  if (drafts.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <KycStatusCard locale={locale} verification={verification} />
        <EmptyDraftsState locale={locale} />
        {diagnostic ? <DiagnosticPanel info={diagnostic} /> : null}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <KycStatusCard locale={locale} verification={verification} />
      <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
        {drafts.length === 1
          ? t(locale, "miCuenta.profile.single")
          : t(locale, "miCuenta.profile.multiple", { count: drafts.length })}
      </p>
      {diagnostic ? <DiagnosticPanel info={diagnostic} /> : null}

      <ul className="flex flex-col gap-3">
        {drafts.map((d) => {
          const published = publishedBySlug.get(d.preferredSlug);
          return (
            <li
              key={d.id}
              className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="inline-flex items-center gap-2 text-base font-semibold text-[var(--color-foreground)]">
                    {d.displayName}
                    <DraftStatusBadgeIcon locale={locale} status={d.status} />
                  </span>
                  <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--color-text-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" aria-hidden />
                      {d.city}
                    </span>
                    <span aria-hidden>·</span>
                    <span className="capitalize">{d.category}</span>
                    <span aria-hidden>·</span>
                    <DraftStatusPill locale={locale} status={d.status} />
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {d.status === "approved" ? (
                    <Link
                      href={localizedHref(locale, `/p/${d.preferredSlug}`)}
                      className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-xs font-semibold text-[var(--color-foreground)] transition-colors hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)]"
                    >
                      {t(locale, "miCuenta.profile.viewProfile")}
                    </Link>
                  ) : null}
                  <DraftActionLink locale={locale} draft={d} />
                </div>
              </div>
              {published ? (
                <div className="flex flex-wrap items-center gap-3 border-t border-[var(--color-border)] pt-3 text-[11px]">
                  <span className="text-[var(--color-text-muted)]">
                    {t(locale, "miCuenta.profile.catalogStatus")}
                  </span>
                  <AvailabilityToggle
                    listingSlug={published.slug}
                    initialAvailable={published.availableNow}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-background-elevated)] p-4 text-xs text-[var(--color-text-muted)]">
        <p className="leading-relaxed">{t(locale, "miCuenta.profile.reviewNote")}</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Agenda tab — synthesised availability + heads-up about live edit         */
/* -------------------------------------------------------------------------- */

function AgendaTab({ locale, drafts }: Readonly<TabProps>) {
  if (drafts.length === 0) {
    return <EmptyDraftsState locale={locale} />;
  }
  const first = drafts[0]!;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
        {t(locale, "miCuenta.agenda.headline.lead")}{" "}
        <span className="font-semibold text-[var(--color-foreground)]">
          {first.displayName}
        </span>
        :
      </p>
      <AvailabilityStrip listingSlug={first.preferredSlug} />
      <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-background-elevated)] p-4 text-xs text-[var(--color-text-muted)]">
        <p className="font-semibold text-[var(--color-foreground)]">
          {t(locale, "miCuenta.agenda.comingSoon.title")}
        </p>
        <p className="mt-1 leading-relaxed">
          {t(locale, "miCuenta.agenda.comingSoon.body")}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Per-draft status surface — badge icon, inline pill, action link           */
/* -------------------------------------------------------------------------- */

function DraftStatusBadgeIcon({
  locale,
  status,
}: Readonly<{ locale: SupportedLocale; status: ListingDraftStatus }>) {
  if (status === "approved") {
    return (
      <ShieldCheck
        className="h-4 w-4 text-[var(--color-brand-primary)]"
        aria-label={t(locale, "miCuenta.kyc.aria.approved")}
      />
    );
  }
  if (status === "rejected") {
    return (
      <ShieldAlert
        className="h-4 w-4 text-[var(--color-brand-highlight)]"
        aria-label={t(locale, "miCuenta.kyc.aria.rejected")}
      />
    );
  }
  return (
    <BadgeCheck
      className="h-4 w-4 text-[var(--color-brand-warn)]"
      aria-label={t(locale, "miCuenta.kyc.aria.inReview")}
    />
  );
}

function DraftStatusPill({
  locale,
  status,
}: Readonly<{ locale: SupportedLocale; status: ListingDraftStatus }>) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-primary)]/15 px-2 py-0.5 font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-primary)]">
        <ShieldCheck className="h-2.5 w-2.5" aria-hidden />
        {t(locale, "miCuenta.draft.status.approved")}
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-highlight)]/15 px-2 py-0.5 font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-highlight)]">
        <ShieldAlert className="h-2.5 w-2.5" aria-hidden />
        {t(locale, "miCuenta.draft.status.rejected")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-warn)]/15 px-2 py-0.5 font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-accent-strong)]">
      <Clock className="h-2.5 w-2.5" aria-hidden />
      {t(locale, "miCuenta.draft.status.inReview")}
    </span>
  );
}

function DraftActionLink({
  locale,
  draft,
}: Readonly<{ locale: SupportedLocale; draft: DraftSummary }>) {
  if (draft.status === "pending_review") {
    return (
      <Link
        href={localizedHref(locale, `/mi-cuenta/borradores/${draft.id}`)}
        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--color-brand-primary)] px-4 text-xs font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)]"
      >
        {t(locale, "miCuenta.draft.action.details")}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    );
  }
  if (draft.status === "rejected") {
    return (
      <Link
        href={localizedHref(locale, `/mi-cuenta/borradores/${draft.id}`)}
        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--color-brand-highlight)] px-4 text-xs font-semibold text-[var(--color-surface)] shadow-[var(--shadow-md)] transition-[background,transform] duration-200 hover:-translate-y-[1px]"
      >
        {t(locale, "miCuenta.draft.action.editResend")}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    );
  }
  return (
    <Link
      href={`${localizedHref(locale, "/publicar")}?edit=${draft.id}`}
      className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--color-brand-primary)] px-4 text-xs font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)]"
    >
      {t(locale, "miCuenta.draft.action.edit")}
      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  KYC status — visible at the top of the profile tab                        */
/* -------------------------------------------------------------------------- */

interface KycPresentation {
  icon: typeof ShieldCheck;
  surface: string;
  iconTile: string;
  glow: string;
  title: string;
  body: string;
  meta?: { icon: typeof Clock; label: string };
  cta?: { label: string; href: string };
}

function buildKycPresentation(
  locale: SupportedLocale,
): Record<VerificationStatus, KycPresentation> {
  const verifyHref = localizedHref(locale, "/verificacion/enviar");
  return {
    approved: {
      icon: ShieldCheck,
      surface:
        "border-[var(--color-brand-primary)]/35 bg-[var(--color-brand-primary)]/8",
      iconTile:
        "bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/35",
      glow: "shadow-[var(--shadow-glow-primary)]",
      title: t(locale, "miCuenta.kyc.approved.title"),
      body: t(locale, "miCuenta.kyc.approved.body"),
    },
    pending_review: {
      icon: Loader2,
      surface:
        "border-[var(--color-brand-accent)]/45 bg-[var(--color-brand-accent)]/10",
      iconTile:
        "bg-[var(--color-brand-accent)]/18 text-[var(--color-brand-accent-strong)] ring-1 ring-[var(--color-brand-accent)]/45",
      glow: "shadow-[var(--shadow-glow-accent)]",
      title: t(locale, "miCuenta.kyc.pending.title"),
      body: t(locale, "miCuenta.kyc.pending.body"),
      meta: { icon: Clock, label: t(locale, "miCuenta.kyc.pending.meta") },
    },
    rejected: {
      icon: ShieldAlert,
      surface:
        "border-[var(--color-brand-highlight)]/45 bg-[var(--color-brand-highlight)]/8",
      iconTile:
        "bg-[var(--color-brand-highlight)]/15 text-[var(--color-brand-highlight)] ring-1 ring-[var(--color-brand-highlight)]/45",
      glow: "shadow-[var(--shadow-md)]",
      title: t(locale, "miCuenta.kyc.rejected.title"),
      body: t(locale, "miCuenta.kyc.rejected.body"),
      cta: { label: t(locale, "miCuenta.kyc.rejected.cta"), href: verifyHref },
    },
    not_submitted: {
      icon: ShieldQuestion,
      surface:
        "border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/6",
      iconTile:
        "bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/25",
      glow: "shadow-[var(--shadow-glow-primary)]",
      title: t(locale, "miCuenta.kyc.notSubmitted.title"),
      body: t(locale, "miCuenta.kyc.notSubmitted.body"),
      cta: {
        label: t(locale, "miCuenta.kyc.notSubmitted.cta"),
        href: verifyHref,
      },
    },
  };
}

function KycStatusCard({
  locale,
  verification,
}: Readonly<{
  locale: SupportedLocale;
  verification: VerificationRecord | null;
}>) {
  const status: VerificationStatus = verification?.status ?? "not_submitted";
  const presentation = buildKycPresentation(locale)[status];
  const Icon = presentation.icon;
  const animateIcon = status === "pending_review";
  const MetaIcon = presentation.meta?.icon;

  return (
    <div
      className={`relative flex flex-col gap-4 overflow-hidden rounded-[var(--radius-2xl)] border p-5 text-[var(--color-foreground)] sm:flex-row sm:items-center sm:justify-between sm:gap-5 ${presentation.surface} ${presentation.glow}`}
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className={`mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${presentation.iconTile}`}
        >
          <Icon
            className={`h-5 w-5 ${animateIcon ? "animate-spin" : ""}`}
            aria-hidden
          />
        </span>
        <div className="flex flex-col gap-1.5">
          <span className="font-[var(--font-display)] text-base font-[420] tracking-[-0.01em] text-[var(--color-foreground)]">
            {presentation.title}
          </span>
          <span className="text-sm leading-relaxed text-[var(--color-text-muted)]">
            {presentation.body}
          </span>
          {presentation.meta && MetaIcon ? (
            <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-surface)]/70 px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)]">
              <MetaIcon className="h-3 w-3" aria-hidden />
              {presentation.meta.label}
            </span>
          ) : null}
          {status === "rejected" && verification?.rejectionReason ? (
            <span className="mt-1 inline-block rounded-[var(--radius-sm)] bg-[var(--color-surface)]/80 px-2 py-1 text-[11px] text-[var(--color-foreground)] ring-1 ring-[var(--color-brand-highlight)]/20">
              <strong className="font-semibold">
                {t(locale, "miCuenta.kyc.rejected.reason")}
              </strong>{" "}
              {verification.rejectionReason}
            </span>
          ) : null}
        </div>
      </div>
      {presentation.cta ? (
        <Link
          href={presentation.cta.href}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[var(--color-brand-primary)] px-4 text-xs font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          {presentation.cta.label}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function EmptyDraftsState({ locale }: Readonly<{ locale: SupportedLocale }>) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[var(--radius-2xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/60 p-10 text-center">
      <span
        aria-hidden
        className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/20"
      >
        <Sparkles className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="font-[var(--font-display)] text-[clamp(20px,2.4vw,26px)] font-[370] leading-[1.1] tracking-[-0.02em] text-[var(--color-foreground)]">
        {t(locale, "miCuenta.empty.title")}
      </h2>
      <p className="max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
        {t(locale, "miCuenta.empty.body")}
      </p>
      <Link
        href={localizedHref(locale, "/publicar")}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        <Plus className="h-4 w-4" aria-hidden />
        {t(locale, "miCuenta.empty.cta")}
      </Link>
    </div>
  );
}
