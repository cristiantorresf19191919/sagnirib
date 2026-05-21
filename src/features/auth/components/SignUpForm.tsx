"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Eye,
  EyeOff,
  Mail,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";
import { toast } from "@/shared/ui/toast";

import { useAuthSession } from "../lib/use-auth-session";

interface FieldErrors {
  email?: string;
  password?: string;
  confirm?: string;
  terms?: string;
  form?: string;
}

interface SignUpFormProps {
  /** Path to redirect to after success — sanitized to start with `/`. */
  next?: string;
}

const MIN_PASSWORD_LENGTH = 8;

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
 * Editorial sign-up form. Email + password + confirm + accept-terms.
 *
 * On success: Firebase Web SDK creates the user, the audited
 * `signUpWithIdToken` server action exchanges the ID token for the
 * session cookie, a verification email is dispatched best-effort, and
 * the user lands on `next` (sanitized) or `/`. The barrel's
 * `createListingDraft` mutation will later grant the `model` role on
 * first publish — no extra wiring needed here.
 */
export function SignUpForm({ next }: Readonly<SignUpFormProps> = {}) {
  const router = useRouter();
  const locale = useActiveLocale();
  const { status, signUpWithEmail } = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//")
      ? next
      : localizedHref(locale, "/");

  const strength = useMemo(() => scorePassword(password), [password]);

  if (status === "disabled") return <DisabledNotice locale={locale} />;
  if (status === "authenticated")
    return <AlreadySignedIn next={safeNext} locale={locale} />;

  function validate(): FieldErrors | null {
    const nextErrors: FieldErrors = {};
    if (!email.trim()) nextErrors.email = t(locale, "auth.signup.validation.email");
    if (password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = t(locale, "auth.signup.validation.password", {
        min: MIN_PASSWORD_LENGTH,
      });
    }
    if (confirm !== password)
      nextErrors.confirm = t(locale, "auth.signup.validation.confirm");
    if (!acceptTerms) {
      nextErrors.terms = t(locale, "auth.signup.validation.terms");
    }
    return Object.keys(nextErrors).length > 0 ? nextErrors : null;
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
      toast.success(
        t(locale, "auth.signup.toast.title"),
        t(locale, "auth.signup.toast.body"),
      );
      router.push(safeNext);
      router.refresh();
    } catch (err) {
      setErrors({ form: humanizeAuthError(err, locale) });
    } finally {
      setSubmitting(false);
    }
  }

  const ingresarHref = localizedHref(locale, "/ingresar");
  const termsHref = localizedHref(locale, "/legal/terminos");
  const privacyHref = localizedHref(locale, "/legal/privacidad");
  const benefits = [
    t(locale, "auth.signup.benefits.catalog"),
    t(locale, "auth.signup.benefits.favorites"),
    t(locale, "auth.signup.benefits.publish"),
  ];

  return (
    <motion.form
      onSubmit={onSubmit}
      noValidate
      variants={STAGGER}
      initial="hidden"
      animate="visible"
      className="relative flex w-full max-w-md flex-col gap-5 overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-lg)] sm:p-8"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)]/55 to-transparent"
      />

      <motion.div variants={REVEAL} className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-gold-deep)]">
          <Sparkles className="h-3 w-3" aria-hidden />
          {t(locale, "auth.signup.kicker.card")}
        </span>
        <h2 className="font-[var(--font-display)] text-2xl font-[370] tracking-tight text-[var(--color-foreground)]">
          {t(locale, "auth.signup.card.title")}
        </h2>
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          {t(locale, "auth.signup.card.subtitle")}
        </p>
      </motion.div>

      <motion.div variants={REVEAL} className="flex flex-col gap-1.5">
        <label
          htmlFor="signup-email"
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]"
        >
          {t(locale, "auth.signup.field.email")}
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-subtle)]"
            aria-hidden
          />
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t(locale, "auth.signup.field.email.placeholder")}
            className="h-12 w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] pl-10 pr-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
          />
        </div>
        {errors.email && (
          <p className="text-[11px] text-[var(--color-brand-highlight)]">
            {errors.email}
          </p>
        )}
      </motion.div>

      <motion.div variants={REVEAL} className="flex flex-col gap-1.5">
        <label
          htmlFor="signup-password"
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]"
        >
          {t(locale, "auth.signup.field.password")}
        </label>
        <div className="relative">
          <input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t(locale, "auth.signup.field.password.placeholder", {
              min: MIN_PASSWORD_LENGTH,
            })}
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
        <StrengthMeter score={strength} locale={locale} />
        {errors.password && (
          <p className="text-[11px] text-[var(--color-brand-highlight)]">
            {errors.password}
          </p>
        )}
      </motion.div>

      <motion.div variants={REVEAL} className="flex flex-col gap-1.5">
        <label
          htmlFor="signup-confirm"
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]"
        >
          {t(locale, "auth.signup.field.confirm")}
        </label>
        <input
          id="signup-confirm"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={t(locale, "auth.signup.field.confirm.placeholder")}
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
          {t(locale, "auth.signup.terms.accept")}{" "}
          <Link
            href={termsHref}
            className="font-semibold text-[var(--color-brand-primary)] underline-offset-2 hover:underline"
          >
            {t(locale, "auth.signup.terms.terms")}
          </Link>{" "}
          {t(locale, "auth.signup.terms.privacyJoin")}{" "}
          <Link
            href={privacyHref}
            className="font-semibold text-[var(--color-brand-primary)] underline-offset-2 hover:underline"
          >
            {t(locale, "auth.signup.terms.privacy")}
          </Link>
          .
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
        <UserPlus className="h-4 w-4" aria-hidden />
        {submitting
          ? t(locale, "auth.signup.submitting")
          : t(locale, "auth.signup.submit")}
      </motion.button>

      <motion.ul
        variants={REVEAL}
        className="grid grid-cols-1 gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-background-elevated)] p-3 text-[11px] text-[var(--color-text-muted)]"
        aria-label={t(locale, "auth.signup.benefits.aria")}
      >
        {benefits.map((item) => (
          <li key={item} className="inline-flex items-center gap-2">
            <Check
              className="h-3 w-3 text-[var(--color-brand-primary)]"
              aria-hidden
            />
            {item}
          </li>
        ))}
      </motion.ul>

      <motion.div
        variants={REVEAL}
        className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-background-elevated)] px-3 py-2 text-[11px] text-[var(--color-text-muted)]"
      >
        <ShieldCheck
          className="h-3.5 w-3.5 text-[var(--color-brand-primary)]"
          aria-hidden
        />
        {t(locale, "auth.signup.trustLine")}
      </motion.div>

      <motion.p
        variants={REVEAL}
        className="text-center text-xs text-[var(--color-text-muted)]"
      >
        {t(locale, "auth.signup.haveAccount")}{" "}
        <Link
          href={
            safeNext === localizedHref(locale, "/")
              ? ingresarHref
              : `${ingresarHref}?next=${encodeURIComponent(safeNext)}`
          }
          className="font-semibold text-[var(--color-brand-primary)] underline-offset-2 hover:underline"
        >
          {t(locale, "auth.signup.signIn")}
        </Link>
      </motion.p>
    </motion.form>
  );
}

function StrengthMeter({
  score,
  locale,
}: {
  score: number;
  locale: SupportedLocale;
}) {
  if (score === 0) return null;
  const cls =
    score === 1
      ? "w-1/4 bg-[var(--color-brand-highlight)]"
      : score === 2
        ? "w-2/4 bg-[var(--color-brand-warn)]"
        : score === 3
          ? "w-3/4 bg-[var(--color-brand-secondary)]"
          : "w-full bg-[var(--color-brand-primary)]";
  const label =
    score === 1
      ? t(locale, "auth.signup.strength.weak")
      : score === 2
        ? t(locale, "auth.signup.strength.okay")
        : score === 3
          ? t(locale, "auth.signup.strength.strong")
          : t(locale, "auth.signup.strength.excellent");
  return (
    <div className="flex flex-col gap-1">
      <span className="block h-1 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
        <span
          className={`block h-full rounded-full transition-[width,background-color] duration-300 ease-[var(--ease-standard)] ${cls}`}
        />
      </span>
      <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
        {label}
      </span>
    </div>
  );
}

function scorePassword(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= MIN_PASSWORD_LENGTH) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) score += 1;
  return Math.min(score, 4);
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
      <p>{t(locale, "auth.disabled.signup.body")}</p>
    </div>
  );
}

function AlreadySignedIn({
  next,
  locale,
}: {
  next: string;
  locale: SupportedLocale;
}) {
  const router = useRouter();
  return (
    <div className="flex w-full max-w-md flex-col gap-3 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-text-muted)] shadow-[var(--shadow-sm)]">
      <p>{t(locale, "auth.alreadySignedIn.lead")}</p>
      <button
        type="button"
        onClick={() => {
          router.push(next);
          router.refresh();
        }}
        className="inline-flex h-11 w-fit items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)]"
      >
        {t(locale, "auth.alreadySignedIn.continue")}
      </button>
    </div>
  );
}

function humanizeAuthError(err: unknown, locale: SupportedLocale): string {
  const code =
    typeof (err as { code?: unknown } | undefined)?.code === "string"
      ? (err as { code: string }).code
      : "";
  switch (code) {
    case "auth/email-already-in-use":
      return t(locale, "auth.signup.error.emailInUse");
    case "auth/weak-password":
      return t(locale, "auth.signup.error.weakPassword");
    case "auth/invalid-email":
      return t(locale, "auth.signup.error.invalidEmail");
    case "auth/network-request-failed":
      return t(locale, "auth.error.network");
    default:
      return (err as Error)?.message ?? t(locale, "auth.error.unknown");
  }
}
