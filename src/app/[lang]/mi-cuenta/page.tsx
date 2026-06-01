import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { isSupportedLocale } from "@/core/i18n/constants";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import {
  getFirebaseConfig,
  isFirebaseConfigured,
} from "@/core/config/firebase";
import { AccountTypeFallbackModal } from "@/features/auth/components/AccountTypeFallbackModal";
import {
  ACCOUNT_TYPE_COMMENTATOR,
  getMyAccountType,
} from "@/server/users";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
import { ReferralCard } from "@/features/dashboard/components/ReferralCard";
import { ProfileList } from "@/features/persons/components/ProfileList";
import { PostPublishPrompt } from "@/features/verification/components/PostPublishPrompt";
import { getSession } from "@/server/auth";
import {
  findBySlug,
  getMyReferralStats,
  listMyDrafts,
  type BiringaListing,
  type DraftSummary,
  type ReferralStats,
  referralCodeForUid,
} from "@/server/biringas";
import { getMyPersons, type PersonRecord } from "@/server/persons";
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
 * Authenticated users see two tabs (Mi perfil / Invitar) backed by the
 * owner-side barrel functions.
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

  // ADR-019 — `users/{uid}.accountType` is the sole authoritative
  // source for the publisher-vs-commentator decision. Commentator
  // accounts land on a different dashboard surface; bounce them
  // there. The cookie + custom claim are derived from this read and
  // are NOT consulted here (the previous cookie-first design was the
  // path through which a flipped cookie could surface the publisher
  // dashboard to a commentator).
  const accountType = await getMyAccountType().catch(() => null);
  if (accountType === ACCOUNT_TYPE_COMMENTATOR) {
    redirect(localizedHref(lang, "/mi-cuenta/comentarios"));
  }

  // Post-OAuth fallback (ADR-019 § "Locking semantics" Path 2). Trigger:
  // the user authenticated (often via Google) without ever picking a
  // surface AND has no doc yet. The modal forces a pick which writes
  // the doc + grants the role + sets the cookie — one round-trip
  // closes all three.
  const needsAccountTypeModal = accountType === null;

  const [draftsResult, referralStats, persons] =
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
      getMyReferralStats().catch((err) => {
        console.error("[mi-cuenta] getMyReferralStats failed", err);
        return {
          code: referralCodeForUid(session.uid),
          redemptions: 0,
          creditCop: 0,
          hasRedeemed: false,
        } satisfies ReferralStats;
      }),
      // ADR-018: per-person KYC. `getMyPersons` lazily migrates a legacy
      // `verifications/{uid}` doc into `persons/{uid}` on first read so
      // existing accounts keep showing the same status without a
      // separate migration job.
      getMyPersons().catch((err) => {
        console.error("[mi-cuenta] getMyPersons failed", err);
        return [] as ReadonlyArray<PersonRecord>;
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
      <AccountTypeFallbackModal open={needsAccountTypeModal} />
      <main
        data-testid="mi-cuenta"
        className="relative isolate bg-[var(--color-background)] py-12 sm:py-16"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_15%_5%,rgba(47,93,67,0.10),transparent_55%),radial-gradient(circle_at_85%_15%,rgba(229,162,58,0.10),transparent_55%)]"
        />
        <Container width="wide">
          {/* Constrained reading column — at full "wide" width the profile
              rows stretched edge-to-edge, stranding the avatar far-left and
              the CTAs far-right with a dead zone between. Capping the column
              keeps name + actions in one comfortable glance. */}
          <div className="mx-auto w-full max-w-[1080px]">
            <PostPublishPrompt />
            <DashboardShell
              greetingName={greetingName}
              tabs={{
              profile: (
                <ProfileTab
                  locale={lang}
                  drafts={drafts}
                  publishedBySlug={publishedBySlug}
                  persons={persons}
                  diagnostic={diagnostic}
                />
              ),
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
          </div>
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
        Datos técnicos de la cuenta
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
  persons: ReadonlyArray<PersonRecord>;
  publishedBySlug: ReadonlyMap<string, BiringaListing>;
  diagnostic?: DiagnosticInfo;
}

function ProfileTab({
  locale,
  drafts,
  publishedBySlug,
  persons,
  diagnostic,
}: Readonly<ProfileTabProps>) {
  return (
    <div className="flex flex-col gap-4">
      <ProfileList
        locale={locale}
        persons={persons}
        drafts={drafts}
        publishedBySlug={publishedBySlug}
      />
      {persons.length > 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-background-elevated)] p-4 text-xs text-[var(--color-text-muted)]">
          <p className="leading-relaxed">{t(locale, "miCuenta.profile.reviewNote")}</p>
        </div>
      ) : null}
      {persons.length > 0 && publishedBySlug.size > 0 ? (
        <PublishedProfilesFooter
          locale={locale}
          drafts={drafts}
          publishedBySlug={publishedBySlug}
        />
      ) : null}
      {diagnostic ? <DiagnosticPanel info={diagnostic} /> : null}
    </div>
  );
}

/**
 * Compact roster of the publisher's profiles currently live in the
 * catalog. Sits below the unified profile card so the seller has a
 * quick scan of "qué tengo publicado" without scrolling through the
 * full draft list.
 */
function PublishedProfilesFooter({
  locale,
  drafts,
  publishedBySlug,
}: Readonly<{
  locale: SupportedLocale;
  drafts: ReadonlyArray<DraftSummary>;
  publishedBySlug: ReadonlyMap<string, BiringaListing>;
}>) {
  const published = drafts
    .map((d) => ({ d, listing: publishedBySlug.get(d.preferredSlug) }))
    .filter((row): row is { d: DraftSummary; listing: BiringaListing } =>
      Boolean(row.listing),
    );
  if (published.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
        {t(locale, "miCuenta.profile.catalogStatus")}
      </span>
      <ul className="flex flex-col divide-y divide-[var(--color-border)]">
        {published.map(({ d }) => (
          <li
            key={d.id}
            className="flex flex-wrap items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
          >
            <span className="text-sm font-semibold text-[var(--color-foreground)]">
              {d.displayName}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}



