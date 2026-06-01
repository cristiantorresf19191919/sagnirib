import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { Container } from "@/shared/design-system/components/Container";

/**
 * Shared chrome for the example account screens (Configuración, Facturación).
 * Mirrors the dashboard's gradient backdrop + header pattern and stamps a
 * visible "Vista previa" badge + note so it's clear these surfaces are
 * scaffolds, not live features.
 */
export function AccountShell({
  locale,
  title,
  subtitle,
  children,
}: Readonly<{
  locale: SupportedLocale;
  title: string;
  subtitle: string;
  children: ReactNode;
}>) {
  return (
    <main className="relative isolate bg-[var(--color-background)] pb-20 pt-8 sm:pt-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_15%_5%,rgba(47,93,67,0.10),transparent_55%),radial-gradient(circle_at_85%_15%,rgba(229,162,58,0.10),transparent_55%)]"
      />
      <Container width="wide">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
          <header className="flex flex-col gap-3">
            <Link
              href={localizedHref(locale, "/mi-cuenta")}
              className="inline-flex w-fit items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-primary)] transition-colors hover:text-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              {t(locale, "account.back")}
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold leading-[1.05] tracking-tight text-[var(--color-foreground)] sm:text-4xl">
                {title}
              </h1>
              <span className="inline-flex items-center rounded-full border border-[var(--color-brand-accent)]/45 bg-[var(--color-brand-accent)]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-accent-strong)]">
                {t(locale, "account.preview.badge")}
              </span>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
              {subtitle}
            </p>
          </header>

          <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-background-elevated)] p-4 text-xs leading-relaxed text-[var(--color-text-muted)]">
            {t(locale, "account.preview.note")}
          </p>

          <div className="flex flex-col gap-5">{children}</div>
        </div>
      </Container>
    </main>
  );
}

export function AccountSectionCard({
  icon: Icon,
  title,
  children,
}: Readonly<{ icon: LucideIcon; title: string; children: ReactNode }>) {
  return (
    <section className="flex flex-col gap-1 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
      <header className="mb-2 flex items-center gap-2.5">
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
      <div className="flex flex-col divide-y divide-[var(--color-border)]">
        {children}
      </div>
    </section>
  );
}

export function SettingRow({
  icon: Icon,
  label,
  hint,
  value,
  action,
  control,
}: Readonly<{
  icon?: LucideIcon;
  label: string;
  hint?: string;
  value?: ReactNode;
  /** Example-only action — rendered as a static outline chip. */
  action?: string;
  control?: ReactNode;
}>) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <Icon
            className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-muted)]"
            aria-hidden
          />
        ) : null}
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-medium text-[var(--color-foreground)]">
            {label}
          </span>
          {hint ? (
            <span className="text-xs leading-relaxed text-[var(--color-text-muted)]">
              {hint}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {value ? (
          <span className="text-sm text-[var(--color-text-muted)]">{value}</span>
        ) : null}
        {control ?? null}
        {action ? (
          <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-foreground)] opacity-70">
            {action}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Static (non-interactive) toggle visual for the example screens. */
export function ExampleToggle({ on = false }: Readonly<{ on?: boolean }>) {
  return (
    <span
      aria-hidden
      className={`inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${
        on
          ? "justify-end bg-[var(--color-brand-primary)]"
          : "justify-start bg-[var(--color-surface-muted)] ring-1 ring-[var(--color-border)]"
      }`}
    >
      <span className="h-4 w-4 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)]" />
    </span>
  );
}
