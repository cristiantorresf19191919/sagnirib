"use client";

import { motion } from "framer-motion";
import {
  Check,
  Copy,
  Gift,
  Share2,
  Sparkles,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";
import { toast } from "@/shared/ui/toast";

import { redeemReferral } from "../actions/redeem-referral";

interface ReferralCardProps {
  code: string;
  redemptions: number;
  creditCop: number;
  hasRedeemed: boolean;
}

const REWARD_AMOUNT = 20_000;

/**
 * Referral surface for the seller dashboard. Three blocks:
 *   1. Your share link + code + Copy / Share buttons
 *   2. Stats — how many people redeemed it + COP credit accrued
 *   3. Redeem someone else's code (anyone can do this once per account)
 *
 * Mocked end-to-end via `redeemReferral` Server Action; the
 * Firestore variant throws a typed `referral-disabled` reason which
 * the wrapper surfaces as friendly copy.
 */
export function ReferralCard({
  code,
  redemptions,
  creditCop,
  hasRedeemed,
}: Readonly<ReferralCardProps>) {
  const locale = useActiveLocale();
  const cop = useMemo(
    () =>
      new Intl.NumberFormat(locale === "en" ? "en-US" : "es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }),
    [locale],
  );
  const rewardLabel = cop.format(REWARD_AMOUNT);
  const [copied, setCopied] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemed, setRedeemed] = useState(hasRedeemed);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const shareUrl =
    typeof window === "undefined"
      ? `https://biringas.netlify.app/?ref=${code}`
      : `${window.location.origin}/?ref=${code}`;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(t(locale, "dashboard.referral.toast.copied"));
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(t(locale, "dashboard.referral.toast.copyError"));
    }
  };

  const onShare = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: t(locale, "dashboard.referral.share.title"),
          text: t(locale, "dashboard.referral.share.text", {
            reward: rewardLabel,
          }),
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled — fall through to copy.
      }
    }
    await onCopy();
  };

  const onRedeemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const normalized = redeemCode.trim().toUpperCase();
    if (normalized.length < 4) {
      setError(t(locale, "dashboard.referral.redeem.validation"));
      return;
    }
    startTransition(async () => {
      const result = await redeemReferral({ code: normalized });
      if (result.ok) {
        setRedeemed(true);
        toast.success(
          t(locale, "dashboard.referral.redeem.toastTitle"),
          t(locale, "dashboard.referral.redeem.toastBody", {
            amount: cop.format(result.data?.creditCop ?? REWARD_AMOUNT),
          }),
        );
      } else {
        setError(
          result.error?.message ??
            t(locale, "dashboard.referral.redeem.errorFallback"),
        );
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Share card */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-cream-soft)] via-[var(--color-cream)] to-[var(--color-cream-deep)] p-6 shadow-[var(--shadow-md)] sm:p-8"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[radial-gradient(closest-side,rgba(200,166,118,0.32),transparent_70%)] blur-2xl"
        />
        <div className="relative flex flex-col gap-4">
          <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-gold-deep)]">
            <Sparkles className="h-3 w-3" aria-hidden />
            {t(locale, "dashboard.referral.eyebrow")}
          </span>
          <h3 className="font-[var(--font-display)] text-[clamp(20px,2.6vw,28px)] font-[370] leading-[1.1] tracking-[-0.022em] text-[var(--color-foreground)]">
            {t(locale, "dashboard.referral.title.lead")}{" "}
            <span className="italic text-[var(--color-brand-primary)]">
              {rewardLabel}
            </span>{" "}
            {t(locale, "dashboard.referral.title.suffix")}
          </h3>
          <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
            {t(locale, "dashboard.referral.body", { reward: rewardLabel })}
          </p>

          {/* Code + copy + share */}
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
                {t(locale, "dashboard.referral.codeLabel")}
              </span>
              <span className="font-mono text-lg font-bold tabular-nums tracking-[0.16em] text-[var(--color-foreground)]">
                {code}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCopy}
                className="inline-flex h-11 items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-xs font-semibold text-[var(--color-foreground)] transition-colors hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)]"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-[var(--color-brand-primary)]" aria-hidden />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                )}
                {copied
                  ? t(locale, "dashboard.referral.copied")
                  : t(locale, "dashboard.referral.copy")}
              </button>
              <button
                type="button"
                onClick={onShare}
                className="inline-flex h-11 items-center gap-1.5 rounded-full bg-[var(--color-brand-primary)] px-4 text-xs font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)]"
              >
                <Share2 className="h-3.5 w-3.5" aria-hidden />
                {t(locale, "dashboard.referral.share")}
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          label={t(locale, "dashboard.referral.stats.invited")}
          value={String(redemptions)}
          accent="primary"
        />
        <StatCard
          label={t(locale, "dashboard.referral.stats.credit")}
          value={cop.format(creditCop)}
          accent="gold"
        />
      </section>

      {/* Redeem someone else's code */}
      {!redeemed && (
        <section className="rounded-[var(--radius-2xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/60 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/20"
            >
              <Gift className="h-5 w-5" aria-hidden />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--color-foreground)]">
                  {t(locale, "dashboard.referral.redeem.title")}
                </h3>
                <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
                  {t(locale, "dashboard.referral.redeem.body", {
                    reward: rewardLabel,
                  })}
                </p>
              </div>
              <form
                onSubmit={onRedeemSubmit}
                className="flex flex-col gap-2 sm:flex-row sm:items-center"
              >
                <input
                  type="text"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                  placeholder={t(
                    locale,
                    "dashboard.referral.redeem.placeholder",
                  )}
                  maxLength={16}
                  className="h-11 flex-1 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-4 font-mono text-sm uppercase tracking-[0.16em] text-[var(--color-foreground)] placeholder:font-sans placeholder:tracking-normal placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-[var(--color-brand-primary)] px-5 text-xs font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPending
                    ? t(locale, "dashboard.referral.redeem.submitting")
                    : t(locale, "dashboard.referral.redeem.submit")}
                </button>
              </form>
              {error && (
                <p
                  role="alert"
                  className="text-[11px] text-[var(--color-brand-highlight)]"
                >
                  {error}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {redeemed && (
        <section className="rounded-[var(--radius-xl)] border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/8 p-4 text-sm text-[var(--color-foreground)]">
          <span className="inline-flex items-center gap-2">
            <Check
              className="h-4 w-4 text-[var(--color-brand-primary)]"
              aria-hidden
            />
            {t(locale, "dashboard.referral.alreadyRedeemed")}
          </span>
        </section>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  accent: "primary" | "gold";
}

function StatCard({ label, value, accent }: Readonly<StatCardProps>) {
  const accentCls =
    accent === "primary"
      ? "text-[var(--color-brand-primary)]"
      : "text-[var(--color-gold-deep)]";
  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
        {label}
      </span>
      <p
        className={`mt-1 font-[var(--font-display)] text-3xl font-[420] tabular-nums tracking-tight ${accentCls}`}
      >
        {value}
      </p>
    </div>
  );
}
