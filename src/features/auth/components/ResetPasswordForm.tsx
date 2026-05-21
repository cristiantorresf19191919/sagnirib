"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { t } from "@/core/i18n/messages";
import {
  useActiveLocale,
  useLocalizedHref,
} from "@/core/i18n/use-active-locale";

import { useAuthSession } from "../lib/use-auth-session";

/**
 * Password reset form. Always shows the same success message regardless of
 * whether the email exists — avoids account enumeration.
 *
 * The actual reset email and the recovery URL are hosted by Firebase Auth
 * (default sender). When we are ready to brand them, configure the Firebase
 * console email templates and / or a custom action handler URL.
 */

interface FieldErrors {
  email?: string;
  form?: string;
}

export function ResetPasswordForm() {
  const locale = useActiveLocale();
  const ingresarHref = useLocalizedHref("/ingresar");
  const { status, sendPasswordReset } = useAuthSession();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  if (status === "disabled") {
    return (
      <p
        role="status"
        className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-muted)]"
      >
        {t(locale, "auth.disabled.reset.body")}
      </p>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    if (!email.trim()) {
      setErrors({ email: t(locale, "auth.reset.validation.email") });
      return;
    }
    setSubmitting(true);
    try {
      await sendPasswordReset(email);
    } catch (err) {
      const code =
        typeof (err as { code?: unknown } | undefined)?.code === "string"
          ? (err as { code: string }).code
          : "";
      if (code === "auth/invalid-email") {
        setErrors({
          email: t(locale, "auth.reset.validation.invalidEmail"),
        });
        setSubmitting(false);
        return;
      }
      console.warn("[auth] password reset failed silently", err);
    } finally {
      setSubmitting(false);
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <p
          role="status"
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-foreground)]"
        >
          {/* Strong-tagged email needs split rendering so the strong remains an
              HTML element rather than baked into the translated string. */}
          <SuccessText email={email} locale={locale} />
        </p>
        <Link
          href={ingresarHref}
          className="text-center text-sm font-semibold text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary-strong)]"
        >
          {t(locale, "auth.reset.backToSignin")}
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full max-w-sm flex-col gap-4"
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="reset-email"
          className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]"
        >
          {t(locale, "auth.reset.field.email")}
        </label>
        <input
          id="reset-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(errors.email)}
          className="h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
        />
        {errors.email ? (
          <p className="text-xs text-[var(--color-danger,#dc2626)]">
            {errors.email}
          </p>
        ) : null}
      </div>

      {errors.form ? (
        <p
          role="alert"
          className="rounded-md border border-[var(--color-danger,#dc2626)] bg-[var(--color-danger-soft,rgba(220,38,38,0.08))] px-3 py-2 text-sm text-[var(--color-danger,#dc2626)]"
        >
          {errors.form}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,opacity] duration-200 ease-[var(--ease-standard)] hover:bg-[var(--color-brand-primary-strong)] disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        {submitting
          ? t(locale, "auth.reset.submitting")
          : t(locale, "auth.reset.submit")}
      </button>

      <p className="text-center text-xs text-[var(--color-text-muted)]">
        {t(locale, "auth.reset.recovered")}{" "}
        <Link
          href={ingresarHref}
          className="font-semibold text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary-strong)]"
        >
          {t(locale, "auth.reset.signIn")}
        </Link>
      </p>
    </form>
  );
}

/**
 * The success blurb embeds the user's email inside a `<strong>` tag.
 * Split rendering keeps the HTML semantic while still pulling copy from
 * the translation file via `{email}` interpolation.
 */
function SuccessText({
  email,
  locale,
}: {
  email: string;
  locale: import("@/core/branding/brand-config").SupportedLocale;
}) {
  const raw = t(locale, "auth.reset.success", { email: "__EMAIL__" });
  const [before, after] = raw.split("__EMAIL__");
  return (
    <>
      {before}
      <strong>{email}</strong>
      {after}
    </>
  );
}
