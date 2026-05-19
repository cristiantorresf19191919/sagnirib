import Image from "next/image";
import Link from "next/link";
import { Quote, ShieldCheck, Star } from "lucide-react";

import { listTestimonials } from "@/server/biringas";
import { Container } from "@/shared/design-system/components/Container";

const DATE_FORMAT = new Intl.DateTimeFormat("es-CO", {
  month: "short",
  year: "numeric",
});

/**
 * Testimonials section — curated marketing quotes from verified clients.
 *
 * Server Component. Data sourced via the `listTestimonials` barrel which
 * today returns mock data and will route to Firestore later without any
 * change to this component (same pattern as the rest of the catalog).
 *
 * Layout: editorial header on top, then a responsive 1 / 2 / 3 column
 * grid of quote cards. Each card links back to the referenced listing
 * so social proof becomes a discovery path.
 *
 * Degrades to render nothing when the testimonials list is empty —
 * keeps the home page clean if the curation list is ever wiped.
 */
export async function TestimonialsSection() {
  const testimonials = await listTestimonials(6).catch(() => []);
  if (testimonials.length === 0) return null;

  return (
    <section
      data-testid="testimonials"
      aria-labelledby="testimonials-title"
      className="relative isolate overflow-hidden border-y border-[var(--color-border)]/60 bg-[var(--color-background)] py-20 sm:py-24 lg:py-28"
    >
      {/* Soft top gold hairline — same vocabulary as HowItWorks. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)]/40 to-transparent"
      />

      {/* Aurora wash so the section reads as a distinct moment without
          a hard background-color flip. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 motion-safe:motion-aurora opacity-60"
        style={{
          background:
            "radial-gradient(45% 60% at 82% 22%, rgba(200,166,118,0.14), transparent 70%), radial-gradient(50% 55% at 14% 78%, rgba(47,93,67,0.10), transparent 70%)",
        }}
      />

      <Container width="wide">
        <header className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-3 rounded-full bg-[var(--color-surface)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)]">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--color-gold)] shadow-[0_0_0_3px_rgba(200,166,118,0.18)]"
            />
            Lo que dicen los clientes
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--color-brand-primary)]/70"
            />
          </span>

          <h2
            id="testimonials-title"
            className="mt-5 font-[var(--font-display)] text-[clamp(28px,3.6vw,46px)] font-[370] leading-[1.04] tracking-[-0.025em] text-[var(--color-foreground)]"
          >
            Historias reales de quienes ya{" "}
            <span className="italic font-[340] text-[var(--color-brand-primary)]">
              eligieron Biringas
            </span>
            .
          </h2>

          <p className="mx-auto mt-5 max-w-xl font-[var(--font-serif)] text-[16px] leading-[1.55] text-[var(--color-text-muted)]">
            Reseñas verificadas, sin filtros de marketing. Cada cita lleva
            al perfil al que se refiere — así puedes contrastar antes de
            reservar.
          </p>
        </header>

        <ul
          aria-label="Testimonios de clientes verificados"
          className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
        >
          {testimonials.map((t) => {
            const dateLabel = DATE_FORMAT.format(new Date(t.date));
            return (
              <li
                key={t.id}
                data-testid={`testimonial-${t.id}`}
                className="group relative flex flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,transform] duration-300 ease-[var(--ease-standard)] hover:-translate-y-[2px] hover:border-[var(--color-brand-primary-soft)] hover:shadow-[var(--shadow-md)]"
              >
                {/* Big decorative quote mark — pulls the eye into the
                    card body without competing with the actual quote. */}
                <Quote
                  className="absolute -right-2 -top-2 h-20 w-20 text-[var(--color-brand-primary)]/8 transition-colors duration-300 group-hover:text-[var(--color-brand-primary)]/12"
                  aria-hidden
                />

                <Stars value={t.rating} />

                <blockquote className="relative mt-4 flex-1 font-[var(--font-serif)] text-[15.5px] leading-[1.55] text-[var(--color-foreground)]">
                  <p>“{t.quote}”</p>
                </blockquote>

                <div className="mt-5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--color-foreground)]">
                      {t.alias}
                    </p>
                    <p className="mt-0.5 inline-flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--color-text-subtle)]">
                      <span>{t.city}</span>
                      <span aria-hidden>·</span>
                      <span>{dateLabel}</span>
                      {t.verified && (
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
                </div>

                {/* Listing reference — links the quote to the profile it
                    speaks about so testimonial → discovery is a single
                    click. The whole row acts as a hover surface. */}
                <Link
                  href={`/p/${t.listing.slug}`}
                  data-testid={`testimonial-${t.id}-listing-link`}
                  className="mt-5 -mx-2 inline-flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)]/70 bg-[var(--color-background-elevated)] p-2 pr-3 transition-[border-color,background] duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-surface)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
                >
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-[var(--color-border)]">
                    <Image
                      src={t.listing.image}
                      alt=""
                      aria-hidden
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                      Sobre
                    </span>
                    <span className="truncate text-sm font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-brand-primary)]">
                      {t.listing.name}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-10 flex items-center justify-center">
          <Link
            href="/explorar"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-sm font-semibold text-[var(--color-foreground)] transition-[border-color,background,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          >
            Ver más historias en el catálogo
          </Link>
        </div>
      </Container>
    </section>
  );
}

interface StarsProps {
  value: number;
}

/**
 * Read-only star row mirroring the styling used in `ReviewsSection` so
 * the visual language across the rating UI is consistent.
 */
function Stars({ value }: Readonly<StarsProps>) {
  const filled = Math.round(value);
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`Calificación ${value} de 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
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
