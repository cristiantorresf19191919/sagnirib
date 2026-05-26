import Link from "next/link";
import {
  ArrowRight,
  Clock,
  IdCard,
  Loader2,
  MapPin,
  Plus,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  User,
} from "lucide-react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { DeleteProfileButton } from "@/features/persons/components/DeleteProfileButton";
import type { BiringaListing, DraftSummary } from "@/server/biringas";
import type { PersonRecord } from "@/server/persons";
import type { VerificationStatus } from "@/server/verification";

interface ProfileListProps {
  locale: SupportedLocale;
  persons: ReadonlyArray<PersonRecord>;
  drafts: ReadonlyArray<DraftSummary>;
  publishedBySlug: ReadonlyMap<string, BiringaListing>;
}

/**
 * Unified dashboard surface combining person (modelo) + KYC + listing
 * status in a single card per profile.
 *
 * Replaces the previous two-section layout (PersonsKycList +
 * draft-list + EmptyDraftsState) where modelos and listings lived in
 * separate widgets. The user's mental model is "one perfil = one
 * modelo + one identity check + one listing"; the UI now reflects
 * that. Per-card contextual actions guide the next step instead of
 * a global "Verificá tu identidad" banner that read as account-level.
 */
export function ProfileList({
  locale,
  persons,
  drafts,
  publishedBySlug,
}: Readonly<ProfileListProps>) {
  if (persons.length === 0) {
    return <EmptyProfilesState locale={locale} />;
  }

  const publishHref = localizedHref(locale, "/publicar");

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
        {t(locale, "miCuenta.profiles.listKicker", { count: persons.length })}
      </span>
      {persons.map((person) => (
        <ProfileCard
          key={person.id}
          locale={locale}
          person={person}
          draft={
            person.activeDraftId
              ? (drafts.find((d) => d.id === person.activeDraftId) ?? null)
              : null
          }
          listing={
            person.activeListingSlug
              ? (publishedBySlug.get(person.activeListingSlug) ?? null)
              : null
          }
        />
      ))}
      <Link
        href={publishHref}
        className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-dashed border-[var(--color-border)] bg-[var(--color-background-elevated)] px-5 py-2.5 text-xs font-semibold text-[var(--color-foreground)] transition-[border-color,background,color] duration-200 hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-brand-primary)]/8 hover:text-[var(--color-brand-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
        {t(locale, "miCuenta.profiles.publishAnother")}
      </Link>
    </div>
  );
}

interface ProfileCardProps {
  locale: SupportedLocale;
  person: PersonRecord;
  draft: DraftSummary | null;
  listing: BiringaListing | null;
}

function ProfileCard({
  locale,
  person,
  draft,
  listing,
}: Readonly<ProfileCardProps>) {
  const kyc = person.kyc.status;
  const surface = pickSurfaceTone({ kyc, draft, listing });

  return (
    <div
      className={`relative flex flex-col gap-4 overflow-hidden rounded-[var(--radius-2xl)] border p-5 text-[var(--color-foreground)] sm:flex-row sm:items-start sm:justify-between sm:gap-5 ${surface}`}
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/25"
        >
          <User className="h-5 w-5" aria-hidden />
        </span>
        <div className="flex flex-col gap-2">
          <span className="font-[var(--font-display)] text-lg font-[420] leading-[1.2] tracking-[-0.01em] text-[var(--color-foreground)]">
            {person.displayName}
          </span>
          <KycLine
            locale={locale}
            status={kyc}
            rejectionReason={person.kyc.rejectionReason}
          />
          <ListingLine locale={locale} draft={draft} listing={listing} />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-stretch sm:self-start">
        <ContextualAction
          locale={locale}
          person={person}
          kyc={kyc}
          draft={draft}
          listing={listing}
        />
        <DeleteProfileButton
          locale={locale}
          personId={person.id}
          displayName={person.displayName}
          hasPublishedListing={listing !== null}
        />
      </div>
    </div>
  );
}

function pickSurfaceTone({
  kyc,
  draft,
  listing,
}: {
  kyc: VerificationStatus;
  draft: DraftSummary | null;
  listing: BiringaListing | null;
}): string {
  if (kyc === "approved" && listing && draft?.status === "approved") {
    return "border-[var(--color-brand-primary)]/35 bg-[var(--color-brand-primary)]/8 shadow-[var(--shadow-glow-primary)]";
  }
  if (kyc === "rejected" || draft?.status === "rejected") {
    return "border-[var(--color-brand-highlight)]/40 bg-[var(--color-brand-highlight)]/6";
  }
  return "border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]";
}

function KycLine({
  locale,
  status,
  rejectionReason,
}: {
  locale: SupportedLocale;
  status: VerificationStatus;
  rejectionReason?: string;
}) {
  if (status === "pending_review") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-brand-accent-strong)]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        {t(locale, "miCuenta.profile.kyc.pending")}
      </span>
    );
  }
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-brand-primary)]">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        {t(locale, "miCuenta.profile.kyc.approved")}
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="flex flex-col gap-0.5 text-[12px] font-medium text-[var(--color-brand-highlight)]">
        <span className="inline-flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
          {t(locale, "miCuenta.profile.kyc.rejected")}
        </span>
        {rejectionReason ? (
          <span className="text-[11px] font-normal text-[var(--color-text-muted)]">
            {rejectionReason}
          </span>
        ) : null}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-text-muted)]">
      <ShieldQuestion className="h-3.5 w-3.5" aria-hidden />
      {t(locale, "miCuenta.profile.kyc.notSubmitted")}
    </span>
  );
}

function ListingLine({
  locale,
  draft,
  listing,
}: {
  locale: SupportedLocale;
  draft: DraftSummary | null;
  listing: BiringaListing | null;
}) {
  if (!draft && !listing) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--color-text-muted)]">
        <IdCard className="h-3.5 w-3.5" aria-hidden />
        {t(locale, "miCuenta.profile.listing.none")}
      </span>
    );
  }
  if (draft?.status === "pending_review") {
    return (
      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--color-text-muted)]">
        <Clock
          className="h-3.5 w-3.5 text-[var(--color-brand-accent-strong)]"
          aria-hidden
        />
        <span className="font-semibold text-[var(--color-brand-accent-strong)]">
          {t(locale, "miCuenta.profile.listing.inReview")}
        </span>
        <span aria-hidden>·</span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" aria-hidden />
          {draft.city}
        </span>
        <span aria-hidden>·</span>
        <span className="capitalize">{draft.category}</span>
      </span>
    );
  }
  if (draft?.status === "approved" && listing) {
    return (
      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--color-text-muted)]">
        <ShieldCheck
          className="h-3.5 w-3.5 text-[var(--color-brand-primary)]"
          aria-hidden
        />
        <span className="font-semibold text-[var(--color-brand-primary)]">
          {t(locale, "miCuenta.profile.listing.published")}
        </span>
        <span aria-hidden>·</span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" aria-hidden />
          {draft.city}
        </span>
        <span aria-hidden>·</span>
        <span className="capitalize">{draft.category}</span>
      </span>
    );
  }
  if (draft?.status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--color-brand-highlight)]">
        <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
        {t(locale, "miCuenta.profile.listing.rejected")}
      </span>
    );
  }
  return null;
}

function ContextualAction({
  locale,
  person,
  kyc,
  draft,
  listing,
}: {
  locale: SupportedLocale;
  person: PersonRecord;
  kyc: VerificationStatus;
  draft: DraftSummary | null;
  listing: BiringaListing | null;
}) {
  // KYC is per-person (ADR-018). While this person's identity is not
  // submitted or was rejected, the only actionable CTA is to verify —
  // regardless of whether a draft/listing already exists, because the
  // admin promotion gate refuses to publish without an approved KYC.
  // Surfacing "Ver detalles" / "Ver listing" here hides the blocker.
  if (kyc === "not_submitted" || kyc === "rejected") {
    const next = listing
      ? localizedHref(locale, "/mi-cuenta")
      : draft
        ? localizedHref(locale, `/mi-cuenta/borradores/${draft.id}`)
        : `${localizedHref(locale, "/publicar")}?personId=${encodeURIComponent(person.id)}`;
    const href = `${localizedHref(locale, "/verificacion/enviar")}?personId=${encodeURIComponent(person.id)}&next=${encodeURIComponent(next)}`;
    return (
      <ActionLink
        href={href}
        label={t(locale, "miCuenta.profile.action.verifyIdentity")}
        primary
        variant={kyc === "rejected" ? "warn" : undefined}
      />
    );
  }
  // Verification submitted and awaiting admin review. The owner can't
  // act on the draft/listing yet (admin gates promotion on KYC), so
  // funnel them to the read-only view of what they sent in.
  if (kyc === "pending_review") {
    const href = `${localizedHref(locale, "/verificacion/enviar")}?personId=${encodeURIComponent(person.id)}`;
    return (
      <ActionLink
        href={href}
        label={t(locale, "miCuenta.profile.action.viewVerification")}
      />
    );
  }
  if (draft?.status === "pending_review") {
    const href = localizedHref(locale, `/mi-cuenta/borradores/${draft.id}`);
    return (
      <ActionLink href={href} label={t(locale, "miCuenta.profile.action.viewDetails")} />
    );
  }
  if (draft?.status === "rejected") {
    const href = localizedHref(locale, `/mi-cuenta/borradores/${draft.id}`);
    return (
      <ActionLink href={href} label={t(locale, "miCuenta.profile.action.editResend")} variant="warn" />
    );
  }
  if (listing) {
    const href = localizedHref(locale, `/p/${listing.slug}`);
    return (
      <ActionLink href={href} label={t(locale, "miCuenta.profile.action.viewListing")} />
    );
  }
  const href = `${localizedHref(locale, "/publicar")}?personId=${encodeURIComponent(person.id)}`;
  return (
    <ActionLink href={href} label={t(locale, "miCuenta.profile.action.publish")} primary />
  );
}

function ActionLink({
  href,
  label,
  primary,
  variant,
}: {
  href: string;
  label: string;
  primary?: boolean;
  variant?: "warn";
}) {
  const base =
    "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-[background,transform,border-color] duration-200 hover:-translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]";
  const cls =
    variant === "warn"
      ? "bg-[var(--color-brand-highlight)] text-[var(--color-surface)] shadow-[var(--shadow-md)]"
      : primary
        ? "bg-[var(--color-brand-primary)] text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] hover:bg-[var(--color-brand-primary-strong)]"
        : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)]";
  return (
    <Link href={href} className={`${base} ${cls}`}>
      {label}
      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
    </Link>
  );
}

function EmptyProfilesState({ locale }: { locale: SupportedLocale }) {
  const publishHref = localizedHref(locale, "/publicar");
  return (
    <div className="flex flex-col items-center gap-4 rounded-[var(--radius-2xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/60 p-10 text-center">
      <span
        aria-hidden
        className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/20"
      >
        <Plus className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="font-[var(--font-display)] text-[clamp(20px,2.4vw,26px)] font-[370] leading-[1.1] tracking-[-0.02em] text-[var(--color-foreground)]">
        {t(locale, "miCuenta.profiles.empty.title")}
      </h2>
      <p className="max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
        {t(locale, "miCuenta.profiles.empty.body")}
      </p>
      <Link
        href={publishHref}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        <Plus className="h-4 w-4" aria-hidden />
        {t(locale, "miCuenta.profiles.empty.cta")}
      </Link>
    </div>
  );
}
