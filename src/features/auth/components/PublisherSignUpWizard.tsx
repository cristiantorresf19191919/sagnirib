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
  ImagePlus,
  Info,
  KeyRound,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";
import { useAuthSession } from "@/features/auth/lib/use-auth-session";
import { PHONE_AUTH_ENABLED } from "@/features/auth/lib/rbac";
import { toast } from "@/shared/ui/toast";

type WizardStep = "phone" | "otp" | "password" | "profile";

const STEP_ORDER: ReadonlyArray<WizardStep> = [
  "phone",
  "otp",
  "password",
  "profile",
];

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

interface ProfileState {
  state: string;
  city: string;
  neighborhood: string;
  travels: string;
  age: string;
  category: string;
  title: string;
  description: string;
  contactEmail: boolean;
  contactPhone: boolean;
  contactWhatsapp: boolean;
  contactTelegram: boolean;
  noDeposit: boolean;
  acceptTerms: boolean;
}

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

const CATEGORIES: ReadonlyArray<string> = [
  "Acompañantes",
  "Masajes",
  "Eventos",
  "Salidas",
  "Videollamadas",
  "Otros",
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

/**
 * Flow A — multi-step publisher registration wizard.
 *
 * Steps follow PDF page 3:
 *   1. Phone + email
 *   2. OTP verification (optimistic — feature-flagged off)
 *   3. Password
 *   4. Profile details (location, details, photos, contact, terms)
 *
 * Photo upload + phone OTP are stubbed visually. Profile submission
 * lands on the post-publish "perfil bajo moderación" screen at
 * `/mi-cuenta?just_published=1`.
 */
export function PublisherSignUpWizard() {
  const router = useRouter();
  const locale = useActiveLocale();
  const { status, signUpWithEmail, signInWithGoogle } = useAuthSession();

  const [step, setStep] = useState<WizardStep>("phone");
  const [phone, setPhone] = useState<PhoneState>({
    country: "CO",
    phone: "",
    email: "",
  });
  const [otp, setOtp] = useState("");
  const [pw, setPw] = useState<PasswordState>({
    password: "",
    confirm: "",
    acceptTerms: false,
  });
  const [profile, setProfile] = useState<ProfileState>({
    state: "",
    city: "",
    neighborhood: "",
    travels: "",
    age: "",
    category: "",
    title: "",
    description: "",
    contactEmail: true,
    contactPhone: false,
    contactWhatsapp: false,
    contactTelegram: false,
    noDeposit: false,
    acceptTerms: false,
  });
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const dial =
    COUNTRIES.find((c) => c.code === phone.country)?.dial ?? "+1";
  const e164 = `${dial}${phone.phone.replace(/\D+/g, "")}`;

  function goNext() {
    setStepError(null);
    const error = validateStep(step, { phone, otp, pw, profile }, locale);
    if (error) {
      setStepError(error);
      return;
    }
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[idx + 1] as WizardStep);
    }
  }

  /**
   * Google shortcut. Authenticates the user via Google popup then skips
   * straight to the profile step — phone/OTP/password become irrelevant
   * because the identity provider already gave us a verified email. The
   * `biringas:account-type` cookie set by the chooser still tags the
   * account as publisher.
   */
  async function onGoogleShortcut() {
    setStepError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      setStep("profile");
    } catch (err) {
      const code =
        typeof (err as { code?: unknown } | undefined)?.code === "string"
          ? (err as { code: string }).code
          : "";
      const msg =
        code === "auth/popup-closed-by-user"
          ? t(locale, "auth.error.popupClosed")
          : ((err as Error)?.message ?? t(locale, "auth.error.unknown"));
      setStepError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function goBack() {
    setStepError(null);
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1] as WizardStep);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== "profile") {
      goNext();
      return;
    }
    const error = validateStep("profile", { phone, otp, pw, profile }, locale);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    setSubmitting(true);
    try {
      if (status !== "disabled") {
        await signUpWithEmail(phone.email, pw.password);
      }
      toast.success(
        t(locale, "rbac.commentator.successToast.title"),
        t(locale, "rbac.publisher.postPublish.banner"),
      );
      // Post-publish flow lives on the dashboard with the "perfil bajo
      // moderación" banner + verification prompt visible.
      router.push(
        `${localizedHref(locale, "/mi-cuenta")}?just_published=1`,
      );
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
      setStepError(msg);
    } finally {
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
                onChange={setPhone}
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
              onChange={setOtp}
              e164={e164}
            />
          ) : null}
          {step === "password" ? (
            <PasswordStep locale={locale} value={pw} onChange={setPw} />
          ) : null}
          {step === "profile" ? (
            <ProfileStep
              locale={locale}
              value={profile}
              onChange={setProfile}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>

      {stepError && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-brand-highlight)]/40 bg-[var(--color-brand-highlight)]/10 px-3 py-2 text-xs text-[var(--color-brand-highlight)]"
        >
          {stepError}
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
          {step === "profile" ? (
            submitting ? (
              t(locale, "rbac.publisher.profile.submitting")
            ) : (
              <>
                <UserCheck className="h-4 w-4" aria-hidden />
                {t(locale, "rbac.publisher.profile.submit")}
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

      <p className="text-center text-[11px] text-[var(--color-text-muted)]">
        {t(locale, "rbac.publisher.changeAccountType")}{" "}
        <Link
          href={switchToCommentatorHref}
          className="font-semibold text-[var(--color-brand-primary)] underline-offset-2 hover:underline"
        >
          {t(locale, "rbac.publisher.changeAccountType.cta")}
        </Link>
      </p>
    </motion.form>
  );
}

/* -------------------------------------------------------------------------- */
/* Stepper                                                                    */
/* -------------------------------------------------------------------------- */

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
      profile: t(locale, "rbac.publisher.step.profile"),
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
          ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-[var(--color-surface)]"
          : done
            ? "border-[var(--color-brand-primary)]/50 bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-subtle)]";
        return (
          <div
            key={s}
            className="flex flex-1 items-center gap-2 sm:gap-3"
            aria-current={active ? "step" : undefined}
          >
            <span
              className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${tone}`}
            >
              {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : idx + 1}
            </span>
            <span
              className={`hidden truncate text-[11px] font-semibold uppercase tracking-[0.16em] sm:inline ${active || done ? "text-[var(--color-foreground)]" : "text-[var(--color-text-subtle)]"}`}
            >
              {labels[s]}
            </span>
            {idx < STEP_ORDER.length - 1 ? (
              <span
                aria-hidden
                className={`h-px flex-1 ${done ? "bg-[var(--color-brand-primary)]/40" : "bg-[var(--color-border)]"}`}
              />
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
  countries,
}: {
  locale: SupportedLocale;
  value: PhoneState;
  onChange: (next: PhoneState) => void;
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
        <DisabledNotice
          icon={<Info className="h-3.5 w-3.5" aria-hidden />}
          body={t(locale, "rbac.publisher.phone.disabledNotice")}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FormField
          id="pub-country"
          label={t(locale, "rbac.publisher.phone.country")}
          icon={<Globe className="h-4 w-4" aria-hidden />}
        >
          <select
            id="pub-country"
            value={value.country}
            onChange={(e) => onChange({ ...value, country: e.target.value })}
            className="h-12 w-full appearance-none rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] pl-10 pr-3 text-sm text-[var(--color-foreground)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label} ({c.dial})
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          id="pub-phone"
          className="sm:col-span-2"
          label={t(locale, "rbac.publisher.phone.field")}
          icon={<Phone className="h-4 w-4" aria-hidden />}
        >
          <input
            id="pub-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={value.phone}
            onChange={(e) =>
              onChange({ ...value, phone: e.target.value.replace(/[^\d ]/g, "") })
            }
            placeholder={t(locale, "rbac.publisher.phone.field.placeholder")}
            className="h-12 w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] pl-10 pr-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
          />
        </FormField>
      </div>

      <FormField
        id="pub-email"
        label={t(locale, "rbac.publisher.phone.email")}
        icon={<Mail className="h-4 w-4" aria-hidden />}
      >
        <input
          id="pub-email"
          type="email"
          autoComplete="email"
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
          placeholder={t(locale, "rbac.publisher.phone.email.placeholder")}
          className="h-12 w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] pl-10 pr-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
        />
      </FormField>
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
  e164,
}: {
  locale: SupportedLocale;
  value: string;
  onChange: (next: string) => void;
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
        <DisabledNotice
          icon={<Info className="h-3.5 w-3.5" aria-hidden />}
          body={t(locale, "rbac.publisher.otp.optimistic")}
        />
      ) : null}

      <FormField
        id="pub-otp"
        label={t(locale, "rbac.publisher.otp.field")}
        icon={<KeyRound className="h-4 w-4" aria-hidden />}
      >
        <input
          id="pub-otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D+/g, "").slice(0, 6))}
          placeholder="000000"
          className="h-12 w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] pl-10 pr-3 font-mono text-base tracking-[0.4em] text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
        />
      </FormField>

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
/* Step 3 — Password                                                          */
/* -------------------------------------------------------------------------- */

function PasswordStep({
  locale,
  value,
  onChange,
}: {
  locale: SupportedLocale;
  value: PasswordState;
  onChange: (next: PasswordState) => void;
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

      <FormField
        id="pub-pass"
        label={t(locale, "rbac.publisher.password.field")}
      >
        <div className="relative">
          <input
            id="pub-pass"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            minLength={8}
            value={value.password}
            onChange={(e) => onChange({ ...value, password: e.target.value })}
            placeholder={t(locale, "rbac.publisher.password.field.placeholder")}
            className="h-12 w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 pr-12 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
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
      </FormField>

      <FormField
        id="pub-confirm"
        label={t(locale, "rbac.publisher.password.confirm")}
      >
        <input
          id="pub-confirm"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={value.confirm}
          onChange={(e) => onChange({ ...value, confirm: e.target.value })}
          placeholder={t(locale, "rbac.publisher.password.confirm.placeholder")}
          className="h-12 w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
        />
      </FormField>

      <label className="flex items-start gap-2.5 text-xs text-[var(--color-text-muted)]">
        <input
          type="checkbox"
          checked={value.acceptTerms}
          onChange={(e) =>
            onChange({ ...value, acceptTerms: e.target.checked })
          }
          className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--color-brand-primary)]"
        />
        <span>{t(locale, "rbac.publisher.password.terms.lead")}</span>
      </label>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 4 — Profile details                                                   */
/* -------------------------------------------------------------------------- */

function ProfileStep({
  locale,
  value,
  onChange,
}: {
  locale: SupportedLocale;
  value: ProfileState;
  onChange: (next: ProfileState) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="font-[var(--font-display)] text-xl font-[420] tracking-tight text-[var(--color-foreground)]">
          {t(locale, "rbac.publisher.profile.title")}
        </h2>
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          {t(locale, "rbac.publisher.profile.subtitle")}
        </p>
      </header>

      {/* Location */}
      <Fieldset legend={t(locale, "rbac.publisher.profile.section.location")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            id="prof-state"
            label={t(locale, "rbac.publisher.profile.field.state")}
          >
            <input
              id="prof-state"
              type="text"
              value={value.state}
              onChange={(e) => onChange({ ...value, state: e.target.value })}
              placeholder={t(
                locale,
                "rbac.publisher.profile.field.state.placeholder",
              )}
              className={inputCls()}
            />
          </FormField>
          <FormField
            id="prof-city"
            label={t(locale, "rbac.publisher.profile.field.city")}
          >
            <input
              id="prof-city"
              type="text"
              value={value.city}
              onChange={(e) => onChange({ ...value, city: e.target.value })}
              placeholder={t(
                locale,
                "rbac.publisher.profile.field.city.placeholder",
              )}
              className={inputCls()}
            />
          </FormField>
          <FormField
            id="prof-neighborhood"
            label={t(locale, "rbac.publisher.profile.field.neighborhood")}
          >
            <input
              id="prof-neighborhood"
              type="text"
              value={value.neighborhood}
              onChange={(e) =>
                onChange({ ...value, neighborhood: e.target.value })
              }
              placeholder={t(
                locale,
                "rbac.publisher.profile.field.neighborhood.placeholder",
              )}
              className={inputCls()}
            />
          </FormField>
          <FormField
            id="prof-travels"
            label={t(locale, "rbac.publisher.profile.field.travels")}
          >
            <input
              id="prof-travels"
              type="text"
              value={value.travels}
              onChange={(e) =>
                onChange({ ...value, travels: e.target.value })
              }
              placeholder={t(
                locale,
                "rbac.publisher.profile.field.travels.placeholder",
              )}
              className={inputCls()}
            />
          </FormField>
        </div>
      </Fieldset>

      {/* Details */}
      <Fieldset legend={t(locale, "rbac.publisher.profile.section.details")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            id="prof-age"
            label={t(locale, "rbac.publisher.profile.field.age")}
          >
            <input
              id="prof-age"
              type="number"
              min={18}
              max={99}
              value={value.age}
              onChange={(e) => onChange({ ...value, age: e.target.value })}
              placeholder={t(
                locale,
                "rbac.publisher.profile.field.age.placeholder",
              )}
              className={inputCls()}
            />
          </FormField>
          <FormField
            id="prof-category"
            label={t(locale, "rbac.publisher.profile.field.category")}
          >
            <select
              id="prof-category"
              value={value.category}
              onChange={(e) =>
                onChange({ ...value, category: e.target.value })
              }
              className={inputCls()}
            >
              <option value="">
                {t(locale, "rbac.publisher.profile.field.category.placeholder")}
              </option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <FormField
          id="prof-title"
          label={t(locale, "rbac.publisher.profile.field.title")}
        >
          <input
            id="prof-title"
            type="text"
            minLength={40}
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            placeholder={t(
              locale,
              "rbac.publisher.profile.field.title.placeholder",
            )}
            className={inputCls()}
          />
        </FormField>
        <FormField
          id="prof-desc"
          label={t(locale, "rbac.publisher.profile.field.description")}
        >
          <textarea
            id="prof-desc"
            rows={5}
            minLength={80}
            value={value.description}
            onChange={(e) =>
              onChange({ ...value, description: e.target.value })
            }
            placeholder={t(
              locale,
              "rbac.publisher.profile.field.description.placeholder",
            )}
            className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
          />
        </FormField>
      </Fieldset>

      {/* Contact options */}
      <Fieldset legend={t(locale, "rbac.publisher.profile.section.contact")}>
        <p className="text-[11px] text-[var(--color-text-subtle)]">
          {t(locale, "rbac.publisher.profile.contact.help")}
        </p>
        <div className="flex flex-col gap-2">
          {[
            {
              key: "contactEmail" as const,
              label: t(locale, "rbac.publisher.profile.contact.email"),
            },
            {
              key: "contactPhone" as const,
              label: t(locale, "rbac.publisher.profile.contact.phone"),
            },
            {
              key: "contactWhatsapp" as const,
              label: t(locale, "rbac.publisher.profile.contact.whatsapp"),
            },
            {
              key: "contactTelegram" as const,
              label: t(locale, "rbac.publisher.profile.contact.telegram"),
            },
            {
              key: "noDeposit" as const,
              label: t(locale, "rbac.publisher.profile.contact.noDeposit"),
            },
          ].map((opt) => (
            <label
              key={opt.key}
              className="inline-flex items-start gap-2 text-xs text-[var(--color-text-muted)]"
            >
              <input
                type="checkbox"
                checked={Boolean(value[opt.key])}
                onChange={(e) =>
                  onChange({ ...value, [opt.key]: e.target.checked })
                }
                className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--color-brand-primary)]"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </Fieldset>

      {/* Photos */}
      <Fieldset legend={t(locale, "rbac.publisher.profile.section.photos")}>
        <p className="text-[11px] text-[var(--color-text-muted)]">
          {t(locale, "rbac.publisher.profile.photos.help")}
        </p>
        <button
          type="button"
          disabled
          className="flex w-full flex-col items-center justify-center gap-1.5 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-background-elevated)]/60 px-4 py-10 text-xs text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-brand-primary-soft)]"
        >
          <ImagePlus
            className="h-5 w-5 text-[var(--color-brand-primary)]"
            aria-hidden
          />
          <span>{t(locale, "rbac.publisher.profile.photos.cta")}</span>
        </button>
        <DisabledNotice
          icon={<Info className="h-3.5 w-3.5" aria-hidden />}
          body={t(locale, "rbac.publisher.profile.photos.disabled")}
        />
      </Fieldset>

      <label className="flex items-start gap-2.5 text-xs text-[var(--color-text-muted)]">
        <input
          type="checkbox"
          checked={value.acceptTerms}
          onChange={(e) =>
            onChange({ ...value, acceptTerms: e.target.checked })
          }
          className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--color-brand-primary)]"
        />
        <span>{t(locale, "rbac.publisher.profile.terms.lead")}</span>
      </label>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

function validateStep(
  step: WizardStep,
  state: {
    phone: PhoneState;
    otp: string;
    pw: PasswordState;
    profile: ProfileState;
  },
  locale: SupportedLocale,
): string | null {
  if (step === "phone") {
    if (!state.phone.country)
      return t(locale, "rbac.publisher.phone.validation.country");
    if (state.phone.phone.replace(/\D+/g, "").length < 7)
      return t(locale, "rbac.publisher.phone.validation.phone");
    if (!state.phone.email.includes("@"))
      return t(locale, "rbac.publisher.phone.validation.email");
    return null;
  }
  if (step === "otp") {
    if (state.otp.length !== 6)
      return t(locale, "rbac.publisher.otp.validation");
    return null;
  }
  if (step === "password") {
    if (state.pw.password.length < 8)
      return t(locale, "rbac.publisher.password.validation.password");
    if (state.pw.password !== state.pw.confirm)
      return t(locale, "rbac.publisher.password.validation.confirm");
    if (!state.pw.acceptTerms)
      return t(locale, "rbac.publisher.password.validation.terms");
    return null;
  }
  // profile
  const p = state.profile;
  if (!p.state || !p.city || !p.category)
    return t(locale, "rbac.publisher.profile.validation.required");
  if (p.title.trim().length < 40)
    return t(locale, "rbac.publisher.profile.validation.titleMin");
  if (p.description.trim().length < 80)
    return t(locale, "rbac.publisher.profile.validation.descriptionMin");
  if (
    !p.contactEmail &&
    !p.contactPhone &&
    !p.contactWhatsapp &&
    !p.contactTelegram
  )
    return t(locale, "rbac.publisher.profile.validation.contact");
  if (!p.acceptTerms)
    return t(locale, "rbac.publisher.profile.validation.terms");
  return null;
}

/* -------------------------------------------------------------------------- */
/* Tiny field helpers                                                         */
/* -------------------------------------------------------------------------- */

function inputCls() {
  return "h-12 w-full appearance-none rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30";
}

function FormField({
  id,
  label,
  icon,
  className,
  children,
}: Readonly<{
  id: string;
  label: string;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}>) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`.trim()}>
      <label
        htmlFor={id}
        className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]"
      >
        {label}
      </label>
      {icon ? (
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)]"
          >
            {icon}
          </span>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function Fieldset({
  legend,
  children,
}: Readonly<{ legend: string; children: React.ReactNode }>) {
  return (
    <fieldset className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-background-elevated)]/50 p-4">
      <legend className="px-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-primary)]">
        {legend}
      </legend>
      {children}
    </fieldset>
  );
}

function DisabledNotice({
  icon,
  body,
}: Readonly<{ icon: React.ReactNode; body: string }>) {
  return (
    <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-brand-accent)]/30 bg-[var(--color-brand-accent)]/10 px-3 py-2 text-xs text-[var(--color-foreground)]">
      <span className="mt-0.5 text-[var(--color-brand-accent-strong)]">
        {icon}
      </span>
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

// Keep MessageSquare reachable for future inline help blocks.
void MessageSquare;
