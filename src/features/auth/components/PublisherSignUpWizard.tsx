"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Globe,
  Info,
  KeyRound,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useMemo, useRef, useState, type FormEvent } from "react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";
import { setAccountType } from "@/features/auth/actions/set-account-type";
import { useAuthSession } from "@/features/auth/lib/use-auth-session";
import {
  ACCOUNT_TYPE_PUBLISHER,
  PHONE_AUTH_ENABLED,
} from "@/features/auth/lib/rbac";
import {
  ValidatedField,
  type ValidatedFieldHandle,
} from "@/shared/ui/form";
import { toast } from "@/shared/ui/toast";

type WizardStep = "phone" | "otp" | "password";

const STEP_ORDER: ReadonlyArray<WizardStep> = ["phone", "otp", "password"];

interface PhoneState {
  country: string;
  phone: string;
  email: string;
}

interface PasswordState {
  password: string;
  confirm: string;
  acceptTerms: boolean;
}

type PhoneErrors = Partial<Record<"country" | "phone" | "email", string>>;
type OtpErrors = Partial<Record<"otp", string>>;
type PasswordErrors = Partial<
  Record<"password" | "confirm" | "terms", string>
>;

const COUNTRIES: ReadonlyArray<{ code: string; label: string; dial: string }> = [
  { code: "CO", label: "Colombia", dial: "+57" },
  { code: "AR", label: "Argentina", dial: "+54" },
  { code: "MX", label: "México", dial: "+52" },
  { code: "CL", label: "Chile", dial: "+56" },
  { code: "PE", label: "Perú", dial: "+51" },
  { code: "UY", label: "Uruguay", dial: "+598" },
  { code: "ES", label: "España", dial: "+34" },
  { code: "BR", label: "Brasil", dial: "+55" },
];

const REVEAL: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  },
};

const inputCls =
  "h-12 w-full appearance-none rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30 aria-[invalid=true]:border-[var(--color-brand-highlight)] aria-[invalid=true]:focus:ring-[var(--color-brand-highlight)]/35";
const inputClsWithLeftIcon = `${inputCls} pl-10`;

/**
 * Publisher (partner) signup wizard — ACCOUNT-LEVEL data only.
 *
 * Three steps: phone+email → OTP → password. Submit creates the
 * Firebase Auth user; `signUpWithIdToken` writes
 * `users/{uid}.accountType = 'publisher'` (ADR-019) from the
 * `biringas:account-type` cookie that `/registrarse` already set.
 *
 * After signup the publisher lands on `/bienvenida` (the celebratory
 * onboarding screen) which then carries them to `/mi-cuenta` (their
 * dashboard). From there, modelo-level work happens:
 *
 *   - Creating a `persons/{personId}` doc — partner can have 1 or N
 *     modelos (ADR-018).
 *   - Submitting KYC at `/verificacion/enviar`, per person (ADR-018
 *     amendment).
 *   - Publishing a listing at `/publicar`, scoped to a specific
 *     person (ADR-018 § "createListingDraft gains personId").
 *
 * The wizard NEVER asks for modelo profile data (city, age, category,
 * title, photos, contact prefs). Those are properties of a published
 * listing, not of the account that publishes it. Conflating them was
 * the bug closed by this refactor.
 */
export function PublisherSignUpWizard() {
  const router = useRouter();
  const locale = useActiveLocale();
  const { status, signUpWithEmail, signInWithGoogle, signOut } =
    useAuthSession();

  const [step, setStep] = useState<WizardStep>("phone");
  const [phone, setPhone] = useState<PhoneState>({
    country: "CO",
    phone: "",
    email: "",
  });
  const [phoneErrors, setPhoneErrors] = useState<PhoneErrors>({});
  const [otp, setOtp] = useState("");
  const [otpErrors, setOtpErrors] = useState<OtpErrors>({});
  const [pw, setPw] = useState<PasswordState>({
    password: "",
    confirm: "",
    acceptTerms: false,
  });
  const [pwErrors, setPwErrors] = useState<PasswordErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const refs = useRef<Record<string, ValidatedFieldHandle>>({});
  // Stable per-key callback ref factory. The cache lives in a ref so the
  // memoized accessor function itself is identity-stable across renders
  // and React 19's "no local mutation after render" rule is satisfied.
  const callbackCache = useRef(
    new Map<string, (h: ValidatedFieldHandle | null) => void>(),
  );
  const setRef = useMemo(
    () =>
      (key: string) => {
        const existing = callbackCache.current.get(key);
        if (existing) return existing;
        const fn = (handle: ValidatedFieldHandle | null) => {
          if (handle) refs.current[key] = handle;
          else delete refs.current[key];
        };
        callbackCache.current.set(key, fn);
        return fn;
      },
    [],
  );

  const dial =
    COUNTRIES.find((c) => c.code === phone.country)?.dial ?? "+1";
  const e164 = `${dial}${phone.phone.replace(/\D+/g, "")}`;

  function validatePhone(): PhoneErrors {
    const next: PhoneErrors = {};
    if (!phone.country)
      next.country = t(locale, "rbac.publisher.phone.validation.country");
    if (phone.phone.replace(/\D+/g, "").length < 7)
      next.phone = t(locale, "rbac.publisher.phone.validation.phone");
    if (!phone.email.includes("@") || !phone.email.includes("."))
      next.email = t(locale, "rbac.publisher.phone.validation.email");
    return next;
  }

  function validateOtp(): OtpErrors {
    return otp.length === 6
      ? {}
      : { otp: t(locale, "rbac.publisher.otp.validation") };
  }

  function validatePassword(): PasswordErrors {
    const next: PasswordErrors = {};
    if (pw.password.length < 8)
      next.password = t(locale, "rbac.publisher.password.validation.password");
    if (pw.confirm !== pw.password)
      next.confirm = t(locale, "rbac.publisher.password.validation.confirm");
    if (!pw.acceptTerms)
      next.terms = t(locale, "rbac.publisher.password.validation.terms");
    return next;
  }

  function shakeFirst(
    keys: ReadonlyArray<string>,
    errors: Record<string, string | undefined>,
  ) {
    for (const k of keys) {
      if (errors[k]) {
        refs.current[k]?.shake();
        return;
      }
    }
  }

  function goNext() {
    setSubmitError(null);
    if (step === "phone") {
      const errs = validatePhone();
      setPhoneErrors(errs);
      if (Object.keys(errs).length) {
        shakeFirst(["country", "phone", "email"], errs);
        toast.error(
          t(locale, "rbac.form.toast.invalid.title"),
          t(locale, "rbac.form.toast.invalid.body"),
        );
        return;
      }
      setStep("otp");
      return;
    }
    if (step === "otp") {
      const errs = validateOtp();
      setOtpErrors(errs);
      if (Object.keys(errs).length) {
        shakeFirst(["otp"], errs);
        toast.error(
          t(locale, "rbac.form.toast.invalid.title"),
          t(locale, "rbac.form.toast.invalid.body"),
        );
        return;
      }
      setStep("password");
    }
  }

  function goBack() {
    setSubmitError(null);
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1] as WizardStep);
  }

  /**
   * Google OAuth shortcut on step 1. Google auth itself proves
   * email+identity, so we skip OTP and password and complete the
   * signup immediately. Lands on `/bienvenida`.
   *
   * ADR-019 refusal: this is a SIGNUP surface, not a login surface.
   * `signInWithGoogle` will happily authenticate an existing Google
   * email that already had `users/{uid}.accountType = 'commentator'`
   * locked — without an explicit check the user would silently land
   * on the commentator dashboard wondering why their "publisher
   * signup" didn't apply. After the Google popup we call
   * `setAccountType('publisher')`: if the doc was already locked to
   * commentator it returns `account-type-locked`, and we sign the
   * user back out and surface a "use another Google account" error.
   */
  async function onGoogleShortcut() {
    setSubmitError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      const result = await setAccountType(ACCOUNT_TYPE_PUBLISHER);
      if (!result.ok && result.error?.kind === "account-type-locked") {
        const msg = t(locale, "auth.signup.google.lockedAsClient");
        await signOut().catch(() => undefined);
        setSubmitError(msg);
        toast.error(t(locale, "rbac.form.toast.error.title"), msg);
        setSubmitting(false);
        return;
      }
      router.push(localizedHref(locale, "/bienvenida"));
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
      setSubmitError(msg);
      toast.error(t(locale, "rbac.form.toast.error.title"), msg);
      setSubmitting(false);
    }
  }

  /**
   * Final submit (only fires on the password step). Creates the
   * Firebase Auth user; downstream `signUpWithIdToken` writes
   * `users/{uid}` with `accountType: 'publisher'` from the cookie the
   * `/registrarse` chooser set.
   */
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== "password") {
      goNext();
      return;
    }
    const errs = validatePassword();
    setPwErrors(errs);
    if (Object.keys(errs).length) {
      shakeFirst(["password", "confirm", "terms"], errs);
      toast.error(
        t(locale, "rbac.form.toast.invalid.title"),
        t(locale, "rbac.form.toast.invalid.body"),
      );
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      if (status !== "disabled" && !status?.includes("authenticated")) {
        await signUpWithEmail(phone.email, pw.password);
      }
      toast.success(
        t(locale, "rbac.form.toast.success.title"),
        t(locale, "rbac.form.toast.success.body"),
      );
      router.push(localizedHref(locale, "/bienvenida"));
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
      setSubmitError(msg);
      toast.error(t(locale, "rbac.form.toast.error.title"), msg);
      setSubmitting(false);
    }
  }

  const switchToCommentatorHref = localizedHref(
    locale,
    "/registrarse/comentarios",
  );

  return (
    <motion.form
      onSubmit={onSubmit}
      noValidate
      className="relative flex w-full flex-col gap-6 overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-lg)] sm:p-8"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)]/55 to-transparent"
      />

      <ChapterMarker currentStep={step} locale={locale} />
      <WizardStepper currentStep={step} locale={locale} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={REVEAL}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="flex flex-col gap-5"
        >
          {step === "phone" ? (
            <>
              <PhoneStep
                locale={locale}
                value={phone}
                onChange={(next) => {
                  setPhone(next);
                  if (Object.keys(phoneErrors).length) setPhoneErrors({});
                }}
                errors={phoneErrors}
                setRef={setRef}
                countries={COUNTRIES}
              />
              {status !== "disabled" ? (
                <>
                  <div
                    role="separator"
                    aria-orientation="horizontal"
                    className="flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-subtle)]"
                  >
                    <span
                      className="h-px flex-1 bg-[var(--color-border)]"
                      aria-hidden
                    />
                    <span>{t(locale, "auth.signin.divider")}</span>
                    <span
                      className="h-px flex-1 bg-[var(--color-border)]"
                      aria-hidden
                    />
                  </div>
                  <button
                    type="button"
                    onClick={onGoogleShortcut}
                    disabled={submitting}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-sm font-semibold text-[var(--color-foreground)] transition-[border-color,background,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <GoogleGlyph />
                    {t(locale, "auth.signin.google")}
                  </button>
                </>
              ) : null}
            </>
          ) : null}
          {step === "otp" ? (
            <OtpStep
              locale={locale}
              value={otp}
              onChange={(v) => {
                setOtp(v);
                if (otpErrors.otp) setOtpErrors({});
              }}
              error={otpErrors.otp}
              setRef={setRef}
              e164={e164}
            />
          ) : null}
          {step === "password" ? (
            <PasswordStep
              locale={locale}
              value={pw}
              onChange={(next) => {
                setPw(next);
                if (Object.keys(pwErrors).length) setPwErrors({});
              }}
              errors={pwErrors}
              setRef={setRef}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>

      {submitError && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-brand-highlight)]/40 bg-[var(--color-brand-highlight)]/10 px-3 py-2 text-xs text-[var(--color-brand-highlight)]"
        >
          {submitError}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-5">
        <button
          type="button"
          onClick={goBack}
          disabled={step === "phone" || submitting}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-xs font-semibold text-[var(--color-foreground)] transition-colors hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {t(locale, "rbac.publisher.back")}
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {step === "password" ? (
            submitting ? (
              t(locale, "rbac.publisher.password.submitting")
            ) : (
              <>
                <UserCheck className="h-4 w-4" aria-hidden />
                {t(locale, "rbac.publisher.password.submit")}
              </>
            )
          ) : (
            <>
              {t(locale, "rbac.publisher.next")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-[var(--color-text-subtle)]">
          {t(locale, "rbac.publisher.changeAccountType")}
        </span>
        <Link
          href={switchToCommentatorHref}
          className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)]"
        >
          <Search className="h-3.5 w-3.5 text-[var(--color-brand-primary)]" aria-hidden />
          {t(locale, "rbac.publisher.changeAccountType.cta")}
        </Link>
      </div>
    </motion.form>
  );
}

/* -------------------------------------------------------------------------- */
/* Chapter marker + stepper                                                   */
/* -------------------------------------------------------------------------- */

function ChapterMarker({
  currentStep,
  locale,
}: {
  currentStep: WizardStep;
  locale: SupportedLocale;
}) {
  const labels: Record<WizardStep, string> = {
    phone: t(locale, "rbac.publisher.step.phone"),
    otp: t(locale, "rbac.publisher.step.otp"),
    password: t(locale, "rbac.publisher.step.password"),
  };
  const idx = STEP_ORDER.indexOf(currentStep);
  const pad = (n: number) => String(n + 1).padStart(2, "0");

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex items-baseline gap-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={currentStep}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="text-[var(--color-brand-primary)]"
          >
            {pad(idx)}
          </motion.span>
        </AnimatePresence>
        <span aria-hidden className="text-[var(--color-text-subtle)]/60">
          /
        </span>
        <span>{pad(STEP_ORDER.length - 1)}</span>
        <span
          aria-hidden
          className="mx-1 inline-block h-px w-6 bg-[var(--color-border)]"
        />
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={currentStep}
            initial={{ opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-[var(--color-foreground)]"
          >
            {labels[currentStep]}
          </motion.span>
        </AnimatePresence>
      </span>
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--color-gold)] shadow-[0_0_0_3px_rgba(200,166,118,0.18)]"
      />
    </div>
  );
}

function WizardStepper({
  currentStep,
  locale,
}: {
  currentStep: WizardStep;
  locale: SupportedLocale;
}) {
  const labels: Record<WizardStep, string> = useMemo(
    () => ({
      phone: t(locale, "rbac.publisher.step.phone"),
      otp: t(locale, "rbac.publisher.step.otp"),
      password: t(locale, "rbac.publisher.step.password"),
    }),
    [locale],
  );

  const currentIdx = STEP_ORDER.indexOf(currentStep);

  return (
    <nav
      aria-label={t(locale, "rbac.publisher.stepper.aria")}
      className="flex items-center justify-between gap-2 sm:gap-3"
    >
      {STEP_ORDER.map((s, idx) => {
        const active = s === currentStep;
        const done = idx < currentIdx;
        const tone = active
          ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)]"
          : done
            ? "border-[var(--color-brand-primary)]/50 bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-subtle)]";
        return (
          <div
            key={s}
            className="flex flex-1 items-center gap-2 sm:gap-3"
            aria-current={active ? "step" : undefined}
          >
            <motion.span
              layout
              animate={active ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className={`relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors duration-300 ${tone}`}
            >
              {active ? (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full ring-2 ring-[var(--color-brand-primary)]/30"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              ) : null}
              <motion.span
                key={done ? "check" : `${idx}`}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="relative inline-flex items-center justify-center"
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  idx + 1
                )}
              </motion.span>
            </motion.span>
            <span
              className={`hidden truncate text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors duration-300 sm:inline ${active || done ? "text-[var(--color-foreground)]" : "text-[var(--color-text-subtle)]"}`}
            >
              {labels[s]}
            </span>
            {idx < STEP_ORDER.length - 1 ? (
              <span
                aria-hidden
                className="relative h-px flex-1 overflow-hidden bg-[var(--color-border)]"
              >
                <motion.span
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-gold)]"
                  initial={false}
                  animate={{ width: done ? "100%" : "0%" }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 1 — Phone + email                                                     */
/* -------------------------------------------------------------------------- */

function PhoneStep({
  locale,
  value,
  onChange,
  errors,
  setRef,
  countries,
}: {
  locale: SupportedLocale;
  value: PhoneState;
  onChange: (next: PhoneState) => void;
  errors: PhoneErrors;
  setRef: (key: string) => (handle: ValidatedFieldHandle | null) => void;
  countries: ReadonlyArray<{ code: string; label: string; dial: string }>;
}) {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h2 className="font-[var(--font-display)] text-xl font-[420] tracking-tight text-[var(--color-foreground)]">
          {t(locale, "rbac.publisher.phone.title")}
        </h2>
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          {t(locale, "rbac.publisher.phone.subtitle")}
        </p>
      </header>

      {!PHONE_AUTH_ENABLED ? (
        <DisabledNotice body={t(locale, "rbac.publisher.phone.disabledNotice")} />
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ValidatedField
          ref={setRef("country")}
          id="country"
          label={t(locale, "rbac.publisher.phone.country")}
          required
          icon={<Globe className="h-4 w-4" aria-hidden />}
          error={errors.country}
        >
          {(api) => (
            <select
              {...api}
              value={value.country}
              onChange={(e) => onChange({ ...value, country: e.target.value })}
              className={inputClsWithLeftIcon}
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label} ({c.dial})
                </option>
              ))}
            </select>
          )}
        </ValidatedField>

        <ValidatedField
          ref={setRef("phone")}
          id="phone"
          label={t(locale, "rbac.publisher.phone.field")}
          required
          icon={<Phone className="h-4 w-4" aria-hidden />}
          error={errors.phone}
          className="sm:col-span-2"
        >
          {(api) => (
            <input
              {...api}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={value.phone}
              onChange={(e) =>
                onChange({
                  ...value,
                  phone: e.target.value.replace(/[^\d ]/g, ""),
                })
              }
              placeholder={t(locale, "rbac.publisher.phone.field.placeholder")}
              className={inputClsWithLeftIcon}
            />
          )}
        </ValidatedField>
      </div>

      <ValidatedField
        ref={setRef("email")}
        id="email"
        label={t(locale, "rbac.publisher.phone.email")}
        required
        icon={<Mail className="h-4 w-4" aria-hidden />}
        error={errors.email}
      >
        {(api) => (
          <input
            {...api}
            type="email"
            autoComplete="email"
            value={value.email}
            onChange={(e) => onChange({ ...value, email: e.target.value })}
            placeholder={t(locale, "rbac.publisher.phone.email.placeholder")}
            className={inputClsWithLeftIcon}
          />
        )}
      </ValidatedField>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 2 — OTP                                                               */
/* -------------------------------------------------------------------------- */

function OtpStep({
  locale,
  value,
  onChange,
  error,
  setRef,
  e164,
}: {
  locale: SupportedLocale;
  value: string;
  onChange: (next: string) => void;
  error: string | undefined;
  setRef: (key: string) => (handle: ValidatedFieldHandle | null) => void;
  e164: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h2 className="font-[var(--font-display)] text-xl font-[420] tracking-tight text-[var(--color-foreground)]">
          {t(locale, "rbac.publisher.otp.title")}
        </h2>
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          {t(locale, "rbac.publisher.otp.subtitle", { phone: e164 })}
        </p>
      </header>

      {!PHONE_AUTH_ENABLED ? (
        <DisabledNotice body={t(locale, "rbac.publisher.otp.optimistic")} />
      ) : null}

      <ValidatedField
        ref={setRef("otp")}
        id="otp"
        label={t(locale, "rbac.publisher.otp.field")}
        required
        icon={<KeyRound className="h-4 w-4" aria-hidden />}
        error={error}
      >
        {(api) => (
          <input
            {...api}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={value}
            onChange={(e) =>
              onChange(e.target.value.replace(/\D+/g, "").slice(0, 6))
            }
            placeholder="000000"
            className={`${inputClsWithLeftIcon} font-mono text-base tracking-[0.4em]`}
          />
        )}
      </ValidatedField>

      <button
        type="button"
        disabled
        className="inline-flex w-fit items-center gap-1.5 text-[11px] font-semibold text-[var(--color-text-subtle)]"
      >
        <ShieldCheck className="h-3 w-3" aria-hidden />
        {t(locale, "rbac.publisher.otp.resend")}
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 3 — Password (final step, completes the signup)                       */
/* -------------------------------------------------------------------------- */

function PasswordStep({
  locale,
  value,
  onChange,
  errors,
  setRef,
}: {
  locale: SupportedLocale;
  value: PasswordState;
  onChange: (next: PasswordState) => void;
  errors: PasswordErrors;
  setRef: (key: string) => (handle: ValidatedFieldHandle | null) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h2 className="font-[var(--font-display)] text-xl font-[420] tracking-tight text-[var(--color-foreground)]">
          {t(locale, "rbac.publisher.password.title")}
        </h2>
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          {t(locale, "rbac.publisher.password.subtitle")}
        </p>
      </header>

      <ValidatedField
        ref={setRef("password")}
        id="password"
        label={t(locale, "rbac.publisher.password.field")}
        required
        error={errors.password}
      >
        {(api) => (
          <div className="relative">
            <input
              {...api}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              value={value.password}
              onChange={(e) => onChange({ ...value, password: e.target.value })}
              placeholder={t(locale, "rbac.publisher.password.field.placeholder")}
              className={`${inputCls} pr-12`}
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
        )}
      </ValidatedField>

      <ValidatedField
        ref={setRef("confirm")}
        id="confirm"
        label={t(locale, "rbac.publisher.password.confirm")}
        required
        error={errors.confirm}
      >
        {(api) => (
          <input
            {...api}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={value.confirm}
            onChange={(e) => onChange({ ...value, confirm: e.target.value })}
            placeholder={t(locale, "rbac.publisher.password.confirm.placeholder")}
            className={inputCls}
          />
        )}
      </ValidatedField>

      <label
        className={`flex items-start gap-2.5 rounded-[var(--radius-md)] border px-3 py-2 text-xs text-[var(--color-text-muted)] transition-colors ${errors.terms ? "border-[var(--color-brand-highlight)]/45 bg-[var(--color-brand-highlight)]/6" : "border-transparent"}`}
      >
        <input
          type="checkbox"
          checked={value.acceptTerms}
          onChange={(e) =>
            onChange({ ...value, acceptTerms: e.target.checked })
          }
          aria-invalid={errors.terms ? true : undefined}
          className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--color-brand-primary)]"
        />
        <span>{t(locale, "rbac.publisher.password.terms.lead")}</span>
      </label>
      <AnimatePresence>
        {errors.terms ? (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.2 }}
            className="text-[11px] text-[var(--color-brand-highlight)]"
          >
            {errors.terms}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tiny helpers                                                               */
/* -------------------------------------------------------------------------- */

function DisabledNotice({ body }: { body: string }) {
  return (
    <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-brand-accent)]/30 bg-[var(--color-brand-accent)]/10 px-3 py-2 text-xs text-[var(--color-foreground)]">
      <Info
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-brand-accent-strong)]"
        aria-hidden
      />
      <span className="leading-relaxed">{body}</span>
    </div>
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
