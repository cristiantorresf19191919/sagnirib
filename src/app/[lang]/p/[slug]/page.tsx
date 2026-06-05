import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  Film,
  Mic,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { isSupportedLocale } from "@/core/i18n/constants";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { seoConfig } from "@/core/seo/seo-config";
import { personJsonLd } from "@/core/seo/structured-data";
import { findBySlug, getListingReviews } from "@/server/biringas";
import { CardStackGallery } from "@/features/biringas/components/CardStackGallery";
import { VideoPlayer } from "@/features/biringas/components/VideoPlayer";
import { ContactReveal } from "@/features/biringas/components/ContactReveal";
// Hidden — see note at usage below. Restore when subscription backend exists.
// import { PremiumContentGrid } from "@/features/biringas/components/PremiumContentGrid";
import { readAccountTypeCookie } from "@/features/auth/lib/account-type-cookie";
import { RateBiringaForm } from "@/features/biringas/components/RateBiringaForm";
import { RecentlyViewedStrip } from "@/features/biringas/components/RecentlyViewedStrip";
import { RecordListingView } from "@/features/biringas/components/RecordListingView";
import { RecordRecentView } from "@/features/biringas/components/RecordRecentView";
import { ReviewsSection } from "@/features/biringas/components/ReviewsSection";
import { ReportListingMenu } from "@/features/biringas/components/ReportListingMenu";
import { ShareMenu } from "@/features/biringas/components/ShareMenu";
import { SimilarProfiles } from "@/features/biringas/components/SimilarProfiles";
import { formatPricePerHour } from "@/features/biringas/format";
import { Card } from "@/shared/design-system/components/Card";
import { Container } from "@/shared/design-system/components/Container";
import { VerifiedBadge } from "@/shared/design-system/components/VerifiedBadge";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";
import { FadeIn } from "@/shared/motion/FadeIn";
import { Reveal, RevealItem } from "@/shared/motion/Reveal";
import { PriceTag } from "@/shared/ui/PriceTag";
import { RatingBadge } from "@/shared/ui/RatingBadge";
import { Tag } from "@/shared/ui/Tag";

interface ProfilePageProps {
  params: Promise<{ slug: string; lang: string }>;
}

export async function generateMetadata({
  params,
}: Readonly<ProfilePageProps>): Promise<Metadata> {
  const { slug, lang } = await params;
  const locale = isSupportedLocale(lang) ? lang : "es";
  // Metadata generation must never crash — fall back to the not-found
  // shell if findBySlug throws (Firestore hiccup, etc.). The page-level
  // findBySlug call below decides the actual render.
  const listing = await findBySlug(slug).catch(() => null);
  if (!listing) {
    return buildPageMetadata({
      title: t(locale, "profile.notFound.title"),
      description: t(locale, "profile.notFound.description"),
      pathname: `/p/${slug}`,
      locale,
      indexable: false,
    });
  }
  return buildPageMetadata({
    title: t(locale, "profile.metadata.title", { name: listing.name }),
    description: listing.bio,
    pathname: `/p/${slug}`,
    locale,
    // Per p-slug.md: per-profile gate. Until the verification flow lands
    // every profile renders noindex regardless of the listing flag.
    indexable: false,
  });
}

const NUMBER_FORMAT = new Intl.NumberFormat("es-CO");

function formatViews(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return NUMBER_FORMAT.format(value);
}

export default async function ProfilePage({ params }: Readonly<ProfilePageProps>) {
  const { slug, lang } = await params;
  if (!isSupportedLocale(lang)) notFound();
  // Reviews are auxiliary content — degrade to null on failure so the
  // profile keeps rendering. ReviewsSection is conditionally mounted below.
  const [listing, reviews, accountType] = await Promise.all([
    findBySlug(slug),
    getListingReviews(slug).catch(() => null),
    readAccountTypeCookie(),
  ]);
  if (!listing) notFound();

  const galleryImages =
    listing.gallery.length > 0 ? listing.gallery : [listing.mainImage];
  // Hide empty attributes entirely (no em-dash placeholders) so the dossier
  // never reads as half-filled — only attributes with real data render.
  const attributeEntries = (
    [
      [t(lang, "profile.attributes.ethnicity"), listing.attributes.ethnicity],
      [t(lang, "profile.attributes.hair"), listing.attributes.hair],
      [t(lang, "profile.attributes.height"), listing.attributes.height],
      [t(lang, "profile.attributes.body"), listing.attributes.body],
      [t(lang, "profile.attributes.breastSize"), listing.attributes.breastSize],
      [t(lang, "profile.attributes.breastType"), listing.attributes.breastType],
      [t(lang, "profile.attributes.country"), listing.attributes.country],
    ] as Array<[string, string | null | undefined]>
  ).filter((entry): entry is [string, string] =>
    Boolean(entry[1] && String(entry[1]).trim()),
  );
  const languages = listing.attributes.languages ?? [];

  // Build the Person schema once; only emit `aggregateRating` when there
  // are real reviews to back it up so Google's rich-result validator
  // doesn't flag the schema.
  const profileJsonLd = personJsonLd({
    name: listing.name,
    slug: listing.slug,
    city: listing.city,
    description: listing.shortBio || listing.bio,
    imageUrl: new URL(listing.mainImage, seoConfig.metadataBase).toString(),
    rating:
      listing.reputation.reviewCount > 0
        ? {
            score: listing.reputation.score,
            reviewCount: listing.reputation.reviewCount,
          }
        : null,
  });

  return (
    <>
      {/* Person schema — VISIBLE-content-backed per Addendum 001 §6.
          Browsers don't execute application/ld+json so this is safe to
          inline without an extra escaping pass; JSON.stringify only
          renders data we own. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }}
      />
      <Header />
      <main className="relative isolate flex flex-1 flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] bg-[radial-gradient(circle_at_20%_0%,rgba(47,93,67,0.10),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(229,162,58,0.08),transparent_60%)]"
        />

        <Container
          width="wide"
          className="flex items-center justify-between gap-4 pt-8 sm:pt-10"
        >
          <Link
            href={localizedHref(lang, "/explorar")}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs uppercase tracking-[0.28em] text-[var(--color-text-subtle)] transition-colors hover:text-[var(--color-foreground)]"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden />
            <span className="hidden sm:inline">{t(lang, "profile.back.long")}</span>
            <span className="sm:hidden">{t(lang, "profile.back.short")}</span>
          </Link>
          <div className="inline-flex shrink-0 items-center gap-2">
            <ShareMenu
              url={new URL(`/p/${listing.slug}`, seoConfig.metadataBase).toString()}
              name={listing.name}
            />
            <ReportListingMenu
              listingSlug={listing.slug}
              listingName={listing.name}
            />
          </div>
        </Container>

        {/* Records the visit in client-side localStorage so the home strip
            can surface this listing on the user's next session. Renders
            nothing visible. */}
        <RecordRecentView
          id={listing.id}
          slug={listing.slug}
          name={listing.name}
          image={listing.mainImage}
          city={listing.city}
          price={formatPricePerHour(listing.pricePerHour)}
        />
        {/* Server-side view counter — bumps reputation.totalViews via Server
            Action with 24h httpOnly-cookie dedupe. Drives the "Vistas" stat
            tile below. */}
        <RecordListingView slug={listing.slug} />

        <Container
          width="wide"
          className="grid grid-cols-1 gap-12 py-10 sm:py-12 lg:grid-cols-12 lg:gap-14 lg:py-16"
        >
          {/* Gallery */}
          <FadeIn
            delay={0.05}
            y={12}
            aria-label={t(lang, "profile.gallery.aria", { name: listing.name })}
            className="lg:col-span-6 xl:col-span-7"
          >
            <CardStackGallery
              images={galleryImages}
              altBase={`${listing.name} en ${listing.city}`}
            />

            {/* Videos (ADR-015) — short clips uploaded by the owner.
                Renders below the photo gallery in a 1-or-2 column grid.
                Hidden when the listing has none. */}
            {listing.videos && listing.videos.length > 0 && (
              <div className="mt-5 flex flex-col gap-3">
                <span className="text-xs uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
                  {listing.videos.length === 1
                    ? t(lang, "profile.videos.single")
                    : t(lang, "profile.videos.multiple")}
                </span>
                <div
                  className={
                    listing.videos.length === 1
                      ? "grid grid-cols-1 gap-3"
                      : "grid grid-cols-1 gap-3 sm:grid-cols-2"
                  }
                >
                  {listing.videos.map((video) => (
                    <VideoPlayer
                      key={video.path}
                      video={video}
                      posterUrl={listing.mainImage}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Unified trust/media badge row — one clean, centered cluster
                directly under the gallery (verified-photos date, video, audio,
                stories) instead of separate floating groups. The verified
                shield keeps its gold accent so the trust signal still leads. */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 text-xs text-[var(--color-text-muted)]">
              {listing.verified && (
                <Link
                  href={localizedHref(lang, "/verificacion")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-gold)]/45 bg-[var(--color-cream-soft)]/80 px-3 py-1.5 font-semibold text-[var(--color-foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-colors duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-gold)] hover:bg-[var(--color-cream)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]"
                  title={t(lang, "profile.verifiedShield.title")}
                >
                  <ShieldCheck
                    className="h-3.5 w-3.5 text-[var(--color-brand-primary)]"
                    aria-hidden
                  />
                  {listing.reputation.daysSinceVerification < 30
                    ? t(lang, "profile.verifiedShield.thisMonth")
                    : t(lang, "profile.verifiedShield.monthsAgo", {
                        count: Math.floor(
                          listing.reputation.daysSinceVerification / 30,
                        ),
                      })}
                </Link>
              )}
              {/* Stricter than `hasVideo` (the cached query flag): show
                  only when there's at least one actual clip attached
                  (ADR-015). Keeps the chip honest if the flag and the
                  array ever drift. */}
              {listing.videos && listing.videos.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface)] px-3 py-1.5 ring-1 ring-[var(--color-border)]">
                  <Film
                    className="h-3.5 w-3.5 text-[var(--color-brand-primary)]"
                    aria-hidden
                  />
                  {listing.videos.length === 1
                    ? t(lang, "profile.chips.videoSingle")
                    : t(lang, "profile.chips.videoPlural", {
                        count: listing.videos.length,
                      })}
                </span>
              )}
              {listing.hasAudio && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface)] px-3 py-1.5 ring-1 ring-[var(--color-border)]">
                  <Mic
                    className="h-3.5 w-3.5 text-[var(--color-brand-secondary-strong)]"
                    aria-hidden
                  />
                  {t(lang, "profile.chips.audio")}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface)] px-3 py-1.5 ring-1 ring-[var(--color-border)]">
                <Sparkles
                  className="h-3.5 w-3.5 text-[var(--color-brand-accent-strong)]"
                  aria-hidden
                />
                {t(lang, "profile.chips.stories", {
                  count: listing.reputation.storiesRecorded,
                })}
              </span>
            </div>
          </FadeIn>

          {/* Profile dossier */}
          <aside className="lg:col-span-6 xl:col-span-5">
            <Reveal as="div" className="lg:sticky lg:top-24 flex flex-col gap-7">
              <RevealItem>
                <span className="text-xs uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
                  {t(lang, "profile.kicker")}
                </span>
                <h1 className="mt-3 text-4xl font-bold leading-[1.05] tracking-tight text-[var(--color-foreground)] sm:text-5xl">
                  {listing.name}
                  <span className="ml-3 align-middle text-2xl font-normal text-[var(--color-text-muted)] sm:text-3xl">
                    {listing.age}
                  </span>
                </h1>
                <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
                  <MapPin className="h-4 w-4" aria-hidden />
                  {listing.city}
                  {listing.neighborhood ? ` · ${listing.neighborhood}` : ""}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {listing.verified && <VerifiedBadge />}
                  <RatingBadge
                    score={listing.reputation.score}
                    count={listing.reputation.reviewCount}
                    size="md"
                  />
                  {listing.tags.map((tag) => (
                    <Tag key={tag} tone="primary">
                      {tag}
                    </Tag>
                  ))}
                </div>
              </RevealItem>

              <RevealItem>
                <p className="text-base leading-relaxed text-[var(--color-text-muted)]">
                  {listing.bio}
                </p>
              </RevealItem>

              {/* Stats banner — one sleek horizontal row (divided segments)
                  instead of three separate cards, so it reads as a quiet
                  metadata strip and doesn't compete with the price card. */}
              <RevealItem as="div">
                <dl className="flex items-stretch divide-x divide-[var(--color-border)] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] ring-1 ring-[var(--color-border)]">
                  <StatTile
                    label={t(lang, "profile.stat.views")}
                    value={formatViews(listing.reputation.totalViews)}
                    icon={<Eye className="h-3.5 w-3.5" aria-hidden />}
                  />
                  <StatTile
                    label={t(lang, "profile.stat.daysActive")}
                    value={NUMBER_FORMAT.format(
                      listing.reputation.daysAdvertised,
                    )}
                  />
                  <StatTile
                    label={t(lang, "profile.stat.verified")}
                    value={t(lang, "profile.stat.verifiedAgo", {
                      days: listing.reputation.daysSinceVerification,
                    })}
                    icon={
                      <ShieldCheck
                        className="h-3.5 w-3.5 text-[var(--color-brand-primary)]"
                        aria-hidden
                      />
                    }
                  />
                </dl>
              </RevealItem>

              {/* Price + CTA card */}
              <RevealItem>
                <Card tone="surface" padding="lg" className="shadow-[var(--shadow-md)]">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
                      {t(lang, "profile.priceLabel")}
                    </span>
                    <PriceTag
                      value={formatPricePerHour(listing.pricePerHour)}
                      size="lg"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3">
                  <ContactReveal
                    slug={listing.slug}
                    listingName={listing.name}
                    contactChannels={listing.contactChannels}
                  />
                </div>
                </Card>
              </RevealItem>

              {/* Attributes — only render the whole section when there's at
                  least one filled attribute or a language to show. */}
              {(attributeEntries.length > 0 || languages.length > 0) && (
                <RevealItem>
                  <Section title={t(lang, "profile.section.attributes")}>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    {attributeEntries.map(([label, value]) => (
                      <div key={label} className="flex flex-col">
                        <dt className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                          {label}
                        </dt>
                        <dd className="text-[var(--color-foreground)]">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {languages.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                        {t(lang, "profile.attributes.languages")}
                      </span>
                      {languages.map((language) => (
                        <Tag key={language} tone="accent">
                          {language}
                        </Tag>
                      ))}
                    </div>
                  )}
                  </Section>
                </RevealItem>
              )}

              <RevealItem>
                <Section title={t(lang, "profile.section.services")}>
                  <div className="flex flex-wrap gap-2">
                    {listing.services.map((s) => (
                      <Tag key={s} tone="secondary">
                        {s}
                      </Tag>
                    ))}
                  </div>
                </Section>
              </RevealItem>

              <RevealItem>
                <Section title={t(lang, "profile.section.meetingPlaces")}>
                  <div className="flex flex-wrap gap-2">
                    {listing.meetingContexts.map((m) => (
                      <Tag key={m} tone="neutral">
                        {m}
                      </Tag>
                    ))}
                  </div>
                </Section>
              </RevealItem>
            </Reveal>
          </aside>
        </Container>

        {/* Interactive rating form — sits just above the reviews readout
            so the social proof immediately follows the invitation to
            contribute it. Anonymous users see a sign-in prompt instead
            of the full form. */}
        <section
          aria-label={t(lang, "profile.rate.aria")}
          className="border-t border-[var(--color-border)]/50 bg-[var(--color-background-elevated)]/40"
        >
          <Container width="wide" className="py-10 lg:py-12">
            <div className="mx-auto max-w-3xl">
              <RateBiringaForm
                listingSlug={listing.slug}
                listingName={listing.name}
                accountType={accountType}
              />
            </div>
          </Container>
        </section>

        {reviews && (
          <ReviewsSection listingName={listing.name} reviews={reviews} />
        )}

        {/* Locked-content tease — OnlyFans-style premium grid. Sits before
            the similar-profiles strip so the upsell moment lands after
            the user has read the bio + reviews but before they bounce
            to another profile.

            HIDDEN: mock-only upsell with no real paywall/subscription flow
            wired yet. Re-enable by restoring <PremiumContentGrid /> once the
            subscription backend exists. Component + i18n copy kept intact. */}
        {/* <PremiumContentGrid listing={listing} /> */}

        <SimilarProfiles slug={listing.slug} />
        <RecentlyViewedStrip />
      </main>
      <Footer />
    </>
  );
}

interface StatTileProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

function StatTile({ label, value, icon }: Readonly<StatTileProps>) {
  return (
    <div className="group/stat relative flex flex-1 flex-col items-center justify-center gap-0.5 px-3 py-3 text-center transition-colors duration-300 ease-[var(--ease-standard)] hover:bg-[var(--color-background-elevated)]">
      <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">
        {icon && (
          <span className="inline-flex transition-transform duration-300 ease-[var(--ease-standard)] group-hover/stat:scale-110">
            {icon}
          </span>
        )}
        {label}
      </dt>
      <dd className="text-base font-semibold tabular-nums text-[var(--color-foreground)]">
        {value}
      </dd>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: Readonly<SectionProps>) {
  return (
    <section>
      {/* Razor-thin accent rule that runs across the column after the label —
          a sharper, more editorial divider than the old leader dash. */}
      <h2 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-primary)]">
        <span className="whitespace-nowrap">{title}</span>
        <span
          aria-hidden
          className="h-px flex-1 bg-[var(--color-brand-primary)]/20"
        />
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
