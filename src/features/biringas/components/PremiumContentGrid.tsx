import Image from "next/image";
import {
  Camera,
  Crown,
  Film,
  Image as ImageIcon,
  Lock,
  Mic,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { readLocale } from "@/core/i18n/locale";
import { t } from "@/core/i18n/messages";
import type { BiringaListing } from "@/server/biringas";
import { Container } from "@/shared/design-system/components/Container";

type PostKind = "photo" | "video" | "audio";

interface PremiumPost {
  id: string;
  kind: PostKind;
  /** Headline copy shown in the locked overlay. */
  title: string;
  /** Soft teaser under the title. */
  teaser: string;
  /** Source for the blurred preview image. Uses the listing's gallery
   *  rotated by index so it feels like real curated content. */
  cover: string;
  /** "12 fotos" / "4:32" / "8 audios" — small badge anchor. */
  meta: string;
  /** Mock subscriber count to anchor social proof. */
  likes: number;
}

interface PremiumContentGridProps {
  listing: BiringaListing;
}

function buildKindLabels(locale: SupportedLocale): Record<PostKind, string> {
  return {
    photo: t(locale, "premium.kind.photo"),
    video: t(locale, "premium.kind.video"),
    audio: t(locale, "premium.kind.audio"),
  };
}

const KIND_ICON: Record<PostKind, LucideIcon> = {
  photo: ImageIcon,
  video: Film,
  audio: Mic,
};

/**
 * Deterministic pseudo-random per listing — same listing always renders
 * the same set of mock premium posts on every page load. Avoids the
 * "content shifts on each visit" feel that a `Math.random` would create.
 */
function hash(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) {
    h = (h << 5) - h + slug.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/**
 * Build the mock catalogue of premium posts for this listing.
 *
 * Six tiles total (2×3 on desktop, 2×3 on mobile via natural flex wrap).
 * Each pulls a different cover from the listing's gallery so they feel
 * authored. If the gallery is short the cover loops; if empty we fall
 * back to the listing's main image.
 */
function buildPosts(
  listing: BiringaListing,
  locale: SupportedLocale,
): ReadonlyArray<PremiumPost> {
  const gallery =
    listing.gallery.length > 0 ? listing.gallery : [listing.mainImage];
  const seed = hash(listing.slug);

  const templates: ReadonlyArray<
    Omit<PremiumPost, "id" | "cover" | "likes"> & { likesBase: number }
  > = [
    {
      kind: "photo",
      title: t(locale, "premium.post.photoTitle1"),
      teaser: t(locale, "premium.post.photoTeaser1"),
      meta: t(locale, "premium.post.photoMeta1"),
      likesBase: 412,
    },
    {
      kind: "video",
      title: t(locale, "premium.post.videoTitle1"),
      teaser: t(locale, "premium.post.videoTeaser1"),
      meta: t(locale, "premium.post.videoMeta1"),
      likesBase: 1184,
    },
    {
      kind: "audio",
      title: t(locale, "premium.post.audioTitle1"),
      teaser: t(locale, "premium.post.audioTeaser1"),
      meta: t(locale, "premium.post.audioMeta1"),
      likesBase: 287,
    },
    {
      kind: "photo",
      title: t(locale, "premium.post.photoTitle2"),
      teaser: t(locale, "premium.post.photoTeaser2"),
      meta: t(locale, "premium.post.photoMeta2"),
      likesBase: 612,
    },
    {
      kind: "video",
      title: t(locale, "premium.post.videoTitle2"),
      teaser: t(locale, "premium.post.videoTeaser2"),
      meta: t(locale, "premium.post.videoMeta2"),
      likesBase: 982,
    },
    {
      kind: "photo",
      title: t(locale, "premium.post.photoTitle3"),
      teaser: t(locale, "premium.post.photoTeaser3"),
      meta: t(locale, "premium.post.photoMeta3"),
      likesBase: 318,
    },
  ];

  return templates.map((tpl, i) => ({
    id: `${listing.slug}-pp-${i}`,
    kind: tpl.kind,
    title: tpl.title,
    teaser: tpl.teaser,
    cover: gallery[i % gallery.length]!,
    meta: tpl.meta,
    likes: tpl.likesBase + (seed % 91) + i * 7,
  }));
}

/**
 * OnlyFans-style locked-content tease.
 *
 * Renders below the profile dossier. Six mock posts (photo sets, videos,
 * audios) blurred behind a lock overlay. Hovering a tile pulls the
 * "Suscríbete para ver" CTA up over the cover; the underlying photo
 * lifts toward the camera with a soft scale + saturation bump so the
 * affordance reads as "press to unlock". Pricing tier shown at top.
 *
 * No subscribe handler is wired yet — clicking a tile lands on a
 * `#suscripciones` anchor that the future paywall flow will own. For
 * now it scrolls to the section header so users can read the tiers.
 */
export async function PremiumContentGrid({
  listing,
}: Readonly<PremiumContentGridProps>) {
  const locale = await readLocale();
  const posts = buildPosts(listing, locale);
  const kindLabels = buildKindLabels(locale);
  const numberFmt = new Intl.NumberFormat(locale === "en" ? "en-US" : "es-CO");

  return (
    <section
      id="suscripciones"
      data-testid="premium-content-grid"
      aria-labelledby="premium-title"
      className="relative isolate scroll-mt-24 overflow-hidden border-y border-[var(--color-border)]/60 bg-[var(--color-background-elevated)] py-14 sm:py-20"
    >
      {/* Aubergine ambient glow — same vocabulary as the editorial aurora
          elsewhere. Picks up the gold accent because Premium is a
          monetisation surface. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-24 top-10 -z-10 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(200,166,118,0.30), transparent 70%)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-10 -z-10 h-80 w-80 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(124,90,78,0.30), transparent 70%)",
        }}
      />

      <Container width="wide" className="flex flex-col gap-7">
        {/* Section header — eyebrow / Fraunces title / serif sub + tier
            pill at the right with the monthly price. */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-brand-accent-strong)]">
              <span
                aria-hidden
                className="inline-block h-px w-10 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-[var(--color-brand-primary)]/40"
              />
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--color-gold)] shadow-[0_0_0_3px_rgba(200,166,118,0.18)]"
              />
              {t(locale, "premium.eyebrow")}
            </span>
            <h2
              id="premium-title"
              className="font-[var(--font-display)] text-[clamp(26px,3.6vw,40px)] font-[360] leading-[1.04] tracking-[-0.025em] text-[var(--color-foreground)]"
            >
              {t(locale, "premium.title.lead")}{" "}
              <span className="italic text-[var(--color-brand-primary)]">
                {listing.name}
              </span>{" "}
              {t(locale, "premium.title.trailing")}
            </h2>
            <p className="max-w-xl font-[var(--font-serif)] text-[15px] leading-[1.55] text-[var(--color-text-muted)]">
              {t(locale, "premium.subtitle.lead")}{" "}
              <em>{t(locale, "premium.subtitle.emphasis")}</em>
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-gold)]/45 bg-[var(--color-gold)]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-gold-deep)]">
              <Crown className="h-3.5 w-3.5" aria-hidden />
              {t(locale, "premium.tier.label")}
            </span>
            <span className="inline-flex items-baseline gap-1 text-[var(--color-foreground)]">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                {t(locale, "premium.tier.from")}
              </span>
              <span className="font-[var(--font-display)] text-[26px] font-[480] tabular-nums">
                $39.000
              </span>
              <span className="text-[12px] text-[var(--color-text-muted)]">
                {t(locale, "premium.tier.perMonth")}
              </span>
            </span>
          </div>
        </header>

        {/* Grid of locked tiles */}
        <ul
          data-testid="premium-content-list"
          className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3"
        >
          {posts.map((post) => (
            <PremiumTile
              key={post.id}
              post={post}
              numberFmt={numberFmt}
              kindLabel={kindLabels[post.kind]}
              subscribeLabel={t(locale, "premium.tile.subscribe")}
              ariaLabel={t(locale, "premium.tile.aria", {
                name: listing.name,
                title: post.title,
              })}
            />
          ))}
        </ul>

        {/* Footer perks strip — three reasons to subscribe, anchors trust */}
        <ul
          aria-label={t(locale, "premium.perks.aria")}
          className="grid grid-cols-1 gap-3 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-[13px] text-[var(--color-text-muted)] sm:grid-cols-3 sm:items-center sm:gap-4 sm:p-5"
        >
          <li className="inline-flex items-center gap-2">
            <Camera
              className="h-4 w-4 text-[var(--color-brand-primary)]"
              aria-hidden
            />
            {t(locale, "premium.perks.fresh")}
          </li>
          <li className="inline-flex items-center gap-2">
            <Sparkles
              className="h-4 w-4 text-[var(--color-brand-accent-strong)]"
              aria-hidden
            />
            {t(locale, "premium.perks.chat")}
          </li>
          <li className="inline-flex items-center gap-2">
            <Lock
              className="h-4 w-4 text-[var(--color-brand-primary)]"
              aria-hidden
            />
            {t(locale, "premium.perks.cancel")}
          </li>
        </ul>
      </Container>
    </section>
  );
}

interface PremiumTileProps {
  post: PremiumPost;
  numberFmt: Intl.NumberFormat;
  kindLabel: string;
  subscribeLabel: string;
  ariaLabel: string;
}

/**
 * A single locked tile. Cover blurred behind a dark-violet scrim; lock
 * badge top-right; kind badge top-left; meta + title revealed on hover
 * with a subscribe CTA that lifts up. CSS-only — no JS needed.
 */
function PremiumTile({
  post,
  numberFmt,
  kindLabel,
  subscribeLabel,
  ariaLabel,
}: Readonly<PremiumTileProps>) {
  const KindIcon = KIND_ICON[post.kind];
  return (
    <li className="group/tile relative">
      <a
        href="#suscripciones"
        aria-label={ariaLabel}
        data-testid={`premium-tile-${post.id}`}
        className="relative block aspect-[4/5] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-cream-deep)] shadow-[var(--shadow-sm)] ring-1 ring-[var(--color-border)] transition-[box-shadow,transform,ring-color] duration-300 ease-[var(--ease-standard)] hover:-translate-y-1 hover:shadow-[0_22px_50px_-22px_rgba(20,28,24,0.45)] hover:ring-[var(--color-gold)]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background-elevated)]"
      >
        {/* Cover image — pre-blurred so the lock is visible from rest.
            On hover the blur eases off and the photo brightens, hinting
            at the unlocked state without revealing it. */}
        <Image
          src={post.cover}
          alt=""
          aria-hidden
          fill
          quality={55}
          sizes="(max-width: 768px) 45vw, 26vw"
          className="object-cover saturate-[0.92] transition-[filter,transform] duration-[600ms] ease-[var(--ease-standard)] group-hover/tile:scale-[1.04] group-hover/tile:saturate-100"
          style={{ filter: "blur(12px)" }}
        />

        {/* Dark scrim — slightly lighter on hover so the photo "comes
            forward" but never fully reveals (still blurred). */}
        <span
          aria-hidden
          className="absolute inset-0 bg-[rgba(15,4,22,0.55)] transition-[background-color] duration-300 ease-[var(--ease-standard)] group-hover/tile:bg-[rgba(15,4,22,0.42)]"
        />

        {/* Diagonal repeating-stripe texture — subtle, gives the locked
            tile a "vault door" feel without being noisy. */}
        <span
          aria-hidden
          className="absolute inset-0 opacity-[0.06] mix-blend-soft-light"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, transparent 0 14px, rgba(255,255,255,0.4) 14px 15px)",
          }}
        />

        {/* Top-LEFT kind badge — small frosted pill so the user knows
            what's behind the curtain before they pay. */}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-[rgba(248,242,228,0.18)] bg-[rgba(20,28,24,0.55)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F2EBDC] backdrop-blur-md">
          <KindIcon className="h-3 w-3" aria-hidden />
          {kindLabel}
        </span>

        {/* Top-RIGHT lock disc — gold ring picks up the Premium theme.
            Pulses subtly on hover. */}
        <span
          aria-hidden
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-gold)]/50 bg-[rgba(20,28,24,0.55)] text-[var(--color-gold)] backdrop-blur-md transition-[transform,border-color] duration-300 ease-[var(--ease-standard)] group-hover/tile:scale-110 group-hover/tile:border-[var(--color-gold)]"
        >
          <Lock className="h-4 w-4" aria-hidden />
        </span>

        {/* Bottom block — meta strip always visible + the subscribe CTA
            that lifts up on hover. Cream text hard-coded since it always
            sits over the dark scrim (works in all 3 themes). */}
        <div className="absolute inset-x-3 bottom-3 flex flex-col gap-2 text-[#F2EBDC]">
          <div className="flex items-center justify-between text-[11px] opacity-90">
            <span className="inline-flex items-center gap-1">
              <span
                aria-hidden
                className="inline-block h-1 w-1 rotate-45 bg-[var(--color-gold)]"
              />
              {post.meta}
            </span>
            <span className="tabular-nums">
              {numberFmt.format(post.likes)} ❤
            </span>
          </div>
          {/* Translates 8 px up + reveals body on hover. At rest only
              the meta line + title head are visible. */}
          <div className="translate-y-2 transition-[transform,opacity] duration-300 ease-[var(--ease-standard)] group-hover/tile:translate-y-0">
            <h3 className="font-[var(--font-display)] text-[16px] font-[440] leading-tight tracking-tight">
              {post.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug opacity-0 transition-opacity duration-300 ease-[var(--ease-standard)] group-hover/tile:opacity-90">
              {post.teaser}
            </p>
          </div>
          {/* Subscribe CTA — slides up + appears only on hover. Forest
              pill so it reads as a true call to action over the dark
              scrim. */}
          <span className="inline-flex translate-y-3 items-center justify-center gap-1.5 rounded-full bg-[var(--color-gold)] px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[#1A0822] opacity-0 shadow-[0_8px_22px_-8px_rgba(200,166,118,0.55)] transition-[opacity,transform] duration-300 ease-[var(--ease-standard)] group-hover/tile:translate-y-0 group-hover/tile:opacity-100">
            <Crown className="h-3.5 w-3.5" aria-hidden />
            {subscribeLabel}
          </span>
        </div>
      </a>
    </li>
  );
}
