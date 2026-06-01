import Image from "next/image";
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
      {/* Prominent "add profile" tile — pinned to the top so the create-new
          action is the first thing in the workspace. Big dashed frame +
          dashed-ring plus mark; the plus rotates into an "open/create"
          gesture on hover (same vocabulary as the header CTA). */}
      <Link
        href={publishHref}
        className="group flex flex-col items-center justify-center gap-4 rounded-[var(--radius-2xl)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/40 px-6 py-9 text-center transition-[border-color,background,transform,box-shadow] duration-300 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-brand-primary)]/[0.05] hover:shadow-[var(--shadow-sm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] motion-safe:hover:-translate-y-0.5"
      >
        <span
          aria-hidden
          className="inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-[var(--color-brand-primary)]/40 bg-[var(--color-brand-primary)]/8 text-[var(--color-brand-primary)] transition-[transform,background,border-color] duration-300 ease-[var(--ease-standard)] group-hover:border-[var(--color-brand-primary)]/70 group-hover:bg-[var(--color-brand-primary)]/14 motion-safe:group-hover:rotate-90 motion-safe:group-hover:scale-105"
        >
          <Plus className="h-7 w-7" aria-hidden />
        </span>
        <span className="flex flex-col gap-1">
          <span className="font-[var(--font-display)] text-base font-[420] tracking-[-0.01em] text-[var(--color-foreground)]">
            {t(locale, "miCuenta.profiles.publishAnother")}
          </span>
          <span className="max-w-xs text-xs leading-relaxed text-[var(--color-text-muted)]">
            {t(locale, "miCuenta.profiles.publishAnother.hint")}
          </span>
        </span>
      </Link>

      <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
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
        <ProfileAvatar
          displayName={person.displayName}
          imageUrl={listing?.mainImage ?? null}
        />
        <div className="flex flex-col items-start gap-2">
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
      {/* Delete sits apart from the primary CTAs (subtle corner icon) so a
          quick tap never lands on a destructive action; the actions group
          stays grouped below it. Deletion itself is confirm-by-typing
          (ADR-020). */}
      <div className="flex shrink-0 flex-col items-end gap-3 self-stretch sm:self-start">
        <DeleteProfileButton
          variant="corner"
          locale={locale}
          personId={person.id}
          displayName={person.displayName}
          hasPublishedListing={listing !== null}
        />
        <div className="flex flex-wrap items-center justify-end gap-2">
          {/* Edit CTA for a draft still in review — shown regardless of the
              KYC-gated primary action so a mistaken publish is always
              recoverable without starting over. Photos + descriptions stay
              locked (enforced server-side); everything else is editable. */}
          {draft?.status === "pending_review" && (
            <ActionLink
              href={localizedHref(
                locale,
                `/mi-cuenta/borradores/${draft.id}/editar`,
              )}
              label={t(locale, "miCuenta.profile.action.editListing")}
            />
          )}
          <ContextualAction
            locale={locale}
            person={person}
            kyc={kyc}
            draft={draft}
            listing={listing}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Per-profile visual anchor. A published profile shows its real catalog
 * cover (`mainImage`); everything else (drafts, in-review, no listing)
 * falls back to deterministic initials so two cards never look identical.
 */
function ProfileAvatar({
  displayName,
  imageUrl,
}: Readonly<{ displayName: string; imageUrl: string | null }>) {
  if (imageUrl) {
    return (
      <span className="relative mt-0.5 h-11 w-11 shrink-0 overflow-hidden rounded-2xl ring-1 ring-[var(--color-border)]">
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="44px"
          className="object-cover"
        />
      </span>
    );
  }
  const { initials, toneClass } = avatarFromName(displayName);
  return (
    <span
      aria-hidden
      className={`mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ring-1 ${toneClass}`}
    >
      {initials}
    </span>
  );
}

/**
 * Token-only avatar tints. Deterministic pick (hash of the name) keeps a
 * profile's colour stable across renders without hardcoding hex values.
 */
const AVATAR_TONES = [
  "bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)] ring-[var(--color-brand-primary)]/25",
  "bg-[var(--color-brand-accent)]/18 text-[var(--color-brand-accent-strong)] ring-[var(--color-brand-accent)]/30",
  "bg-[var(--color-brand-highlight)]/14 text-[var(--color-brand-highlight)] ring-[var(--color-brand-highlight)]/30",
] as const;

function avatarFromName(name: string): { initials: string; toneClass: string } {
  const trimmed = name.trim();
  const initials =
    trimmed
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase() || "?";
  let hash = 0;
  for (let i = 0; i < trimmed.length; i += 1) {
    hash = (hash * 31 + trimmed.charCodeAt(i)) >>> 0;
  }
  return { initials, toneClass: AVATAR_TONES[hash % AVATAR_TONES.length] };
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
    return "border-[var(--color-brand-highlight)]/30 bg-[var(--color-brand-highlight)]/6 shadow-[var(--shadow-md)]";
  }
  // Default: seamless elevated surface floating on the page wash — no hard
  // hairline outline, depth comes from a diffused shadow (premium feel).
  return "border-transparent bg-[var(--color-background-elevated)] shadow-[var(--shadow-lg)]";
}

/**
 * Status badge shared by the KYC + listing lines. Solid-tinted pills (vs
 * the old plain text + icon) so the account's pulse reads at a glance:
 * amber = waiting, green = done, red = needs attention, neutral = not
 * started. All tints are token-derived — no hardcoded colour.
 */
function StatusPill({
  tone,
  icon: Icon,
  label,
  spin,
  pulse,
}: Readonly<{
  tone: "amber" | "green" | "red" | "neutral";
  icon: typeof Clock;
  label: string;
  spin?: boolean;
  /** Live/waiting states swap the icon for a pulsing dot so the pill
   *  reads as active software, not a static label. */
  pulse?: boolean;
}>) {
  const toneClass = {
    amber:
      "bg-[var(--color-brand-accent)]/15 text-[var(--color-brand-accent-strong)] ring-[var(--color-brand-accent)]/35",
    green:
      "bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary)] ring-[var(--color-brand-primary)]/30",
    red: "bg-[var(--color-brand-highlight)]/12 text-[var(--color-brand-highlight)] ring-[var(--color-brand-highlight)]/35",
    neutral:
      "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] ring-[var(--color-border)]",
  }[tone];
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${toneClass}`}
    >
      {pulse ? (
        <span aria-hidden className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 motion-safe:animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      ) : (
        <Icon className={`h-3 w-3 ${spin ? "animate-spin" : ""}`} aria-hidden />
      )}
      {label}
    </span>
  );
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
      <StatusPill
        tone="amber"
        icon={Loader2}
        pulse
        label={t(locale, "miCuenta.profile.kyc.pending")}
      />
    );
  }
  if (status === "approved") {
    return (
      <StatusPill
        tone="green"
        icon={ShieldCheck}
        label={t(locale, "miCuenta.profile.kyc.approved")}
      />
    );
  }
  if (status === "rejected") {
    return (
      <span className="flex flex-col items-start gap-1">
        <StatusPill
          tone="red"
          icon={ShieldAlert}
          label={t(locale, "miCuenta.profile.kyc.rejected")}
        />
        {rejectionReason ? (
          <span className="text-[11px] text-[var(--color-text-muted)]">
            {rejectionReason}
          </span>
        ) : null}
      </span>
    );
  }
  return (
    <StatusPill
      tone="neutral"
      icon={ShieldQuestion}
      label={t(locale, "miCuenta.profile.kyc.notSubmitted")}
    />
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
      <StatusPill
        tone="neutral"
        icon={IdCard}
        label={t(locale, "miCuenta.profile.listing.none")}
      />
    );
  }
  if (draft?.status === "pending_review") {
    return (
      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
        <StatusPill
          tone="amber"
          icon={Clock}
          pulse
          label={t(locale, "miCuenta.profile.listing.inReview")}
        />
        <ListingMeta city={draft.city} category={draft.category} />
      </span>
    );
  }
  if (draft?.status === "approved" && listing) {
    return (
      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
        <StatusPill
          tone="green"
          icon={ShieldCheck}
          label={t(locale, "miCuenta.profile.listing.published")}
        />
        <ListingMeta city={draft.city} category={draft.category} />
      </span>
    );
  }
  if (draft?.status === "rejected") {
    return (
      <StatusPill
        tone="red"
        icon={ShieldAlert}
        label={t(locale, "miCuenta.profile.listing.rejected")}
      />
    );
  }
  return null;
}

function ListingMeta({
  city,
  category,
}: Readonly<{ city: string; category: string }>) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--color-text-muted)]">
      <span className="inline-flex items-center gap-1">
        <MapPin className="h-3 w-3" aria-hidden />
        {city}
      </span>
      <span aria-hidden>·</span>
      <span className="capitalize">{category}</span>
    </span>
  );
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
