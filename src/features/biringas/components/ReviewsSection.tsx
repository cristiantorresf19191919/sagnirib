import { Quote, ShieldCheck, Star, ThumbsDown, ThumbsUp } from "lucide-react";

import type { ReviewItem, ReviewsAggregate } from "@/server/biringas";
import { Container } from "@/shared/design-system/components/Container";

interface ReviewsSectionProps {
  listingName: string;
  reviews: ReviewsAggregate;
}

const COMPACT_FORMAT = new Intl.NumberFormat("es-CO", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const NUMBER_FORMAT = new Intl.NumberFormat("es-CO");
const DATE_FORMAT = new Intl.DateTimeFormat("es-CO", {
  month: "short",
  year: "numeric",
});

function formatCount(value: number): string {
  if (value < 1000) return NUMBER_FORMAT.format(value);
  return COMPACT_FORMAT.format(value).replace(/\s/g, "");
}

const CRITERIA_DEFS: ReadonlyArray<[keyof ReviewsAggregate["breakdown"], string]> = [
  ["trato", "Trato"],
  ["puntualidad", "Puntualidad"],
  ["conversacion", "Conversación"],
  ["presentacion", "Presentación"],
  ["discrecion", "Discreción"],
];

export function ReviewsSection({
  listingName,
  reviews,
}: Readonly<ReviewsSectionProps>) {
  if (reviews.total === 0) {
    return (
      <section
        id="opiniones"
        className="border-t border-[var(--color-border)]/50 bg-[var(--color-background-elevated)]/40"
      >
        <Container width="wide" className="py-16">
          <div className="flex flex-col gap-3">
            <span className="text-xs uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
              Opiniones
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
              Aún sin opiniones publicadas
            </h2>
            <p className="max-w-xl text-sm text-[var(--color-text-muted)]">
              Cuando los clientes verificados dejen su experiencia con{" "}
              {listingName}, aparecerá aquí.
            </p>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section
      id="opiniones"
      aria-labelledby="reviews-title"
      className="relative isolate border-t border-[var(--color-border)]/50 bg-[var(--color-background-elevated)]/40"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-[var(--color-brand-primary)]/40 to-transparent"
      />

      <Container width="wide" className="py-16 lg:py-20">
        <header className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-muted)] backdrop-blur-sm">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-warn)] shadow-[0_0_10px_rgba(255,228,94,0.65)]"
            />
            Opiniones · {formatCount(reviews.total)} reseñas
          </span>
          <h2
            id="reviews-title"
            className="mt-5 text-3xl font-semibold leading-[1.05] tracking-tight text-[var(--color-foreground)] sm:text-4xl"
          >
            Esto dicen quienes ya estuvieron con{" "}
            <span className="bg-gradient-to-br from-[var(--color-brand-primary-strong)] via-[var(--color-brand-primary)] to-[var(--color-brand-secondary-strong)] bg-clip-text text-transparent">
              {listingName}
            </span>
            .
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
            Calificaciones agregadas por aspecto, reseñas verificadas y
            reacciones anónimas. Sin nombres, sin contactos — sólo señal real
            de quienes ya pasaron por aquí.
          </p>
        </header>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col gap-5 lg:col-span-5">
            <ScoreCard reviews={reviews} />
            <DistributionCard
              distribution={reviews.distribution}
              total={reviews.total}
            />
            <BreakdownCard breakdown={reviews.breakdown} />
            <AnonymousReactionsCard
              likes={reviews.anonymousLikes}
              dislikes={reviews.anonymousDislikes}
            />
          </div>

          <div className="flex flex-col gap-4 lg:col-span-7">
            <FilterChips />
            <ul className="grid grid-cols-1 gap-4">
              {reviews.reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </ul>
            <div className="mt-2 flex items-center justify-center">
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-5 text-sm font-medium text-[var(--color-foreground)] transition-[border-color,background] duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary)]/60 hover:bg-[var(--color-surface)]"
              >
                Ver las {formatCount(reviews.total)} opiniones
              </button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

interface ScoreCardProps {
  reviews: ReviewsAggregate;
}

function ScoreCard({ reviews }: Readonly<ScoreCardProps>) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-6 backdrop-blur-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-16 h-44 w-44 rounded-full bg-[radial-gradient(closest-side,rgba(255,228,94,0.22),transparent_70%)] blur-2xl"
      />
      <div className="relative flex items-end gap-4">
        <span className="text-6xl font-bold leading-none text-[var(--color-foreground)]">
          {reviews.averageRating.toFixed(1)}
        </span>
        <div className="pb-1">
          <Stars value={reviews.averageRating} size="lg" />
          <p className="mt-1 text-xs text-[var(--color-text-subtle)]">
            sobre {formatCount(reviews.total)} opiniones
          </p>
        </div>
      </div>
      <p className="relative mt-5 text-sm text-[var(--color-text-muted)]">
        El{" "}
        <span className="font-semibold text-[var(--color-brand-accent-strong)]">
          {reviews.recommendRate}%
        </span>{" "}
        recomienda este perfil.
      </p>
    </div>
  );
}

interface DistributionCardProps {
  distribution: ReviewsAggregate["distribution"];
  total: number;
}

function DistributionCard({
  distribution,
  total,
}: Readonly<DistributionCardProps>) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-5 backdrop-blur-sm">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
        Distribución
      </h3>
      <ul className="mt-3 flex flex-col gap-2.5">
        {distribution.map((d) => (
          <li
            key={d.stars}
            className="grid grid-cols-[44px_1fr_72px] items-center gap-3 text-xs"
          >
            <span className="inline-flex items-center gap-1 text-[var(--color-text-muted)]">
              <Star
                className="h-3 w-3 fill-[var(--color-brand-warn)] text-[var(--color-brand-warn)]"
                aria-hidden
              />
              {d.stars}
            </span>
            <span
              className="block h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]"
              aria-hidden
            >
              <span
                className="block h-full rounded-full bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-secondary)]"
                style={{ width: `${d.percent}%` }}
              />
            </span>
            <span className="text-right tabular-nums text-[var(--color-text-subtle)]">
              {NUMBER_FORMAT.format(d.count)} · {d.percent}%
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-[var(--color-text-subtle)]">
        Calculado sobre {NUMBER_FORMAT.format(total)} reseñas verificadas.
      </p>
    </div>
  );
}

interface BreakdownCardProps {
  breakdown: ReviewsAggregate["breakdown"];
}

function BreakdownCard({ breakdown }: Readonly<BreakdownCardProps>) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-5 backdrop-blur-sm">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
        Calificación por aspecto
      </h3>
      <ul className="mt-3 flex flex-col gap-3">
        {CRITERIA_DEFS.map(([key, label]) => {
          const value = breakdown[key];
          return (
            <li
              key={key}
              className="grid grid-cols-[120px_1fr_40px] items-center gap-3 text-xs"
            >
              <span className="text-[var(--color-text-muted)]">{label}</span>
              <span
                aria-hidden
                className="block h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-muted)]"
              >
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-[var(--color-brand-accent)] via-[var(--color-brand-primary)] to-[var(--color-brand-secondary)]"
                  style={{ width: `${(value / 5) * 100}%` }}
                />
              </span>
              <span className="text-right font-semibold tabular-nums text-[var(--color-foreground)]">
                {value.toFixed(1)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface AnonymousReactionsCardProps {
  likes: number;
  dislikes: number;
}

function AnonymousReactionsCard({
  likes,
  dislikes,
}: Readonly<AnonymousReactionsCardProps>) {
  const total = likes + dislikes;
  const positiveRate = total === 0 ? 0 : Math.round((likes / total) * 100);
  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-5 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
            Reacciones anónimas
          </h3>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Sin nombre, sin contacto. Sólo señal de la comunidad.
          </p>
        </div>
        <span
          aria-hidden
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-background)]/60 text-[var(--color-text-muted)]"
        >
          <AnonymityMark />
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex flex-col items-start gap-1 rounded-[var(--radius-lg)] border border-[var(--color-brand-accent)]/30 bg-[var(--color-brand-accent)]/8 p-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-brand-accent-strong)]">
            <ThumbsUp className="h-3 w-3" aria-hidden />
            Me gusta
          </span>
          <span className="text-2xl font-bold tabular-nums text-[var(--color-foreground)]">
            {formatCount(likes)}
          </span>
        </div>
        <div className="flex flex-col items-start gap-1 rounded-[var(--radius-lg)] border border-[var(--color-brand-highlight)]/30 bg-[var(--color-brand-highlight)]/8 p-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-brand-highlight)]">
            <ThumbsDown className="h-3 w-3" aria-hidden />
            No me gusta
          </span>
          <span className="text-2xl font-bold tabular-nums text-[var(--color-foreground)]">
            {formatCount(dislikes)}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <span
          className="block h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-muted)]"
          aria-hidden
        >
          <span
            className="block h-full rounded-full bg-gradient-to-r from-[var(--color-brand-accent)] to-[var(--color-brand-primary)]"
            style={{ width: `${positiveRate}%` }}
          />
        </span>
        <p className="mt-2 text-[11px] text-[var(--color-text-subtle)]">
          {positiveRate}% de reacciones positivas
        </p>
      </div>
    </div>
  );
}

function FilterChips() {
  const chips: ReadonlyArray<[string, boolean]> = [
    ["Todas", true],
    ["Recientes", false],
    ["5 estrellas", false],
    ["Críticas", false],
    ["Verificadas", false],
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map(([label, active]) => (
        <span
          key={label}
          aria-current={active ? "true" : undefined}
          className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-[border-color,background] duration-200 ease-[var(--ease-standard)] ${
            active
              ? "border-[var(--color-brand-primary)]/60 bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary-strong)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)]/40 text-[var(--color-text-muted)]"
          }`}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

interface ReviewCardProps {
  review: ReviewItem;
}

function ReviewCard({ review }: Readonly<ReviewCardProps>) {
  const dateLabel = DATE_FORMAT.format(new Date(review.date));
  return (
    <li className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)]/70 bg-[var(--color-surface)]/60 p-5 backdrop-blur-sm transition-colors duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary)]/40">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-background)]/70 text-[var(--color-text-muted)]"
        >
          <AnonymityMark />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--color-foreground)]">
                {review.alias}
              </p>
              <p className="mt-0.5 inline-flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--color-text-subtle)]">
                <span>{review.city}</span>
                <span aria-hidden>·</span>
                <span>{dateLabel}</span>
                {review.verified && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1 text-[var(--color-brand-accent-strong)]">
                      <ShieldCheck className="h-3 w-3" aria-hidden />
                      verificado
                    </span>
                  </>
                )}
              </p>
            </div>
            <Stars value={review.rating} />
          </div>

          <p className="relative mt-3 pl-5 text-sm leading-relaxed text-[var(--color-text-muted)]">
            <Quote
              className="absolute left-0 top-0.5 h-3.5 w-3.5 text-[var(--color-brand-primary-strong)]/70"
              aria-hidden
            />
            {review.body}
          </p>

          <div className="mt-4 flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">
            <span className="inline-flex items-center gap-1.5">
              <ThumbsUp className="h-3 w-3" aria-hidden />
              Útil · {review.helpful}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ThumbsDown className="h-3 w-3" aria-hidden />
              No útil · {review.notHelpful}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}

interface StarsProps {
  value: number;
  size?: "sm" | "lg";
}

function Stars({ value, size = "sm" }: Readonly<StarsProps>) {
  const filled = Math.round(value);
  const cls = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`Calificación ${value.toFixed(1)} de 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${cls} ${
            i <= filled
              ? "fill-[var(--color-brand-warn)] text-[var(--color-brand-warn)]"
              : "text-[var(--color-text-subtle)]"
          }`}
          aria-hidden
        />
      ))}
    </span>
  );
}

function AnonymityMark() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M3 11 L21 11" strokeLinecap="round" />
      <path d="M2 11 Q5 6 12 6 Q19 6 22 11" />
      <circle cx="8" cy="14" r="3" fill="currentColor" stroke="none" />
      <circle cx="16" cy="14" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}
