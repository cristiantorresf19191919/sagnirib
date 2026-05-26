import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import {
  ACCOUNT_TYPE_COMMENTATOR,
  type AccountType,
} from "@/features/auth/lib/rbac";

interface AccountTypeLockedScreenProps {
  locale: SupportedLocale;
  /**
   * The accountType currently locked on `users/{uid}.accountType`. Used
   * to phrase the refusal copy ("tu cuenta es cliente" vs "tu cuenta es
   * Partner") so the user knows what they have, not just what they
   * cannot become.
   */
  currentAccountType: AccountType;
}

/**
 * Full-page refusal surface for the registration flows when the visitor
 * is already authenticated AND their `users/{uid}.accountType` is
 * locked to the opposite of the chosen wizard.
 *
 * ADR-019 declares `accountType` write-once / immutable. The chooser at
 * `/registrarse` already gates this via `setAccountType` → returns
 * `account-type-locked` → renders an inline `LockedNotice`. But the
 * wizard pages (`/registrarse/publicador`, `/registrarse/comentarios`)
 * were reachable by direct URL with no equivalent gate, so the user
 * could fill the entire wizard and submit — at which point the wizard
 * silently skipped `signUpWithEmail` (because the session already
 * existed) and routed back to `/mi-cuenta` with no state change. This
 * screen is the gate that closes that hole.
 */
export function AccountTypeLockedScreen({
  locale,
  currentAccountType,
}: Readonly<AccountTypeLockedScreenProps>) {
  const message =
    currentAccountType === ACCOUNT_TYPE_COMMENTATOR
      ? t(locale, "auth.accountType.locked.asClient")
      : t(locale, "auth.accountType.locked.asPartner");
  const dashboardHref = localizedHref(locale, "/mi-cuenta");

  return (
    <div
      role="alert"
      className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 rounded-[var(--radius-2xl)] border border-[var(--color-brand-warn)]/30 bg-[var(--color-brand-warn)]/8 p-8 text-center shadow-[var(--shadow-md)]"
    >
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-warn)]/15 text-[var(--color-brand-warn)]">
        <Lock className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="font-[var(--font-display)] text-2xl font-[420] leading-tight tracking-tight text-[var(--color-foreground)]">
        {t(locale, "auth.accountType.locked.title")}
      </h2>
      <p className="max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
        {message}
      </p>
      <Link
        href={dashboardHref}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-colors hover:bg-[var(--color-brand-primary-strong)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        {t(locale, "auth.accountType.locked.backToDashboard")}
      </Link>
    </div>
  );
}
