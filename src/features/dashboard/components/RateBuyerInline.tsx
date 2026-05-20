"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Star } from "lucide-react";
import { useState, useTransition } from "react";

import { toast } from "@/shared/ui/toast";

import { submitBuyerReview } from "../actions/submit-buyer-review";

interface RateBuyerInlineProps {
  bookingId: string;
  /** Existing seller-side review (already submitted). When present the
   *  form collapses to a confirmation badge. */
  existingRating?: number;
  /** Notify parent when a review lands so the inbox can update
   *  optimistically. */
  onReviewed?: (rating: number) => void;
}

const COMMENT_MAX = 600;

/**
 * Compact 5-star rate-this-buyer affordance, surfaced only on
 * `completed` bookings in the seller inbox. Mirrors the public-side
 * `RateBiringaForm` vocabulary (hover preview, expanding comment box
 * after a star is picked) but stripped down for an inline slot.
 *
 * Renders a confirmation badge instead of the form when the seller
 * has already rated this booking — no double-submit.
 */
export function RateBuyerInline({
  bookingId,
  existingRating,
  onReviewed,
}: Readonly<RateBuyerInlineProps>) {
  const [rating, setRating] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState<number | null>(
    existingRating ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (submitted !== null) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-primary)]/40 bg-[var(--color-brand-primary)]/10 px-3 py-1.5 text-[11px] font-semibold text-[var(--color-brand-primary)]">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
        Calificado · {submitted}/5
      </div>
    );
  }

  const displayedRating = hover ?? rating ?? 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === null) {
      setError("Elige una calificación.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitBuyerReview({
        bookingId,
        rating,
        comment: comment.trim() || undefined,
      });
      if (result.ok) {
        toast.success("Cliente calificado");
        setSubmitted(rating);
        onReviewed?.(rating);
      } else {
        setError(
          result.error?.kind === "booking-disabled"
            ? "Las reseñas mutuas se activan cuando Firestore esté listo."
            : result.error?.message ??
                "No pudimos guardar la calificación. Intentá de nuevo.",
        );
      }
    });
  };

  return (
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background-elevated)] p-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
          Calificar al cliente
        </span>
        <div
          role="radiogroup"
          aria-label="Calificación de 1 a 5 estrellas"
          className="inline-flex items-center gap-0.5"
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
                onMouseEnter={() => setHover(value)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(value)}
                onBlur={() => setHover(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-150 ease-[var(--ease-standard)] hover:-translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
              >
                <Star
                  className={`h-5 w-5 transition-colors duration-150 ${
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
            <span className="ml-1 text-xs font-semibold tabular-nums text-[var(--color-foreground)]">
              {displayedRating}/5
            </span>
          )}
        </div>
      </div>

      {rating !== null && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-2"
        >
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={COMMENT_MAX}
            placeholder="Comentario privado (opcional). Lo lee sólo el equipo de moderación."
            rows={2}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs leading-relaxed text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
          />
          {error && (
            <p
              role="alert"
              className="text-[11px] text-[var(--color-brand-highlight)]"
            >
              {error}
            </p>
          )}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setRating(null);
                setHover(null);
                setComment("");
                setError(null);
              }}
              disabled={isPending}
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-foreground)] disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--color-brand-primary)] px-4 text-xs font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </motion.div>
      )}
    </motion.form>
  );
}
