"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuthSession } from "../lib/use-auth-session";

/**
 * Sign-up form. Email + password + confirm + accept-terms checkbox.
 *
 * On success: Firebase user is created, the session cookie is exchanged
 * via `signUpWithIdToken` (audited as `auth.signup`), a verification
 * email is dispatched best-effort, and the user lands on `/`.
 *
 * Copy is BRAND_HANDSHAKE_TODO across the form.
 */

interface FieldErrors {
  email?: string;
  password?: string;
  confirm?: string;
  terms?: string;
  form?: string;
}

const MIN_PASSWORD_LENGTH = 8;

export function SignUpForm() {
  const router = useRouter();
  const { status, signUpWithEmail } = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  if (status === "disabled") {
    return (
      <p
        role="status"
        className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-muted)]"
      >
        {/* BRAND_HANDSHAKE_TODO: error copy for missing Firebase config */}
        Auth no está disponible — falta configurar Firebase.
      </p>
    );
  }

  if (status === "authenticated") {
    return (
      <p
        role="status"
        className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-muted)]"
      >
        {/* BRAND_HANDSHAKE_TODO: already-signed-in copy */}
        Ya tenés sesión iniciada.
      </p>
    );
  }

  function validate(): FieldErrors | null {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = "Ingresá tu email.";
    if (password.length < MIN_PASSWORD_LENGTH) {
      next.password = `Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`;
    }
    if (confirm !== password) next.confirm = "Las contraseñas no coinciden.";
    if (!acceptTerms) {
      next.terms = "Confirmá que aceptás los Términos y la Privacidad.";
    }
    return Object.keys(next).length > 0 ? next : null;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    const invalid = validate();
    if (invalid) {
      setErrors(invalid);
      return;
    }
    setSubmitting(true);
    try {
      await signUpWithEmail(email, password);
      router.push("/");
      router.refresh();
    } catch (err) {
      setErrors({ form: humanizeAuthError(err) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full max-w-sm flex-col gap-4"
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="signup-email"
          className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]"
        >
          {/* BRAND_HANDSHAKE_TODO: email field label */}
          Email
        </label>
        <input
          id="signup-email"
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

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="signup-password"
          className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]"
        >
          {/* BRAND_HANDSHAKE_TODO: password field label */}
          Contraseña
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(errors.password)}
          aria-describedby="signup-password-hint"
          className="h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
        />
        <p
          id="signup-password-hint"
          className="text-xs text-[var(--color-text-subtle)]"
        >
          Al menos {MIN_PASSWORD_LENGTH} caracteres. Usá una contraseña que no
          uses en otros sitios.
        </p>
        {errors.password ? (
          <p className="text-xs text-[var(--color-danger,#dc2626)]">
            {errors.password}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="signup-confirm"
          className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]"
        >
          {/* BRAND_HANDSHAKE_TODO: confirm field label */}
          Confirmar contraseña
        </label>
        <input
          id="signup-confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          aria-invalid={Boolean(errors.confirm)}
          className="h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
        />
        {errors.confirm ? (
          <p className="text-xs text-[var(--color-danger,#dc2626)]">
            {errors.confirm}
          </p>
        ) : null}
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-[var(--color-foreground)]">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2 border-[var(--color-border)] bg-[var(--color-surface)] transition-colors peer-checked:border-[var(--color-brand-primary)] peer-checked:bg-[var(--color-brand-primary)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-brand-primary)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--color-background)]"
        >
          {acceptTerms ? (
            <svg
              viewBox="0 0 12 12"
              className="h-3 w-3 text-[var(--color-surface)]"
              aria-hidden
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2.5 6.5l2.5 2.5 4.5-5" />
            </svg>
          ) : null}
        </span>
        <span>
          {/* BRAND_HANDSHAKE_TODO: terms acceptance copy */}
          Confirmo que soy mayor de 18 años y acepto los Términos y la Política
          de Privacidad.
        </span>
      </label>
      {errors.terms ? (
        <p className="-mt-2 text-xs text-[var(--color-danger,#dc2626)]">
          {errors.terms}
        </p>
      ) : null}

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
        {/* BRAND_HANDSHAKE_TODO: submit CTA copy */}
        {submitting ? "Creando cuenta…" : "Crear cuenta"}
      </button>

      <p className="text-center text-xs text-[var(--color-text-muted)]">
        {/* BRAND_HANDSHAKE_TODO */}
        ¿Ya tenés cuenta?{" "}
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

function humanizeAuthError(err: unknown): string {
  const code =
    typeof (err as { code?: unknown } | undefined)?.code === "string"
      ? (err as { code: string }).code
      : "";
  switch (code) {
    case "auth/email-already-in-use":
      // BRAND_HANDSHAKE_TODO
      return "Ya existe una cuenta con ese email.";
    case "auth/invalid-email":
      // BRAND_HANDSHAKE_TODO
      return "El email no parece válido.";
    case "auth/weak-password":
      // BRAND_HANDSHAKE_TODO
      return "La contraseña es demasiado débil.";
    case "auth/too-many-requests":
      // BRAND_HANDSHAKE_TODO
      return "Demasiados intentos. Esperá unos minutos.";
    default:
      // BRAND_HANDSHAKE_TODO: generic fallback
      return (err as Error)?.message ?? "Error desconocido.";
  }
}
