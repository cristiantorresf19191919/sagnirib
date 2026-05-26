import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  Globe,
  Image as ImageIcon,
  Languages,
  Loader2,
  Lock,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
} from "lucide-react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { isSupportedLocale } from "@/core/i18n/constants";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { getSession } from "@/server/auth";
import {
  ATTENTION_CATALOG,
  CONTACT_CATALOG,
  getMyDraft,
  type ListingDraftRecord,
  type ListingDraftStatus,
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
    title: t(locale, "draft.metadata.title"),
    description: t(locale, "draft.metadata.description"),
    pathname: "/mi-cuenta/borradores",
    locale,
    indexable: false,
  });
}

interface PageProps {
  params: Promise<{ id: string; lang: string }>;
}

export default async function BorradorDetallePage({ params }: PageProps) {
  const { id, lang } = await params;
  if (!isSupportedLocale(lang)) notFound();
  const session = await getSession().catch(() => null);
  if (!session) {
    const next = localizedHref(lang, "/mi-cuenta");
    redirect(`${localizedHref(lang, "/ingresar")}?next=${encodeURIComponent(next)}`);
  }
  const draft = await getMyDraft(id);
  if (!draft) notFound();

  return (
    <>
      <Header hideCatalogCta />
      <main className="relative isolate bg-[var(--color-background)] py-10 sm:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_15%_5%,rgba(47,93,67,0.10),transparent_55%),radial-gradient(circle_at_85%_15%,rgba(229,162,58,0.10),transparent_55%)]"
        />
        <Container width="wide" className="flex flex-col gap-8">
          <HeaderSection locale={lang} draft={draft} />
          <StatusBanner locale={lang} draft={draft} />

          <div className="grid gap-5 lg:grid-cols-2">
            <PublicDataCard locale={lang} draft={draft} />
            <PrivateDataCard locale={lang} draft={draft} />
            <DescriptionCard locale={lang} draft={draft} />
            <AttributesCard locale={lang} draft={draft} />
            <GalleryCard locale={lang} draft={draft} />
            <PlanCard locale={lang} draft={draft} />
          </div>

          <FooterNote locale={lang} status={draft.status} />
        </Container>
      </main>
      <Footer />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Header                                                                    */
/* -------------------------------------------------------------------------- */

function HeaderSection({
  locale,
  draft,
}: Readonly<{ locale: SupportedLocale; draft: ListingDraftRecord }>) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href={localizedHref(locale, "/mi-cuenta")}
          className="inline-flex w-fit items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-primary)] transition-colors hover:text-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {t(locale, "draft.back")}
        </Link>
        <h1 className="font-[var(--font-display)] text-[clamp(28px,3vw,40px)] font-[420] leading-[1.05] tracking-[-0.02em] text-[var(--color-foreground)]">
          {draft.payload.details.displayName || t(locale, "draft.unnamed")}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
          {t(locale, "draft.subtitle")}
        </p>
      </div>
      <StatusPill locale={locale} status={draft.status} />
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*  Status banner — mirrors the KycStatusCard pattern from the dashboard.     */
/* -------------------------------------------------------------------------- */

interface StatusPresentation {
  icon: typeof Loader2;
  surface: string;
  iconTile: string;
  glow: string;
  title: string;
  body: string;
  meta?: { icon: typeof Clock; label: string };
}

function buildStatusPresentation(
  locale: SupportedLocale,
): Record<ListingDraftStatus, StatusPresentation> {
  return {
    pending_review: {
      icon: Loader2,
      surface:
        "border-[var(--color-brand-accent)]/45 bg-[var(--color-brand-accent)]/10",
      iconTile:
        "bg-[var(--color-brand-accent)]/18 text-[var(--color-brand-accent-strong)] ring-1 ring-[var(--color-brand-accent)]/45",
      glow: "shadow-[var(--shadow-glow-accent)]",
      title: t(locale, "draft.status.pending.title"),
      body: t(locale, "draft.status.pending.body"),
      meta: { icon: Clock, label: t(locale, "draft.status.pending.meta") },
    },
    approved: {
      icon: ShieldCheck,
      surface:
        "border-[var(--color-brand-primary)]/35 bg-[var(--color-brand-primary)]/8",
      iconTile:
        "bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/35",
      glow: "shadow-[var(--shadow-glow-primary)]",
      title: t(locale, "draft.status.approved.title"),
      body: t(locale, "draft.status.approved.body"),
    },
    rejected: {
      icon: ShieldAlert,
      surface:
        "border-[var(--color-brand-highlight)]/45 bg-[var(--color-brand-highlight)]/8",
      iconTile:
        "bg-[var(--color-brand-highlight)]/15 text-[var(--color-brand-highlight)] ring-1 ring-[var(--color-brand-highlight)]/45",
      glow: "shadow-[var(--shadow-md)]",
      title: t(locale, "draft.status.rejected.title"),
      body: t(locale, "draft.status.rejected.body"),
    },
    cancelled: {
      icon: Ban,
      surface:
        "border-[var(--color-border)] bg-[var(--color-background-elevated)]",
      iconTile:
        "bg-[var(--color-background-elevated)] text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)]",
      glow: "shadow-[var(--shadow-sm)]",
      title: t(locale, "draft.status.cancelled.title"),
      body: t(locale, "draft.status.cancelled.body"),
    },
  };
}

function StatusBanner({
  locale,
  draft,
}: Readonly<{ locale: SupportedLocale; draft: ListingDraftRecord }>) {
  const presentation = buildStatusPresentation(locale)[draft.status];
  const Icon = presentation.icon;
  const animateIcon = draft.status === "pending_review";
  const MetaIcon = presentation.meta?.icon;
  const dateLocale = locale === "en" ? "en-US" : "es-CO";
  const when = new Intl.DateTimeFormat(dateLocale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(draft.submittedAt));
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
          {draft.status === "rejected" && draft.rejectionReason ? (
            <span className="mt-1 inline-block rounded-[var(--radius-sm)] bg-[var(--color-surface)]/80 px-2 py-1 text-[11px] text-[var(--color-foreground)] ring-1 ring-[var(--color-brand-highlight)]/20">
              <strong className="font-semibold">
                {t(locale, "draft.status.rejection.reason")}
              </strong>{" "}
              {draft.rejectionReason}
            </span>
          ) : null}
        </div>
      </div>
      <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
        {t(locale, "draft.receivedOn", { when })}
      </span>
    </div>
  );
}

function StatusPill({
  locale,
  status,
}: Readonly<{ locale: SupportedLocale; status: ListingDraftStatus }>) {
  const tone: Record<
    ListingDraftStatus,
    { label: string; classes: string; icon: typeof Clock }
  > = {
    pending_review: {
      label: t(locale, "draft.pill.pending"),
      classes:
        "border-[var(--color-brand-accent)]/45 bg-[var(--color-brand-accent)]/15 text-[var(--color-brand-accent-strong)]",
      icon: Clock,
    },
    approved: {
      label: t(locale, "draft.pill.approved"),
      classes:
        "border-[var(--color-brand-primary)]/45 bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)]",
      icon: ShieldCheck,
    },
    rejected: {
      label: t(locale, "draft.pill.rejected"),
      classes:
        "border-[var(--color-brand-highlight)]/45 bg-[var(--color-brand-highlight)]/15 text-[var(--color-brand-highlight)]",
      icon: ShieldAlert,
    },
    cancelled: {
      label: t(locale, "draft.pill.cancelled"),
      classes:
        "border-[var(--color-border)] bg-[var(--color-background-elevated)] text-[var(--color-text-muted)]",
      icon: Ban,
    },
  };
  const cell = tone[status];
  const Icon = cell.icon;
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${cell.classes}`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {cell.label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section cards                                                             */
/* -------------------------------------------------------------------------- */

function SectionCard({
  icon: Icon,
  title,
  children,
}: Readonly<{
  icon: typeof Eye;
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
      <header className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/20"
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <h2 className="font-[var(--font-display)] text-base font-[420] tracking-[-0.01em] text-[var(--color-foreground)]">
          {title}
        </h2>
      </header>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        {children}
      </dl>
    </section>
  );
}

function Field({
  label,
  value,
  span = 1,
}: Readonly<{
  label: string;
  value: React.ReactNode;
  span?: 1 | 2;
}>) {
  return (
    <div
      className={`flex flex-col gap-1 ${span === 2 ? "sm:col-span-2" : ""}`}
    >
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
        {label}
      </dt>
      <dd className="text-sm leading-relaxed text-[var(--color-foreground)]">
        {value || (
          <span className="text-[var(--color-text-subtle)]">—</span>
        )}
      </dd>
    </div>
  );
}

function ChipList({ items }: Readonly<{ items: ReadonlyArray<string> }>) {
  if (items.length === 0) {
    return <span className="text-[var(--color-text-subtle)]">—</span>;
  }
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="inline-flex items-center rounded-full bg-[var(--color-brand-primary)]/8 px-2.5 py-0.5 text-[12px] font-medium text-[var(--color-foreground)] ring-1 ring-[var(--color-brand-primary)]/15"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function BooleanBadge({
  locale,
  value,
}: Readonly<{ locale: SupportedLocale; value: boolean }>) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-medium ${
        value
          ? "text-[var(--color-brand-primary)]"
          : "text-[var(--color-text-muted)]"
      }`}
    >
      {value ? (
        <CheckCircle2 className="h-4 w-4" aria-hidden />
      ) : (
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full bg-[var(--color-text-subtle)]/40"
        />
      )}
      {value ? t(locale, "draft.value.yes") : t(locale, "draft.value.no")}
    </span>
  );
}

function formatCop(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

function labelsFromCatalog<T extends { id: string; label: string }>(
  catalog: ReadonlyArray<T>,
  ids: ReadonlyArray<string>,
): ReadonlyArray<string> {
  const map = new Map(catalog.map((c) => [c.id, c.label]));
  return ids.map((id) => map.get(id) ?? id);
}

function PublicDataCard({
  locale,
  draft,
}: Readonly<{ locale: SupportedLocale; draft: ListingDraftRecord }>) {
  const d = draft.payload.details;
  return (
    <SectionCard icon={Eye} title={t(locale, "draft.section.public")}>
      <Field label={t(locale, "draft.field.displayName")} value={d.displayName} />
      <Field
        label={t(locale, "draft.field.age")}
        value={d.age > 0 ? t(locale, "draft.field.age.value", { n: d.age }) : "—"}
      />
      <Field
        label={t(locale, "draft.field.city")}
        value={
          d.city ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[var(--color-text-muted)]" aria-hidden />
              {d.city}
            </span>
          ) : (
            ""
          )
        }
      />
      <Field
        label={t(locale, "draft.field.category")}
        value={d.category ? <span className="capitalize">{d.category}</span> : ""}
      />
      <Field
        label={t(locale, "draft.field.url")}
        value={d.preferredSlug ? `/p/${d.preferredSlug}` : ""}
      />
      <Field label={t(locale, "draft.field.rate")} value={formatCop(d.pricePerHour)} />
    </SectionCard>
  );
}

function PrivateDataCard({
  locale,
  draft,
}: Readonly<{ locale: SupportedLocale; draft: ListingDraftRecord }>) {
  const d = draft.payload.details;
  return (
    <SectionCard icon={Lock} title={t(locale, "draft.section.private")}>
      <Field
        label={t(locale, "draft.field.phone")}
        value={
          d.phone ? (
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-[var(--color-text-muted)]" aria-hidden />
              {d.phone}
            </span>
          ) : (
            ""
          )
        }
      />
      <Field
        label={t(locale, "draft.field.contactChannels")}
        value={
          <ChipList items={labelsFromCatalog(CONTACT_CATALOG, d.contactChannels)} />
        }
      />
      <Field
        label={t(locale, "draft.field.attention")}
        span={2}
        value={
          <ChipList items={labelsFromCatalog(ATTENTION_CATALOG, d.attention)} />
        }
      />
    </SectionCard>
  );
}

function DescriptionCard({
  locale,
  draft,
}: Readonly<{ locale: SupportedLocale; draft: ListingDraftRecord }>) {
  const d = draft.payload.description;
  return (
    <SectionCard icon={Sparkles} title={t(locale, "draft.section.description")}>
      <Field label={t(locale, "draft.field.shortBio")} value={d.shortBio} span={2} />
      <Field
        label={t(locale, "draft.field.bio")}
        span={2}
        value={
          d.bio ? (
            <p className="whitespace-pre-wrap leading-relaxed text-[var(--color-foreground)]">
              {d.bio}
            </p>
          ) : (
            ""
          )
        }
      />
      <Field
        label={t(locale, "draft.field.servicesIncluded")}
        span={2}
        value={<ChipList items={[...d.services]} />}
      />
      <Field
        label={t(locale, "draft.field.meetingContexts")}
        span={2}
        value={<ChipList items={[...d.meetingContexts]} />}
      />
      <Field
        label={t(locale, "draft.field.faceVisible")}
        value={<BooleanBadge locale={locale} value={d.faceVisible} />}
      />
      <Field
        label={t(locale, "draft.field.paymentByCard")}
        value={<BooleanBadge locale={locale} value={d.paymentByCard} />}
      />
      <Field
        label={t(locale, "draft.field.availableNow")}
        value={<BooleanBadge locale={locale} value={d.availableNow} />}
      />
    </SectionCard>
  );
}

function AttributesCard({
  locale,
  draft,
}: Readonly<{ locale: SupportedLocale; draft: ListingDraftRecord }>) {
  const a = draft.payload.attributes;
  return (
    <SectionCard icon={Tag} title={t(locale, "draft.section.attributes")}>
      <Field
        label={t(locale, "draft.field.country")}
        value={
          a.country ? (
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-[var(--color-text-muted)]" aria-hidden />
              {a.country}
            </span>
          ) : (
            ""
          )
        }
      />
      <Field label={t(locale, "draft.field.ethnicity")} value={a.ethnicity} />
      <Field label={t(locale, "draft.field.hair")} value={a.hair} />
      <Field label={t(locale, "draft.field.height")} value={a.height} />
      <Field label={t(locale, "draft.field.body")} value={a.body} />
      <Field label={t(locale, "draft.field.breast")} value={a.breast} />
      {a.pubis ? <Field label={t(locale, "draft.field.pubis")} value={a.pubis} /> : null}
      <Field
        label={t(locale, "draft.field.languages")}
        span={2}
        value={
          a.languages.length > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <Languages className="h-3.5 w-3.5 text-[var(--color-text-muted)]" aria-hidden />
              <ChipList items={[...a.languages]} />
            </span>
          ) : (
            ""
          )
        }
      />
    </SectionCard>
  );
}

function GalleryCard({
  locale,
  draft,
}: Readonly<{ locale: SupportedLocale; draft: ListingDraftRecord }>) {
  const count = draft.payload.description.gallery.length;
  return (
    <SectionCard icon={ImageIcon} title={t(locale, "draft.section.gallery")}>
      <Field
        label={t(locale, "draft.field.photosSent")}
        span={2}
        value={
          count > 0 ? (
            <span className="inline-flex items-center gap-2">
              <strong className="text-[var(--color-foreground)]">
                {t(
                  locale,
                  count === 1
                    ? "draft.field.photos.singular"
                    : "draft.field.photos.plural",
                  { count },
                )}
              </strong>
              <span className="text-[var(--color-text-muted)]">
                {t(locale, "draft.field.photos.readyNote")}
              </span>
            </span>
          ) : (
            <span className="text-[var(--color-text-muted)]">
              {t(locale, "draft.field.photos.empty")}
            </span>
          )
        }
      />
    </SectionCard>
  );
}

function PlanCard({
  locale,
  draft,
}: Readonly<{ locale: SupportedLocale; draft: ListingDraftRecord }>) {
  const p = draft.payload.publish;
  return (
    <SectionCard icon={CreditCard} title={t(locale, "draft.section.plan")}>
      <Field
        label={t(locale, "draft.field.package")}
        value={<span className="capitalize">{p.packageId}</span>}
      />
      <Field
        label={t(locale, "draft.field.billing")}
        value={
          p.billing === "quarterly"
            ? t(locale, "draft.field.billing.quarterly")
            : t(locale, "draft.field.billing.monthly")
        }
      />
      <Field
        label={t(locale, "draft.field.addOns")}
        span={2}
        value={<ChipList items={[...p.addOnIds]} />}
      />
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  Footer note                                                               */
/* -------------------------------------------------------------------------- */

function FooterNote({
  locale,
  status,
}: Readonly<{ locale: SupportedLocale; status: ListingDraftStatus }>) {
  if (status === "pending_review") {
    return (
      <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-background-elevated)] p-4 text-xs leading-relaxed text-[var(--color-text-muted)]">
        {t(locale, "draft.footer.pending")}
      </p>
    );
  }
  if (status === "rejected") {
    return (
      <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-brand-highlight)]/30 bg-[var(--color-brand-highlight)]/8 p-4 text-xs leading-relaxed text-[var(--color-foreground)] sm:flex-row sm:items-center sm:justify-between">
        <span>{t(locale, "draft.footer.rejected.body")}</span>
        <Link
          href={localizedHref(locale, "/mi-cuenta")}
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-4 text-xs font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-colors hover:bg-[var(--color-brand-primary-strong)]"
        >
          {t(locale, "draft.footer.rejected.cta")}
        </Link>
      </div>
    );
  }
  return null;
}
