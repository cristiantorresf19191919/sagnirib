import Link from "next/link";
import { ArrowLeft, FileText, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

import { brandConfig } from "@/core/branding/brand-config";
import { Container } from "@/shared/design-system/components/Container";

interface LegalShellProps {
  /** Section eyebrow rendered above the title (e.g. "Legal · Términos"). */
  eyebrow: string;
  /** H1 displayed at the top of the page. */
  title: string;
  /** Single-paragraph summary directly under the title. */
  summary: string;
  /** ISO date of last revision. Rendered in the metadata strip. */
  lastUpdated: string;
  /** Optional disclaimer banner — used to flag "draft / awaiting counsel
   *  review". Rendered above the article body. */
  disclaimer?: ReactNode;
  /** Article body — sections, headings, paragraphs. */
  children: ReactNode;
}

/**
 * Shared shell for legal pages (Términos, Privacidad, Aviso legal).
 *
 * Provides a consistent eyebrow + Fraunces display title + serif summary
 * + last-updated stamp + back-to-home anchor. The body uses native
 * heading semantics inside a max-width column tuned for long-form reading
 * (75 ch line length). Pages remain Server Components — no client
 * interactivity is needed here.
 */
export function LegalShell({
  eyebrow,
  title,
  summary,
  lastUpdated,
  disclaimer,
  children,
}: Readonly<LegalShellProps>) {
  return (
    <main className="bg-[var(--color-background)] pb-24 pt-10 sm:pt-16">
      <Container width="wide">
        <div className="mx-auto max-w-[760px]">
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand-primary)]"
          >
            <ArrowLeft
              className="h-3.5 w-3.5 transition-transform duration-200 ease-[var(--ease-standard)] group-hover:-translate-x-0.5"
              aria-hidden
            />
            Volver al inicio
          </Link>

          <header className="mt-8 flex flex-col gap-4">
            <span className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-brand-primary)]">
              <span
                aria-hidden
                className="inline-block h-px w-10 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-[var(--color-brand-primary)]/40"
              />
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--color-gold)] shadow-[0_0_0_3px_rgba(200,166,118,0.18)]"
              />
              {eyebrow}
            </span>
            <h1 className="font-[var(--font-display)] text-[clamp(32px,4.6vw,52px)] font-[360] leading-[1.04] tracking-[-0.03em] text-[var(--color-foreground)]">
              {title}
            </h1>
            <p className="max-w-2xl font-[var(--font-serif)] text-[15.5px] leading-[1.55] text-[var(--color-text-muted)]">
              {summary}
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-[var(--color-text-subtle)]">
              <span className="inline-flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" aria-hidden />
                Última actualización · {lastUpdated}
              </span>
              <span aria-hidden className="hidden h-3 w-px bg-[var(--color-border)] sm:inline-block" />
              <span className="inline-flex items-center gap-1.5">
                Documento aplicable a {brandConfig.legalName} ·{" "}
                <span className="font-medium text-[var(--color-text-muted)]">
                  Colombia
                </span>
              </span>
            </div>
          </header>

          {disclaimer && (
            <div
              role="note"
              className="mt-8 flex items-start gap-3 rounded-2xl border border-[var(--color-brand-warn)]/40 bg-[var(--color-brand-warn)]/8 p-4 text-[13.5px] leading-relaxed text-[var(--color-text-muted)] sm:p-5"
            >
              <ShieldAlert
                className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-brand-accent-strong)]"
                aria-hidden
              />
              <div>{disclaimer}</div>
            </div>
          )}

          <article className="prose-legal mt-10 flex flex-col gap-8 text-[15px] leading-[1.7] text-[var(--color-foreground)]">
            {children}
          </article>
        </div>
      </Container>
    </main>
  );
}

/** Section block — h2 + body. Pre-styled so pages stay declarative. */
export function LegalSection({
  id,
  title,
  children,
}: Readonly<{ id?: string; title: string; children: ReactNode }>) {
  return (
    <section
      id={id}
      className="flex flex-col gap-3 scroll-mt-24"
      aria-labelledby={id ? `${id}-h` : undefined}
    >
      <h2
        id={id ? `${id}-h` : undefined}
        className="font-[var(--font-display)] text-[22px] font-[440] leading-tight tracking-tight text-[var(--color-foreground)] sm:text-[26px]"
      >
        {title}
      </h2>
      <div className="flex flex-col gap-3 text-[15px] leading-[1.7] text-[var(--color-text-muted)]">
        {children}
      </div>
    </section>
  );
}

/** Lettered sub-clause (a), (b), (c) — for terms-style enumeration. */
export function LegalList({
  ordered = false,
  children,
}: Readonly<{ ordered?: boolean; children: ReactNode }>) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag
      className={`flex flex-col gap-2 pl-5 ${ordered ? "list-decimal" : "list-disc"} marker:text-[var(--color-brand-primary)]/60`}
    >
      {children}
    </Tag>
  );
}
