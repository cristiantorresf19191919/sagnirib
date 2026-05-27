"use client";

import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Lock,
  MessageSquare,
  UserCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";
import { setAccountType } from "@/features/auth/actions/set-account-type";
import {
  ACCOUNT_TYPE_COMMENTATOR,
  ACCOUNT_TYPE_PUBLISHER,
  type AccountType,
} from "@/features/auth/lib/rbac";

import { SignInForm } from "./SignInForm";

interface SignInGateProps {
  /** Server-side cookie value at SSR. If present, gate is open. */
  initialAccountType: AccountType | null;
  /** Forwarded to the wrapped SignInForm. */
  next?: string;
  /**
   * When the caller already knows the user's intent (e.g. they arrived via
   * "Publish Profile"), pass the implied type here. If no prior cookie exists,
   * the fork is skipped and this value is written to the cookie on mount so
   * loginWithIdToken can read it when the sign-in completes.
   */
  suggestedAccountType?: AccountType;
}

const REVEAL: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

const STAGGER: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

/**
 * Sign-in funnel gate (ADR-018 § "Account-type cookie on Google sign-in").
 *
 * Before the user can sign in we ask which surface they are heading to:
 *
 *   - **Cliente** → grants `Role.Commentator` on first login. Lands in
 *     `/mi-cuenta/comentarios`.
 *   - **Partner** → pre-grants `Role.Model` on first login so the
 *     partner dashboard (manage personas, KYC per modelo) renders
 *     immediately, before any listing exists.
 *
 * The pick writes the `biringas:account-type` cookie via the
 * `setAccountType` Server Action; `loginWithIdToken` reads it on the
 * subsequent ID-token push. Without this gate, Google sign-in
 * bypassed the chooser and left the account with no role —
 * indistinguishable from a publisher.
 *
 * If the cookie is already present (returning visitor) we skip the
 * chooser and show the SignInForm directly with a small "Cambiar" pill
 * so the choice is still adjustable from one click away.
 */
export function SignInGate({
  initialAccountType,
  next,
  suggestedAccountType,
}: Readonly<SignInGateProps>) {
  const locale = useActiveLocale();
  const [accountType, setAccountTypeState] = useState<AccountType | null>(
    initialAccountType ?? suggestedAccountType ?? null,
  );

  // When a suggestion is provided and no prior cookie exists, write the cookie
  // on mount. This runs before the user can complete sign-in (which requires
  // a network round-trip), so loginWithIdToken will see the correct value.
  useEffect(() => {
    if (initialAccountType === null && suggestedAccountType != null) {
      setAccountType(suggestedAccountType).catch(() => {
        // Silently swallowed — the AccountTypeFallbackModal handles the
        // undecided case if the write fails.
      });
    }
    // Intentionally runs once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [pending, setPending] = useState<AccountType | null>(null);
  /**
   * Lock-error surface (ADR-019). Set when the caller is already
   * authenticated AND their `users/{uid}.accountType` is locked to a
   * value different from the one just picked. The cookie is NOT
   * updated and the form is held in the chooser state with a copy
   * block explaining what happened.
   */
  const [lockedAs, setLockedAs] = useState<AccountType | null>(null);

  async function pick(type: AccountType) {
    setPending(type);
    setLockedAs(null);
    try {
      const result = await setAccountType(type);
      if (!result.ok) {
        if (
          result.error?.kind === "account-type-locked" &&
          result.error.currentAccountType
        ) {
          setLockedAs(result.error.currentAccountType);
          return;
        }
        console.error("[auth] setAccountType failed", result.error);
        return;
      }
      setAccountTypeState(type);
    } finally {
      setPending(null);
    }
  }

  if (accountType !== null) {
    // Read-only confirmation pill (ADR-019 — the chosen type is
    // immutable once `users/{uid}.accountType` is locked, so there is
    // no "Cambiar" affordance to offer. Anonymous visitors who picked
    // the wrong type can revisit `/registrarse` for the full-screen
    // chooser; authenticated visitors have nothing to change here at
    // all). The pill stays so the user sees which surface the sign-in
    // will land them on.
    return (
      <motion.div
        variants={STAGGER}
        initial="hidden"
        animate="visible"
        className="flex w-full flex-col items-center gap-4"
      >
        <motion.div
          variants={REVEAL}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-[11px] font-semibold text-[var(--color-foreground)] shadow-[var(--shadow-sm)]"
        >
          <ChoiceGlyph accountType={accountType} />
          <span className="text-[var(--color-text-muted)]">
            {t(locale, "auth.signin.gate.continueAs")}
          </span>
          <span className="text-[var(--color-foreground)]">
            {accountType === ACCOUNT_TYPE_PUBLISHER
              ? t(locale, "auth.signin.gate.partner.short")
              : t(locale, "auth.signin.gate.client.short")}
          </span>
        </motion.div>
        <motion.div variants={REVEAL} className="w-full">
          <SignInForm next={next} />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={STAGGER}
      initial="hidden"
      animate="visible"
      className="flex w-full max-w-md flex-col gap-4"
    >
      <motion.span
        variants={REVEAL}
        className="text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-subtle)]"
      >
        {t(locale, "auth.signin.gate.kicker")}
      </motion.span>
      <motion.div
        variants={REVEAL}
        role="radiogroup"
        aria-label={t(locale, "auth.signin.gate.kicker")}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        <GateCard
          tone="primary"
          icon={<UserCheck className="h-5 w-5" aria-hidden />}
          title={t(locale, "auth.signin.gate.partner.title")}
          body={t(locale, "auth.signin.gate.partner.body")}
          loading={pending === ACCOUNT_TYPE_PUBLISHER}
          disabled={pending !== null}
          onPick={() => pick(ACCOUNT_TYPE_PUBLISHER)}
        />
        <GateCard
          tone="muted"
          icon={<MessageSquare className="h-5 w-5" aria-hidden />}
          title={t(locale, "auth.signin.gate.client.title")}
          body={t(locale, "auth.signin.gate.client.body")}
          loading={pending === ACCOUNT_TYPE_COMMENTATOR}
          disabled={pending !== null}
          onPick={() => pick(ACCOUNT_TYPE_COMMENTATOR)}
        />
      </motion.div>
      {lockedAs !== null ? (
        <motion.div variants={REVEAL}>
          <LockedNotice locale={locale} currentAccountType={lockedAs} />
        </motion.div>
      ) : null}
      <motion.p
        variants={REVEAL}
        className="text-center text-[11px] text-[var(--color-text-muted)]"
      >
        {t(locale, "auth.signin.gate.help")}
      </motion.p>
    </motion.div>
  );
}

/**
 * Reusable copy block for the ADR-019 lock refusal. Mirrors the one in
 * `AccountTypeFallbackModal` — kept duplicated (vs imported) because
 * SignInGate is a pure client component with no server boundary while
 * the modal lives in the dashboard's server-render layer.
 */
function LockedNotice({
  locale,
  currentAccountType,
}: Readonly<{
  locale: ReturnType<typeof useActiveLocale>;
  currentAccountType: AccountType;
}>) {
  const message =
    currentAccountType === ACCOUNT_TYPE_COMMENTATOR
      ? t(locale, "auth.accountType.locked.asClient")
      : t(locale, "auth.accountType.locked.asPartner");
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--color-brand-warn)]/30 bg-[var(--color-brand-warn)]/8 p-3 text-[12px] leading-relaxed text-[var(--color-foreground)]"
    >
      <Lock
        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand-warn)]"
        aria-hidden
      />
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold">
          {t(locale, "auth.accountType.locked.title")}
        </span>
        <span className="text-[var(--color-text-muted)]">{message}</span>
      </div>
    </div>
  );
}

interface GateCardProps {
  tone: "primary" | "muted";
  icon: React.ReactNode;
  title: string;
  body: string;
  loading: boolean;
  disabled: boolean;
  onPick: () => void;
}

function GateCard({
  tone,
  icon,
  title,
  body,
  loading,
  disabled,
  onPick,
}: Readonly<GateCardProps>) {
  const surface =
    tone === "primary"
      ? "border-[var(--color-brand-primary)]/40 shadow-[var(--shadow-glow-primary)]"
      : "border-[var(--color-border)] shadow-[var(--shadow-md)]";
  const iconTile =
    tone === "primary"
      ? "bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/30"
      : "bg-[var(--color-background-elevated)] text-[var(--color-foreground)] ring-1 ring-[var(--color-border)]";

  return (
    <button
      type="button"
      role="radio"
      aria-checked={false}
      onClick={onPick}
      disabled={disabled}
      className={`group relative flex h-full flex-col gap-2.5 rounded-[var(--radius-xl)] border bg-[var(--color-surface)] p-4 text-left transition-[border-color,transform] duration-200 hover:-translate-y-[1px] hover:border-[var(--color-brand-primary)]/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-70 ${surface}`}
    >
      <span
        aria-hidden
        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconTile}`}
      >
        {icon}
      </span>
      <span className="font-[var(--font-display)] text-base font-[420] leading-[1.15] tracking-[-0.01em] text-[var(--color-foreground)]">
        {title}
      </span>
      <span className="text-xs leading-relaxed text-[var(--color-text-muted)]">
        {body}
      </span>
      <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-brand-primary)] transition-transform duration-200 group-hover:translate-x-0.5">
        {loading ? "…" : null}
        <ArrowRight className="h-3 w-3" aria-hidden />
      </span>
    </button>
  );
}

function ChoiceGlyph({ accountType }: Readonly<{ accountType: AccountType }>) {
  if (accountType === ACCOUNT_TYPE_PUBLISHER) {
    return (
      <UserCheck
        className="h-3.5 w-3.5 text-[var(--color-brand-primary)]"
        aria-hidden
      />
    );
  }
  return (
    <MessageSquare
      className="h-3.5 w-3.5 text-[var(--color-brand-accent-strong)]"
      aria-hidden
    />
  );
}
