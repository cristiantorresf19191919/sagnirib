"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Globe,
  Info,
  Mail,
  MessageSquare,
  UserCircle2,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";
import { useAuthSession } from "@/features/auth/lib/use-auth-session";
import { toast } from "@/shared/ui/toast";

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

const COUNTRIES: ReadonlyArray<{ code: string; label: string }> = [
  { code: "CO", label: "Colombia" },
  { code: "AR", label: "Argentina" },
  { code: "MX", label: "México" },
  { code: "CL", label: "Chile" },
  { code: "PE", label: "Perú" },
  { code: "UY", label: "Uruguay" },
  { code: "ES", label: "España" },
  { code: "BR", label: "Brasil" },
];

const MIN_PASSWORD_LENGTH = 8;

interface FieldErrors {
  country?: string;
  email?: string;
  nickname?: string;
  password?: string;
  confirm?: string;
  terms?: string;
  form?: string;
}

/**
 * Flow B — comments-only registration form.
 *
 * Per the PDF this flow has reduced scope: country, email, nickname,
 * password, terms. No phone, no photos, no moderation. After successful
 * signup the user lands on the limited commentator panel where
 * publishing affordances are completely absent.
 *
 * Auth still goes through the same Firebase Web SDK helper as the
 * publisher flow — the `biringas:account-type` cookie set by the chooser
 * marks the user as a commentator until Cloud Functions mint the custom
 * claim in a follow-up PR.
 */
export function CommentatorSignUpForm() {
  const router = useRouter();
  const locale = useActiveLocale();
  const { status, signUpWithEmail, signInWithGoogle } = useAuthSession();
  const [country, setCountry] = useState<string>("CO");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function onGoogle() {
    setErrors({});
    setSubmitting(true);
    try {
      await signInWithGoogle();
      toast.success(
        t(locale, "rbac.commentator.successToast.title"),
        t(locale, "rbac.commentator.successToast.body"),
      );
      router.push(localizedHref(locale, "/mi-cuenta/comentarios"));
      router.refresh();
    } catch (err) {
      const code =
        typeof (err as { code?: unknown } | undefined)?.code === "string"
          ? (err as { code: string }).code
          : "";
      const msg =
        code === "auth/popup-closed-by-user"
          ? t(locale, "auth.error.popupClosed")
          : ((err as Error)?.message ?? t(locale, "auth.error.unknown"));
      setErrors({ form: msg });
    } finally {
      setSubmitting(false);
    }
  }

  function validate(): FieldErrors | null {
    const next: FieldErrors = {};
    if (!country) next.country = t(locale, "rbac.commentator.validation.country");
    if (!email.includes("@") || !email.includes("."))
      next.email = t(locale, "rbac.commentator.validation.email");
    if (nickname.trim().length < 3)
      next.nickname = t(locale, "rbac.commentator.validation.nickname");
    if (password.length < MIN_PASSWORD_LENGTH)
      next.password = t(locale, "rbac.commentator.validation.password");
    if (confirm !== password)
      next.confirm = t(locale, "rbac.commentator.validation.confirm");
    if (!acceptTerms) next.terms = t(locale, "rbac.commentator.validation.terms");
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
      if (status !== "disabled") {
        await signUpWithEmail(email, password);
      }
      toast.success(
        t(locale, "rbac.commentator.successToast.title"),
        t(locale, "rbac.commentator.successToast.body"),
      );
      router.push(localizedHref(locale, "/mi-cuenta/comentarios"));
      router.refresh();
    } catch (err) {
      const code =
        typeof (err as { code?: unknown } | undefined)?.code === "string"
          ? (err as { code: string }).code
          : "";
      const msg =
        code === "auth/email-already-in-use"
          ? t(locale, "auth.signup.error.emailInUse")
          : code === "auth/invalid-email"
            ? t(locale, "auth.signup.error.invalidEmail")
            : ((err as Error)?.message ?? t(locale, "auth.error.unknown"));
      setErrors({ form: msg });
    } finally {
      setSubmitting(false);
    }
  }

  const termsHref = localizedHref(locale, "/legal/terminos");
  const privacyHref = localizedHref(locale, "/legal/privacidad");
  const publisherHref = localizedHref(locale, "/registrarse/publicador");
  const signInHref = localizedHref(locale, "/ingresar");

  return (
    <motion.form
      onSubmit={onSubmit}
      noValidate
      variants={STAGGER}
      initial="hidden"
      animate="visible"
      className="relative flex w-full flex-col gap-5 overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-lg)] sm:p-8"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)]/55 to-transparent"
      />

      <motion.div
        variants={REVEAL}
        role="status"
        className="flex items-start gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-brand-accent)]/30 bg-[var(--color-brand-accent)]/10 px-3 py-2.5 text-xs text-[var(--color-foreground)]"
      >
        <Info
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-brand-accent-strong)]"
          aria-hidden
        />
        <span className="leading-relaxed">
          {t(locale, "rbac.commentator.banner")}
        </span>
      </motion.div>

      <motion.div variants={REVEAL} className="flex flex-col gap-1">
        <h2 className="font-[var(--font-display)] text-2xl font-[370] tracking-tight text-[var(--color-foreground)]">
          {t(locale, "rbac.commentator.card.title")}
        </h2>
      </motion.div>

      {/* Country */}
      <motion.div variants={REVEAL} className="flex flex-col gap-1.5">
        <label
          htmlFor="commentator-country"
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]"
        >
          {t(locale, "rbac.commentator.field.country")}
        </label>
        <div className="relative">
          <Globe
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-subtle)]"
            aria-hidden
          />
          <select
            id="commentator-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="h-12 w-full appearance-none rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] pl-10 pr-3 text-sm text-[var(--color-foreground)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        {errors.country && (
          <p className="text-[11px] text-[var(--color-brand-highlight)]">
            {errors.country}
          </p>
        )}
      </motion.div>

      {/* Email */}
      <motion.div variants={REVEAL} className="flex flex-col gap-1.5">
        <label
          htmlFor="commentator-email"
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]"
        >
          {t(locale, "rbac.commentator.field.email")}
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-subtle)]"
            aria-hidden
          />
          <input
            id="commentator-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t(locale, "rbac.commentator.field.email.placeholder")}
            className="h-12 w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] pl-10 pr-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
          />
        </div>
        <span className="text-[10px] text-[var(--color-text-subtle)]">
          {t(locale, "rbac.commentator.field.emailHint")}
        </span>
        {errors.email && (
          <p className="text-[11px] text-[var(--color-brand-highlight)]">
            {errors.email}
          </p>
        )}
      </motion.div>

      {/* Nickname */}
      <motion.div variants={REVEAL} className="flex flex-col gap-1.5">
        <label
          htmlFor="commentator-nickname"
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]"
        >
          {t(locale, "rbac.commentator.field.nickname")}
        </label>
        <div className="relative">
          <UserCircle2
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-subtle)]"
            aria-hidden
          />
          <input
            id="commentator-nickname"
            type="text"
            autoComplete="username"
            required
            minLength={3}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={t(locale, "rbac.commentator.field.nickname.placeholder")}
            className="h-12 w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] pl-10 pr-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
          />
        </div>
        {errors.nickname && (
          <p className="text-[11px] text-[var(--color-brand-highlight)]">
            {errors.nickname}
          </p>
        )}
      </motion.div>

      {/* Password */}
      <motion.div variants={REVEAL} className="flex flex-col gap-1.5">
        <label
          htmlFor="commentator-password"
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]"
        >
          {t(locale, "rbac.commentator.field.password")}
        </label>
        <div className="relative">
          <input
            id="commentator-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t(locale, "rbac.commentator.field.password.placeholder")}
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
        {errors.password && (
          <p className="text-[11px] text-[var(--color-brand-highlight)]">
            {errors.password}
          </p>
        )}
      </motion.div>

      {/* Confirm */}
      <motion.div variants={REVEAL} className="flex flex-col gap-1.5">
        <label
          htmlFor="commentator-confirm"
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]"
        >
          {t(locale, "rbac.commentator.field.passwordConfirm")}
        </label>
        <input
          id="commentator-confirm"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={t(locale, "rbac.commentator.field.passwordConfirm.placeholder")}
          className="h-12 w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
        />
        {errors.confirm && (
          <p className="text-[11px] text-[var(--color-brand-highlight)]">
            {errors.confirm}
          </p>
        )}
      </motion.div>

      <motion.label
        variants={REVEAL}
        className="flex items-start gap-2.5 text-xs text-[var(--color-text-muted)]"
      >
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--color-brand-primary)]"
        />
        <span>
          {t(locale, "rbac.commentator.terms")}{" "}
          <Link
            href={termsHref}
            className="font-semibold text-[var(--color-brand-primary)] underline-offset-2 hover:underline"
          >
            {t(locale, "auth.signup.terms.terms")}
          </Link>{" "}
          ·{" "}
          <Link
            href={privacyHref}
            className="font-semibold text-[var(--color-brand-primary)] underline-offset-2 hover:underline"
          >
            {t(locale, "auth.signup.terms.privacy")}
          </Link>
        </span>
      </motion.label>
      {errors.terms && (
        <p className="text-[11px] text-[var(--color-brand-highlight)]">
          {errors.terms}
        </p>
      )}

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
        <MessageSquare className="h-4 w-4" aria-hidden />
        {submitting
          ? t(locale, "rbac.commentator.submitting")
          : t(locale, "rbac.commentator.submit")}
      </motion.button>

      {status !== "disabled" ? (
        <>
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
        </>
      ) : null}

      <FooterLinks
        locale={locale}
        signInHref={signInHref}
        publisherHref={publisherHref}
      />
    </motion.form>
  );
}

function GoogleGlyph() {
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

function FooterLinks({
  locale,
  signInHref,
  publisherHref,
}: {
  locale: SupportedLocale;
  signInHref: string;
  publisherHref: string;
}) {
  return (
    <motion.div
      variants={REVEAL}
      className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-3 text-center text-xs text-[var(--color-text-muted)]"
    >
      <p>
        {t(locale, "rbac.commentator.alreadyAccount")}{" "}
        <Link
          href={signInHref}
          className="font-semibold text-[var(--color-brand-primary)] underline-offset-2 hover:underline"
        >
          {t(locale, "rbac.commentator.signIn")}
        </Link>
      </p>
      <p>
        {t(locale, "rbac.commentator.switchToPublisher")}{" "}
        <Link
          href={publisherHref}
          className="font-semibold text-[var(--color-brand-primary)] underline-offset-2 hover:underline"
        >
          {t(locale, "rbac.commentator.switchToPublisher.cta")}
        </Link>
      </p>
    </motion.div>
  );
}
