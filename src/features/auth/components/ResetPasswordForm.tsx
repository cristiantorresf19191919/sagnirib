"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { useAuthSession } from "../lib/use-auth-session";

/**
 * Password reset form. Always shows the same success message regardless of
 * whether the email exists — avoids account enumeration.
 *
 * The actual reset email and the recovery URL are hosted by Firebase Auth
 * (default sender). When we are ready to brand them, configure the Firebase
 * console email templates and / or a custom action handler URL.
 *
 * Copy is BRAND_HANDSHAKE_TODO across the form.
 */

interface FieldErrors {
  email?: string;
  form?: string;
}

export function ResetPasswordForm() {
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
        {/* BRAND_HANDSHAKE_TODO */}
        Auth no está disponible — falta configurar Firebase.
      </p>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    if (!email.trim()) {
      setErrors({ email: "Ingresá tu email." });
      return;
    }
    setSubmitting(true);
    try {
      await sendPasswordReset(email);
    } catch (err) {
      // Swallow most errors to avoid enumeration. Only surface auth/invalid-email
      // because it is a UX validation, not an existence probe.
      const code =
        typeof (err as { code?: unknown } | undefined)?.code === "string"
          ? (err as { code: string }).code
          : "";
      if (code === "auth/invalid-email") {
        setErrors({ email: "El email no parece válido." });
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
          {/* BRAND_HANDSHAKE_TODO */}
          Si existe una cuenta para <strong>{email}</strong>, te enviamos un
          correo con las instrucciones para reestablecer tu contraseña. Revisá
          también tu carpeta de spam.
        </p>
        <Link
          href="/ingresar"
          className="text-center text-sm font-semibold text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary-strong)]"
        >
          Volver a iniciar sesión
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
          {/* BRAND_HANDSHAKE_TODO */}
          Email
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
        {/* BRAND_HANDSHAKE_TODO */}
        {submitting ? "Enviando…" : "Enviarme el correo"}
      </button>

      <p className="text-center text-xs text-[var(--color-text-muted)]">
        {/* BRAND_HANDSHAKE_TODO */}
        ¿Recuperaste el acceso?{" "}
        <Link
          href="/ingresar"
          className="font-semibold text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary-strong)]"
        >
          Ingresá
        </Link>
      </p>
    </form>
  );
}
