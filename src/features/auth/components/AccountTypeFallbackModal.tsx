"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { Lock, MessageSquare, UserCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";
import { setAccountType } from "@/features/auth/actions/set-account-type";
import {
  ACCOUNT_TYPE_COMMENTATOR,
  ACCOUNT_TYPE_PUBLISHER,
  type AccountType,
} from "@/features/auth/lib/rbac";

interface AccountTypeFallbackModalProps {
  /**
   * Server-side decision: render the modal if true.
   * The page that renders this component owns the condition (typically
   * "session has no role AND cookie is missing").
   */
  open: boolean;
}

const OVERLAY: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

const PANEL: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.98,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
};

/**
 * Post-OAuth fallback modal (ADR-018 § "Account-type cookie on Google
 * sign-in").
 *
 * Surfaces when a returning user lands on a protected dashboard but
 * the system has no idea which surface they want — typically because
 * they signed in via Google without ever visiting `/registrarse` or
 * the new `/ingresar` gate (older sessions, recovered cookies, etc.).
 *
 * Pick → `setAccountType` Server Action writes the cookie AND grants
 * the matching `Role.Commentator` / `Role.Model` (server-side, since
 * the user is already authenticated). Then `router.refresh()` so the
 * page re-renders with the correct surface (publisher vs commentator
 * dashboard).
 *
 * NOT dismissable — the dashboard is meaningless without a role
 * choice, so we hold the user here until they pick. They can sign out
 * via the header if they don't want to choose.
 */
export function AccountTypeFallbackModal({
  open,
}: Readonly<AccountTypeFallbackModalProps>) {
  const router = useRouter();
  const locale = useActiveLocale();
  const [pending, setPending] = useState<AccountType | null>(null);
  /**
   * Surface for the ADR-019 `account-type-locked` refusal. Set when the
   * user picks a type that conflicts with their persisted lock — a state
   * that should NOT normally reach the modal (the modal only renders for
   * accounts with no doc), but can race during the modal's render window
   * if another tab locked the doc first. Showing the message lets the
   * user understand why nothing happened.
   */
  const [lockedAs, setLockedAs] = useState<AccountType | null>(null);

  // Body scroll lock while the modal is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

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
          // ADR-019 — the doc was locked to the opposite type by
          // another path (other tab, lazy migration). Surface the lock
          // so the user understands and can act (sign out + new
          // account, or close the modal). We deliberately do NOT
          // refresh — refresh would re-trigger the modal because the
          // locked doc may not yet be visible to this render.
          setLockedAs(result.error.currentAccountType);
          setPending(null);
          return;
        }
        console.error("[auth] account-type fallback failed", result.error);
        setPending(null);
        return;
      }
      // Refresh — the page will re-read the doc and either close the
      // modal (publisher path) or redirect to `/mi-cuenta/comentarios`
      // (commentator path).
      router.refresh();
    } catch (err) {
      console.error("[auth] account-type fallback threw", err);
      setPending(null);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          variants={OVERLAY}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-type-fallback-title"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
        >
          <motion.div
            variants={PANEL}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative flex w-full max-w-lg flex-col gap-5 overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-[var(--color-foreground)] shadow-[var(--shadow-2xl)] sm:p-8"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)]/55 to-transparent"
            />
            <div className="flex flex-col gap-2">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-brand-primary)]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/25">
                {t(locale, "auth.signin.kicker")}
              </span>
              <h2
                id="account-type-fallback-title"
                className="font-[var(--font-display)] text-xl font-[420] leading-[1.2] tracking-[-0.01em]"
              >
                {t(locale, "auth.signin.gate.modal.title")}
              </h2>
              <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                {t(locale, "auth.signin.gate.modal.body")}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FallbackCard
                tone="primary"
                icon={<UserCheck className="h-5 w-5" aria-hidden />}
                title={t(locale, "auth.signin.gate.partner.title")}
                body={t(locale, "auth.signin.gate.partner.body")}
                loading={pending === ACCOUNT_TYPE_PUBLISHER}
                disabled={pending !== null || lockedAs !== null}
                onPick={() => pick(ACCOUNT_TYPE_PUBLISHER)}
              />
              <FallbackCard
                tone="muted"
                icon={<MessageSquare className="h-5 w-5" aria-hidden />}
                title={t(locale, "auth.signin.gate.client.title")}
                body={t(locale, "auth.signin.gate.client.body")}
                loading={pending === ACCOUNT_TYPE_COMMENTATOR}
                disabled={pending !== null || lockedAs !== null}
                onPick={() => pick(ACCOUNT_TYPE_COMMENTATOR)}
              />
            </div>

            {lockedAs !== null ? (
              <LockedNotice locale={locale} currentAccountType={lockedAs} />
            ) : null}

            {/* No close button — the dashboard is meaningless without a pick.
                The header sign-out is the escape hatch. We expose a visually
                muted "X" only to satisfy a11y expectations; it just reloads
                the page (same as refresh), which will re-render the modal
                until the user actually picks. */}
            <button
              type="button"
              aria-label={t(locale, "auth.alreadySignedIn.signOut")}
              onClick={() => router.refresh()}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-background-elevated)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

interface FallbackCardProps {
  tone: "primary" | "muted";
  icon: React.ReactNode;
  title: string;
  body: string;
  loading: boolean;
  disabled: boolean;
  onPick: () => void;
}

function FallbackCard({
  tone,
  icon,
  title,
  body,
  loading,
  disabled,
  onPick,
}: Readonly<FallbackCardProps>) {
  const surface =
    tone === "primary"
      ? "border-[var(--color-brand-primary)]/40 shadow-[var(--shadow-glow-primary)]"
      : "border-[var(--color-border)] shadow-[var(--shadow-sm)]";
  const iconTile =
    tone === "primary"
      ? "bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/30"
      : "bg-[var(--color-background-elevated)] text-[var(--color-foreground)] ring-1 ring-[var(--color-border)]";

  return (
    <button
      type="button"
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
      <span className="font-[var(--font-display)] text-[15px] font-[420] leading-[1.15] tracking-[-0.01em] text-[var(--color-foreground)]">
        {title}
      </span>
      <span className="text-xs leading-relaxed text-[var(--color-text-muted)]">
        {body}
      </span>
      {loading ? (
        <span className="text-[11px] font-semibold text-[var(--color-brand-primary)]">
          …
        </span>
      ) : null}
    </button>
  );
}

/**
 * Reusable copy block shown when `setAccountType` returns
 * `error.kind === 'account-type-locked'`. The message is i18n-keyed
 * (not piped through from the server) so English users see English
 * even though the Server Action returns Spanish in `error.message`.
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
