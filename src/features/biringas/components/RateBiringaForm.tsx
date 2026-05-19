"use client";

import Link from "next/link";
import { useTransition, useState } from "react";
import { CheckCircle2, LogIn, Star } from "lucide-react";

import { useAuthSession } from "@/features/auth/lib/use-auth-session";

import { submitReview } from "../actions/submit-review";

/**
 * UI mirror of the server-side `REVIEW_LIMITS` constant. Server is the
 * source of truth and will reject mismatched values via the schema —
 * keeping a duplicate here lets this client component stay free of any
 * server-only import. If `src/server/biringas/review-types.ts#REVIEW_LIMITS`
 * changes, update this object too.
 */
const REVIEW_LIMITS = {
  bodyMin: 20,
  bodyMax: 2000,
  cityMax: 80,
  aliasMax: 40,
} as const;

interface RateBiringaFormProps {
  /** Slug of the listing being rated — wired into the action payload. */
  listingSlug: string;
  /** Listing name — used in the prompt and the success message. */
  listingName: string;
}

/**
 * Interactive 5-star rating form for the profile page.
 *
 * Logged-in customers see the full form: a star row with hover preview,
 * an optional alias field, a required city, and a body textarea (matches
 * the server schema's `REVIEW_LIMITS`). On submit the form calls the
 * existing `submitReview` Server Action which validates → authenticates
 * → routes to the configured adapter (mock today, Firestore later).
 *
 * Anonymous users see a lightweight prompt asking them to sign in. We
 * never render the form's interactive state for them — the auth gate is
 * also enforced server-side in `submitReview`, so this is a UX nicety,
 * not a security boundary.
 *
 * The form is intentionally compact: the star row is the primary
 * affordance, the rest of the fields only mount AFTER the user picks a
 * rating. That lets passive readers skim past the form without it
 * dominating the page; engaged users get the full form once committed.
 */
export function RateBiringaForm({
  listingSlug,
  listingName,
}: Readonly<RateBiringaFormProps>) {
  const { status } = useAuthSession();
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const [city, setCity] = useState("");
  const [alias, setAlias] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successRating, setSuccessRating] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  // Star displayed as "filled" — hover preview wins over committed rating
  // so users see what they're about to pick.
  const displayedRating = hoverRating ?? rating ?? 0;

  const reset = () => {
    setRating(null);
    setHoverRating(null);
    setBody("");
    setCity("");
    setAlias("");
    setError(null);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (rating === null) {
      setError("Elige una calificación de estrellas antes de enviar.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitReview({
        listingSlug,
        rating,
        body: body.trim(),
        city: city.trim(),
        alias: alias.trim() ? alias.trim() : undefined,
      });
      if (result.ok) {
        setSuccessRating(rating);
        reset();
      } else {
        setError(
          result.error?.message ??
            "No pudimos publicar tu reseña. Intenta de nuevo.",
        );
      }
    });
  };

  // --- Success state -------------------------------------------------------
  if (successRating !== null) {
    return (
      <section
        data-testid="rate-biringa-form-success"
        className="rounded-[var(--radius-2xl)] border border-[var(--color-brand-primary)]/40 bg-[var(--color-brand-primary)]/8 p-6"
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)]"
          >
            <CheckCircle2 className="h-5 w-5" aria-hidden />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="text-base font-semibold text-[var(--color-foreground)]">
              Gracias por opinar
            </h3>
            <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
              Calificaste a {listingName} con{" "}
              <span className="inline-flex items-center gap-0.5 align-[-2px]">
                {Array.from({ length: successRating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-3.5 w-3.5 fill-[var(--color-brand-warn)] text-[var(--color-brand-warn)]"
                    aria-hidden
                  />
                ))}
              </span>
              . Tu reseña ya forma parte de la comunidad verificada.
            </p>
            <button
              type="button"
              onClick={() => setSuccessRating(null)}
              className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-foreground)] transition-colors hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)]"
            >
              Enviar otra opinión
            </button>
          </div>
        </div>
      </section>
    );
  }

  // --- Anonymous state -----------------------------------------------------
  if (status === "anonymous") {
    return (
      <section
        data-testid="rate-biringa-form-anonymous"
        className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-6 backdrop-blur-sm"
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-background)]/60 text-[var(--color-text-muted)]"
          >
            <LogIn className="h-4 w-4" aria-hidden />
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            <div>
              <h3 className="text-base font-semibold text-[var(--color-foreground)]">
                ¿Ya estuviste con {listingName}?
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
                Ingresa con tu cuenta para dejar una calificación verificada.
                Tu identidad nunca se publica.
              </p>
            </div>
            <Link
              href="/ingresar"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              Ingresar para opinar
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // --- Loading or disabled (Firebase env not set) → render nothing ---------
  if (status === "loading" || status === "disabled") {
    return null;
  }

  // --- Logged-in interactive form -----------------------------------------
  return (
    <form
      data-testid="rate-biringa-form"
      onSubmit={onSubmit}
      className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-6 backdrop-blur-sm"
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-[var(--color-foreground)]">
          Califica a {listingName}
        </h3>
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          Tu opinión ayuda a otros clientes a elegir con confianza.
        </p>
      </div>

      {/* Star row — the primary affordance. Keyboard users get focus
          rings on each button + arrow-key navigation via native tab order. */}
      <div
        className="mt-4 flex items-center gap-1"
        role="radiogroup"
        aria-label="Calificación de 1 a 5 estrellas"
      >
        {[1, 2, 3, 4, 5].map((value) => {
          const filled = value <= displayedRating;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} estrella${value === 1 ? "" : "s"}`}
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(null)}
              onFocus={() => setHoverRating(value)}
              onBlur={() => setHoverRating(null)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-150 ease-[var(--ease-standard)] hover:-translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
            >
              <Star
                className={`h-7 w-7 transition-colors duration-150 ${
                  filled
                    ? "fill-[var(--color-brand-warn)] text-[var(--color-brand-warn)]"
                    : "text-[var(--color-text-subtle)]"
                }`}
                aria-hidden
              />
            </button>
          );
        })}
        {displayedRating > 0 && (
          <span className="ml-2 text-sm font-semibold tabular-nums text-[var(--color-foreground)]">
            {displayedRating}/5
          </span>
        )}
      </div>

      {/* Expanded form — only mounts once the user has picked a rating so
          the section stays compact for skimmers. */}
      {rating !== null && (
        <div className="mt-5 flex flex-col gap-4 motion-safe:motion-hero-reveal">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
              Tu experiencia
            </span>
            <textarea
              name="body"
              required
              minLength={REVIEW_LIMITS.bodyMin}
              maxLength={REVIEW_LIMITS.bodyMax}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`Cuéntanos cómo fue tu encuentro con ${listingName}. Mínimo ${REVIEW_LIMITS.bodyMin} caracteres.`}
              rows={4}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-sm leading-relaxed text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
            />
            <span className="self-end text-[10px] tabular-nums text-[var(--color-text-subtle)]">
              {body.length} / {REVIEW_LIMITS.bodyMax}
            </span>
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                Ciudad del encuentro
              </span>
              <input
                name="city"
                required
                maxLength={REVIEW_LIMITS.cityMax}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Bogotá"
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                Alias (opcional)
              </span>
              <input
                name="alias"
                maxLength={REVIEW_LIMITS.aliasMax}
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Cliente verificado"
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
              />
            </label>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-[var(--radius-md)] border border-[var(--color-brand-highlight)]/40 bg-[var(--color-brand-highlight)]/10 px-3 py-2 text-xs text-[var(--color-brand-highlight)]"
            >
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={reset}
              disabled={isPending}
              className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-foreground)] disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn-pulse inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? "Publicando…" : "Publicar opinión"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
