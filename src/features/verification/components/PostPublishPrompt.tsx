"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";

import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";

/**
 * Post-publish confirmation banner.
 *
 * Visible only when `?just_published=1` is present (set by the wizard
 * after a successful submission). Draft creation no longer requires
 * KYC — per ADR-018 each person owns its own KYC lifecycle and the
 * gate sits on the admin side at promotion time. The per-person KYC
 * status surfaces on the profile card in this page, so the publisher
 * still sees a "Verificar identidad" CTA for the freshly created
 * profile when its KYC is `not_submitted`.
 */
export function PostPublishPrompt() {
  const router = useRouter();
  const locale = useActiveLocale();
  const params = useSearchParams();
  const visible = params.get("just_published") === "1";

  if (!visible) return null;

  function dismiss() {
    router.replace(localizedHref(locale, "/mi-cuenta"));
    router.refresh();
  }

  return (
    <div className="mb-6 flex items-start gap-3 rounded-[var(--radius-2xl)] border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/8 p-5 text-[var(--color-foreground)] shadow-[var(--shadow-sm)]">
      <span
        aria-hidden
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/30"
      >
        <CheckCircle2 className="h-5 w-5" aria-hidden />
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <h2 className="font-[var(--font-display)] text-base font-[420] tracking-[-0.01em]">
          {t(locale, "rbac.publisher.postPublish.confirm.title")}
        </h2>
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          {t(locale, "rbac.publisher.postPublish.confirm.body")}
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t(locale, "rbac.publisher.postPublish.confirm.dismiss")}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-background-elevated)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
