"use client";

import { useRouter } from "next/navigation";
import { Plus, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { t } from "@/core/i18n/messages";
import { createPersonAction } from "@/features/persons/actions/create-person";
import { PERSON_LIMITS } from "@/shared/persons/limits";

interface CreatePersonCardProps {
  locale: SupportedLocale;
}

/**
 * Inline "Crear nueva modelo" affordance on the partner dashboard
 * (ADR-018). Two states:
 *
 *   - Collapsed: a single "+ Crear nueva modelo" pill button.
 *   - Expanded:  a tiny form (displayName input + submit) so the user
 *                does not navigate away from the dashboard.
 *
 * On submit, the server action mints a new person and we
 * `router.refresh()` so the new KYC card appears in the list above.
 * Errors render inline; the API surface is intentionally narrow (the
 * user can add a name, that is it).
 */
export function CreatePersonCard({
  locale,
}: Readonly<CreatePersonCardProps>) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await createPersonAction({ displayName });
      if (!result.ok) {
        setError(
          result.error?.message ??
            t(locale, "miCuenta.persons.create.error.fallback"),
        );
        return;
      }
      setDisplayName("");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(
        (err as Error)?.message ??
          t(locale, "miCuenta.persons.create.error.fallback"),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex items-center justify-center gap-2 self-start rounded-full border border-dashed border-[var(--color-border)] bg-[var(--color-background-elevated)] px-4 py-2 text-xs font-semibold text-[var(--color-foreground)] transition-[border-color,background,color] duration-200 hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-brand-primary)]/8 hover:text-[var(--color-brand-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
        {t(locale, "miCuenta.persons.create.cta")}
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]"
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
        <UserPlus className="h-3.5 w-3.5" aria-hidden />
        {t(locale, "miCuenta.persons.create.title")}
      </div>
      <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
        {t(locale, "miCuenta.persons.create.help")}
      </p>
      <label
        htmlFor="create-person-name"
        className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]"
      >
        {t(locale, "miCuenta.persons.create.nameLabel")}
      </label>
      <input
        id="create-person-name"
        type="text"
        required
        minLength={PERSON_LIMITS.displayNameMin}
        maxLength={PERSON_LIMITS.displayNameMax}
        autoComplete="off"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder={t(locale, "miCuenta.persons.create.namePlaceholder")}
        className="h-11 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
      />
      {error ? (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-brand-highlight)]/40 bg-[var(--color-brand-highlight)]/10 px-3 py-2 text-[11px] text-[var(--color-brand-highlight)]"
        >
          {error}
        </p>
      ) : null}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={
            submitting ||
            displayName.trim().length < PERSON_LIMITS.displayNameMin
          }
          className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-4 text-xs font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting
            ? t(locale, "miCuenta.persons.create.submitting")
            : t(locale, "miCuenta.persons.create.submit")}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={submitting}
          className="inline-flex h-10 items-center rounded-full px-3 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {t(locale, "miCuenta.persons.create.cancel")}
        </button>
      </div>
    </form>
  );
}
