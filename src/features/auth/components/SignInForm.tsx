"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
  Mail,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";
import { toast } from "@/shared/ui/toast";

import { useAuthSession } from "../lib/use-auth-session";

interface FieldErrors {
  email?: string;
  password?: string;
  form?: string;
}

interface SignInFormProps {
  /** Path to redirect to after success. Defaults to `/`. Validated to
   *  start with `/` (relative) so the redirect cannot be hijacked into
   *  an open-redirect attack. */
  next?: string;
}

const REVEAL: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

const STAGGER: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
};

/**
 * Editorial sign-in form.
 *
 * Auth wiring is the existing `useAuthSession` hook — email/password
 * via Firebase Auth Web SDK + Google popup. On success the form
 * redirects to `next` (sanitized) or `/` and refreshes so any RSC
 * surface that reads the session cookie re-renders.
 */
export function SignInForm({ next }: Readonly<SignInFormProps> = {}) {
  const router = useRouter();
  const locale = useActiveLocale();
  const { status, signInWithEmail, signInWithGoogle } = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//")
      ? next
      : localizedHref(locale, "/");

  if (status === "disabled") {
    return <DisabledNotice locale={locale} />;
  }
  if (status === "authenticated") {
    return <AlreadySignedIn next={safeNext} locale={locale} />;
  }

  function finishSuccess(method: "email" | "google") {
    toast.success(
      t(locale, "auth.signin.toast.title"),
      method === "google"
        ? t(locale, "auth.signin.toast.google")
        : t(locale, "auth.signin.toast.email"),
    );
    router.push(safeNext);
    router.refresh();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await signInWithEmail(email, password);
      finishSuccess("email");
    } catch (err) {
      setErrors({ form: humanizeAuthError(err, locale) });
    } finally {
      setSubmitting(false);
    }
  }

  async function onGoogle() {
    setErrors({});
    setSubmitting(true);
    try {
      await signInWithGoogle();
      finishSuccess("google");
    } catch (err) {
      setErrors({ form: humanizeAuthError(err, locale) });
    } finally {
      setSubmitting(false);
    }
  }

  const registrarseHref = localizedHref(locale, "/registrarse");
  const recuperarHref = localizedHref(locale, "/recuperar");

  return (
    <motion.form
      onSubmit={onSubmit}
      noValidate
      variants={STAGGER}
      initial="hidden"
      animate="visible"
      className="relative flex w-full max-w-md flex-col gap-5 overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-lg)] sm:p-8"
    >
      {/* Top gold hairline — editorial signature */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)]/55 to-transparent"
      />

      <motion.div variants={REVEAL} className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-gold-deep)]">
            <Sparkles className="h-3 w-3" aria-hidden />
            {t(locale, "auth.signin.kicker.card")}
          </span>
          <h2 className="mt-1 font-[var(--font-display)] text-2xl font-[370] tracking-tight text-[var(--color-foreground)]">
            {t(locale, "auth.signin.card.title")}
          </h2>
        </div>
      </motion.div>

      <motion.div variants={REVEAL} className="flex flex-col gap-1.5">
        <label
          htmlFor="auth-email"
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]"
        >
          {t(locale, "auth.signin.field.email")}
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-subtle)]"
            aria-hidden
          />
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t(locale, "auth.signin.field.email.placeholder")}
            className="h-12 w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] pl-10 pr-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
          />
        </div>
      </motion.div>

      <motion.div variants={REVEAL} className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor="auth-password"
            className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]"
          >
            {t(locale, "auth.signin.field.password")}
          </label>
          <Link
            href={recuperarHref}
            className="text-[11px] font-semibold text-[var(--color-brand-primary)] underline-offset-2 hover:underline"
          >
            {t(locale, "auth.signin.forgot")}
          </Link>
        </div>
        <div className="relative">
          <input
            id="auth-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t(locale, "auth.signin.field.password.placeholder")}
            className="h-12 w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] pl-3.5 pr-12 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={
              showPassword
                ? t(locale, "auth.signin.field.password.hide")
                : t(locale, "auth.signin.field.password.show")
            }
            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
      </motion.div>

      {errors.form && (
        <motion.p
          variants={REVEAL}
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-brand-highlight)]/40 bg-[var(--color-brand-highlight)]/10 px-3 py-2 text-xs text-[var(--color-brand-highlight)]"
        >
          {errors.form}
        </motion.p>
      )}

      <motion.button
        variants={REVEAL}
        type="submit"
        disabled={submitting}
        className="btn-pulse inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <LogIn className="h-4 w-4" aria-hidden />
        {submitting
          ? t(locale, "auth.signin.submitting")
          : t(locale, "auth.signin.submit")}
      </motion.button>

      <motion.div
        variants={REVEAL}
        role="separator"
        aria-orientation="horizontal"
        className="flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-subtle)]"
      >
        <span className="h-px flex-1 bg-[var(--color-border)]" aria-hidden />
        <span>{t(locale, "auth.signin.divider")}</span>
        <span className="h-px flex-1 bg-[var(--color-border)]" aria-hidden />
      </motion.div>

      <motion.button
        variants={REVEAL}
        type="button"
        onClick={onGoogle}
        disabled={submitting}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-sm font-semibold text-[var(--color-foreground)] transition-[border-color,background,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <GoogleGlyph />
        {t(locale, "auth.signin.google")}
      </motion.button>

      <motion.div
        variants={REVEAL}
        className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-background-elevated)] px-3 py-2 text-[11px] text-[var(--color-text-muted)]"
      >
        <ShieldCheck
          className="h-3.5 w-3.5 text-[var(--color-brand-primary)]"
          aria-hidden
        />
        {t(locale, "auth.signin.trustLine")}
      </motion.div>

      <motion.p
        variants={REVEAL}
        className="text-center text-xs text-[var(--color-text-muted)]"
      >
        {t(locale, "auth.signin.noAccount")}{" "}
        <Link
          href={
            safeNext === localizedHref(locale, "/")
              ? registrarseHref
              : `${registrarseHref}?next=${encodeURIComponent(safeNext)}`
          }
          className="font-semibold text-[var(--color-brand-primary)] underline-offset-2 hover:underline"
        >
          {t(locale, "auth.signin.createAccount")}
        </Link>
      </motion.p>
    </motion.form>
  );
}

function DisabledNotice({ locale }: { locale: SupportedLocale }) {
  return (
    <div
      role="status"
      className="flex w-full max-w-md flex-col gap-2 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-text-muted)] shadow-[var(--shadow-sm)]"
    >
      <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-highlight)]">
        <ShieldCheck className="h-3 w-3" aria-hidden />
        {t(locale, "auth.disabled.kicker")}
      </span>
      <p>{t(locale, "auth.disabled.signin.body")}</p>
    </div>
  );
}

/**
 * Rendered when the JS-SDK already has a user but the visitor landed on
 * `/ingresar` anyway — typically because the gated route did
 * `redirect("/ingresar?next=…")` after `getSession()` came back null.
 */
function AlreadySignedIn({
  next,
  locale,
}: {
  next: string;
  locale: SupportedLocale;
}) {
  const router = useRouter();
  const { serverSession, refreshServerSession, signOut } = useAuthSession();
  const [busy, setBusy] = useState<"continue" | "signout" | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const errorMessage =
    localError ??
    (serverSession.status === "failed" ? serverSession.error : null);

  async function onContinue() {
    setBusy("continue");
    setLocalError(null);
    try {
      const result = await refreshServerSession();
      if (result.status !== "ok") {
        setLocalError(
          result.error ?? t(locale, "auth.alreadySignedIn.error.fallback"),
        );
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function onSignOutAndRetry() {
    setBusy("signout");
    try {
      await signOut();
      router.refresh();
    } catch (err) {
      console.error("[auth] signOut failed", err);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-text-muted)] shadow-[var(--shadow-sm)]">
      <p>{t(locale, "auth.alreadySignedIn.lead")}</p>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-brand-highlight)]/40 bg-[var(--color-brand-highlight)]/10 px-3 py-2 text-xs text-[var(--color-brand-highlight)]"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="flex flex-col gap-1">
            <span className="font-semibold">
              {t(locale, "auth.alreadySignedIn.error.title")}
            </span>
            <span className="text-[var(--color-text-muted)]">
              {t(locale, "auth.alreadySignedIn.error.advice")}
            </span>
            <span className="font-mono text-[10px] text-[var(--color-text-subtle)]">
              {errorMessage}
            </span>
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onContinue}
          disabled={busy !== null}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {errorMessage ? (
            <RefreshCcw className="h-4 w-4" aria-hidden />
          ) : null}
          {busy === "continue"
            ? t(locale, "auth.alreadySignedIn.verifying")
            : errorMessage
              ? t(locale, "auth.alreadySignedIn.retry")
              : t(locale, "auth.alreadySignedIn.continue")}
        </button>

        {errorMessage && (
          <button
            type="button"
            onClick={onSignOutAndRetry}
            disabled={busy !== null}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-foreground)] transition-[border-color,background] duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {busy === "signout"
              ? t(locale, "auth.alreadySignedIn.signingOut")
              : t(locale, "auth.alreadySignedIn.signOut")}
          </button>
        )}
      </div>
    </div>
  );
}

function GoogleGlyph() {
  // Pure SVG, no SDK import — matches Google brand colors.
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 18 18"
      aria-hidden
      focusable="false"
    >
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.614z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

function humanizeAuthError(err: unknown, locale: SupportedLocale): string {
  const code =
    typeof (err as { code?: unknown } | undefined)?.code === "string"
      ? (err as { code: string }).code
      : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return t(locale, "auth.error.invalidCredentials");
    case "auth/too-many-requests":
      return t(locale, "auth.error.tooManyRequests");
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return t(locale, "auth.error.popupClosed");
    case "auth/network-request-failed":
      return t(locale, "auth.error.network");
    default:
      return (err as Error)?.message ?? t(locale, "auth.error.unknown");
  }
}
