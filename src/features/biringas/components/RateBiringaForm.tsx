"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition, useState } from "react";
import { CheckCircle2, LogIn, MessageSquare, Star } from "lucide-react";

import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";
import { useAuthSession } from "@/features/auth/lib/use-auth-session";
import {
  ACCOUNT_TYPE_COMMENTATOR,
  ACCOUNT_TYPE_PUBLISHER,
  type AccountType,
} from "@/features/auth/lib/rbac";

import { submitReview } from "../actions/submit-review";

const REVIEW_LIMITS = {
  bodyMin: 20,
  bodyMax: 2000,
  cityMax: 80,
  aliasMax: 40,
} as const;

interface RateBiringaFormProps {
  listingSlug: string;
  listingName: string;
  /**
   * Account type picked at registration (read from the `biringas:account-type`
   * cookie by the parent Server Component). Drives the role-aware messaging
   * required by the PDF RBAC matrix:
   *
   *   - `commentator` → ideal author, the form encourages them
   *   - `publisher`   → can comment per UX, but we surface a hint that
   *                      reviewing their own listings is gated by Cloud
   *                      Functions / Security Rules (PDF page 6)
   *   - `null`        → unknown; treat as commentator-eligible
   */
  accountType?: AccountType | null;
}

export function RateBiringaForm({
  listingSlug,
  listingName,
  accountType,
}: Readonly<RateBiringaFormProps>) {
  const locale = useActiveLocale();
  const { status } = useAuthSession();
  const pathname = usePathname();
  const ingresarBase = localizedHref(locale, "/ingresar");
  const ingresarHref = pathname
    ? `${ingresarBase}?next=${encodeURIComponent(pathname)}`
    : ingresarBase;
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const [city, setCity] = useState("");
  const [alias, setAlias] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successRating, setSuccessRating] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

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
      setError(t(locale, "rate.error.noRating"));
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
        setError(result.error?.message ?? t(locale, "rate.error.submit"));
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
              {t(locale, "rate.success.title")}
            </h3>
            <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
              {t(locale, "rate.success.body.lead", { name: listingName })}{" "}
              <span className="inline-flex items-center gap-0.5 align-[-2px]">
                {Array.from({ length: successRating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-3.5 w-3.5 fill-[var(--color-brand-warn)] text-[var(--color-brand-warn)]"
                    aria-hidden
                  />
                ))}
              </span>
              {t(locale, "rate.success.body.trailing")}
            </p>
            <button
              type="button"
              onClick={() => setSuccessRating(null)}
              className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-foreground)] transition-colors hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)]"
            >
              {t(locale, "rate.success.another")}
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
                {t(locale, "rate.anonymous.title", { name: listingName })}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {t(locale, "rate.anonymous.body")}
              </p>
            </div>
            <Link
              href={ingresarHref}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              {t(locale, "rate.anonymous.cta")}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (status === "loading" || status === "disabled") {
    return null;
  }

  const roleBadge =
    accountType === ACCOUNT_TYPE_COMMENTATOR
      ? {
          tone: "primary" as const,
          icon: <MessageSquare className="h-3 w-3" aria-hidden />,
          label: t(locale, "rbac.commentator.eyebrow"),
        }
      : accountType === ACCOUNT_TYPE_PUBLISHER
        ? {
            tone: "muted" as const,
            icon: <MessageSquare className="h-3 w-3" aria-hidden />,
            label: t(locale, "rbac.publisher.kicker"),
          }
        : null;

  return (
    <form
      data-testid="rate-biringa-form"
      onSubmit={onSubmit}
      className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-6 backdrop-blur-sm"
    >
      {roleBadge ? (
        <span
          data-testid="rate-biringa-role-badge"
          className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ring-1 ${
            roleBadge.tone === "primary"
              ? "bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary)] ring-[var(--color-brand-primary)]/25"
              : "bg-[var(--color-background-elevated)] text-[var(--color-text-muted)] ring-[var(--color-border)]"
          }`}
        >
          {roleBadge.icon}
          {roleBadge.label}
        </span>
      ) : null}
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-[var(--color-foreground)]">
          {t(locale, "rate.form.title", { name: listingName })}
        </h3>
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          {t(locale, "rate.form.subtitle")}
        </p>
      </div>

      <div
        className="mt-4 flex items-center gap-1"
        role="radiogroup"
        aria-label={t(locale, "rate.stars.aria")}
      >
        {[1, 2, 3, 4, 5].map((value) => {
          const filled = value <= displayedRating;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={t(
                locale,
                value === 1 ? "rate.stars.singular" : "rate.stars.plural",
                { n: value },
              )}
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

      {rating !== null && (
        <div className="mt-5 flex flex-col gap-4 motion-safe:motion-hero-reveal">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
              {t(locale, "rate.field.experience")}
            </span>
            <textarea
              name="body"
              required
              minLength={REVIEW_LIMITS.bodyMin}
              maxLength={REVIEW_LIMITS.bodyMax}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t(locale, "rate.field.experience.placeholder", {
                name: listingName,
                min: REVIEW_LIMITS.bodyMin,
              })}
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
                {t(locale, "rate.field.city")}
              </span>
              <input
                name="city"
                required
                maxLength={REVIEW_LIMITS.cityMax}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t(locale, "rate.field.city.placeholder")}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                {t(locale, "rate.field.alias")}
              </span>
              <input
                name="alias"
                maxLength={REVIEW_LIMITS.aliasMax}
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder={t(locale, "rate.field.alias.placeholder")}
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
              {t(locale, "rate.cancel")}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn-pulse inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? t(locale, "rate.submitting") : t(locale, "rate.submit")}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
