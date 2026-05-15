"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useAuthSession } from "../lib/use-auth-session";

/**
 * Minimal sign-in form. Email/password + Google.
 *
 * Copy is INTENTIONALLY placeholder — the Brand Handshake will replace
 * every visible string. Do not invent voice/tone here. Search for
 * `BRAND_HANDSHAKE_TODO` to find every spot a writer needs to revisit.
 */

interface FieldErrors {
  email?: string;
  password?: string;
  form?: string;
}

export function SignInForm() {
  const router = useRouter();
  const { status, signInWithEmail, signInWithGoogle } = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await signInWithEmail(email, password);
      router.push("/");
      router.refresh();
    } catch (err) {
      setErrors({ form: humanizeAuthError(err) });
    } finally {
      setSubmitting(false);
    }
  }

  async function onGoogle() {
    setErrors({});
    setSubmitting(true);
    try {
      await signInWithGoogle();
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
          htmlFor="auth-email"
          className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]"
        >
          {/* BRAND_HANDSHAKE_TODO: email field label */}
          Email
        </label>
        <input
          id="auth-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="auth-password"
          className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]"
        >
          {/* BRAND_HANDSHAKE_TODO: password field label */}
          Contraseña
        </label>
        <input
          id="auth-password"
          type="password"
          autoComplete="current-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
        />
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
        {/* BRAND_HANDSHAKE_TODO: submit CTA copy */}
        {submitting ? "Entrando…" : "Iniciar sesión"}
      </button>

      <div
        role="separator"
        aria-orientation="horizontal"
        className="my-1 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]"
      >
        <span className="h-px flex-1 bg-[var(--color-border)]" aria-hidden />
        {/* BRAND_HANDSHAKE_TODO: separator label */}
        <span>o</span>
        <span className="h-px flex-1 bg-[var(--color-border)]" aria-hidden />
      </div>

      <button
        type="button"
        onClick={onGoogle}
        disabled={submitting}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-sm font-medium text-[var(--color-foreground)] transition-[border-color,background] duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)] disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        {/* BRAND_HANDSHAKE_TODO: Google CTA copy */}
        Continuar con Google
      </button>
    </form>
  );
}

function humanizeAuthError(err: unknown): string {
  // Firebase Auth surface common codes; a brand writer can flesh this out.
  const code =
    typeof (err as { code?: unknown } | undefined)?.code === "string"
      ? (err as { code: string }).code
      : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      // BRAND_HANDSHAKE_TODO
      return "Credenciales inválidas.";
    case "auth/too-many-requests":
      // BRAND_HANDSHAKE_TODO
      return "Demasiados intentos. Esperá unos minutos.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      // BRAND_HANDSHAKE_TODO
      return "Cancelaste el inicio de sesión.";
    default:
      // BRAND_HANDSHAKE_TODO: generic fallback
      return (err as Error)?.message ?? "Error desconocido.";
  }
}
