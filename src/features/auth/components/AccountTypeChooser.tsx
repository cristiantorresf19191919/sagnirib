"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useState } from "react";

import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";
import { setAccountType } from "@/features/auth/actions/set-account-type";
import {
  ACCOUNT_TYPE_COMMENTATOR,
  ACCOUNT_TYPE_PUBLISHER,
  type AccountType,
} from "@/features/auth/lib/rbac";

const REVEAL: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

const STAGGER: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};

/**
 * Two-card account-type chooser.
 *
 * The entire registration journey forks here. Picking a card writes the
 * `biringas:account-type` cookie via Server Action and routes the visitor
 * to the matching wizard. The cookie persists so that later refreshes /
 * direct links to dashboard pages still know which surface to render
 * before Firebase custom claims arrive.
 */
export function AccountTypeChooser() {
  const router = useRouter();
  const locale = useActiveLocale();
  const [pending, setPending] = useState<AccountType | null>(null);

  async function pick(accountType: AccountType, nextPath: string) {
    setPending(accountType);
    try {
      await setAccountType(accountType);
      router.push(localizedHref(locale, nextPath));
    } catch (err) {
      console.error("[rbac] setAccountType failed", err);
      setPending(null);
    }
  }

  const signInHref = localizedHref(locale, "/ingresar");

  return (
    <motion.div
      variants={STAGGER}
      initial="hidden"
      animate="visible"
      className="flex w-full flex-col gap-5"
    >
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        <ChooserCard
          variants={REVEAL}
          tone="primary"
          eyebrow={t(locale, "rbac.chooser.publisher.eyebrow")}
          title={t(locale, "rbac.chooser.publisher.title")}
          body={t(locale, "rbac.chooser.publisher.body")}
          icon={<UserCheck className="h-5 w-5" aria-hidden />}
          bullets={[
            t(locale, "rbac.chooser.publisher.bullet.1"),
            t(locale, "rbac.chooser.publisher.bullet.2"),
            t(locale, "rbac.chooser.publisher.bullet.3"),
          ]}
          cta={t(locale, "rbac.chooser.publisher.cta")}
          ctaIcon={<ArrowRight className="h-4 w-4" aria-hidden />}
          recommended={t(locale, "rbac.chooser.recommended")}
          loading={pending === ACCOUNT_TYPE_PUBLISHER}
          disabled={pending !== null}
          onPick={() =>
            pick(ACCOUNT_TYPE_PUBLISHER, "/registrarse/publicador")
          }
        />
        <ChooserCard
          variants={REVEAL}
          tone="muted"
          eyebrow={t(locale, "rbac.chooser.commentator.eyebrow")}
          title={t(locale, "rbac.chooser.commentator.title")}
          body={t(locale, "rbac.chooser.commentator.body")}
          icon={<MessageSquare className="h-5 w-5" aria-hidden />}
          bullets={[
            t(locale, "rbac.chooser.commentator.bullet.1"),
            t(locale, "rbac.chooser.commentator.bullet.2"),
            t(locale, "rbac.chooser.commentator.bullet.3"),
          ]}
          cta={t(locale, "rbac.chooser.commentator.cta")}
          ctaIcon={<ArrowRight className="h-4 w-4" aria-hidden />}
          loading={pending === ACCOUNT_TYPE_COMMENTATOR}
          disabled={pending !== null}
          onPick={() =>
            pick(ACCOUNT_TYPE_COMMENTATOR, "/registrarse/comentarios")
          }
        />
      </div>

      <motion.div
        variants={REVEAL}
        className="flex items-center justify-center gap-2 text-xs text-[var(--color-text-muted)]"
      >
        <ShieldCheck
          className="h-3.5 w-3.5 text-[var(--color-brand-primary)]"
          aria-hidden
        />
        <span>{t(locale, "auth.signin.trustLine")}</span>
      </motion.div>

      <motion.p
        variants={REVEAL}
        className="text-center text-xs text-[var(--color-text-muted)]"
      >
        {t(locale, "rbac.chooser.alreadyAccount")}{" "}
        <Link
          href={signInHref}
          className="font-semibold text-[var(--color-brand-primary)] underline-offset-2 hover:underline"
        >
          {t(locale, "rbac.chooser.signIn")}
        </Link>
      </motion.p>
    </motion.div>
  );
}

interface ChooserCardProps {
  variants: Variants;
  tone: "primary" | "muted";
  eyebrow: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  bullets: ReadonlyArray<string>;
  cta: string;
  ctaIcon: React.ReactNode;
  recommended?: string;
  loading: boolean;
  disabled: boolean;
  onPick: () => void;
}

function ChooserCard({
  variants,
  tone,
  eyebrow,
  title,
  body,
  icon,
  bullets,
  cta,
  ctaIcon,
  recommended,
  loading,
  disabled,
  onPick,
}: Readonly<ChooserCardProps>) {
  const surface =
    tone === "primary"
      ? "border-[var(--color-brand-primary)]/35 bg-[var(--color-surface)] shadow-[var(--shadow-glow-primary)]"
      : "border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]";
  const iconTile =
    tone === "primary"
      ? "bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/30"
      : "bg-[var(--color-background-elevated)] text-[var(--color-foreground)] ring-1 ring-[var(--color-border)]";
  const ctaCls =
    tone === "primary"
      ? "bg-[var(--color-brand-primary)] text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] hover:bg-[var(--color-brand-primary-strong)]"
      : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)]";

  return (
    <motion.button
      variants={variants}
      type="button"
      onClick={onPick}
      disabled={disabled}
      className={`group relative flex h-full flex-col gap-4 overflow-hidden rounded-[var(--radius-2xl)] border p-6 text-left transition-[transform,border-color] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[2px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-70 ${surface}`}
    >
      {tone === "primary" && recommended ? (
        <span
          aria-hidden
          className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-primary)]/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/30"
        >
          <Sparkles className="h-3 w-3" aria-hidden />
          {recommended}
        </span>
      ) : null}

      <span
        aria-hidden
        className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${iconTile}`}
      >
        {icon}
      </span>

      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
          {eyebrow}
        </span>
        <h2 className="font-[var(--font-display)] text-xl font-[420] leading-[1.15] tracking-[-0.01em] text-[var(--color-foreground)]">
          {title}
        </h2>
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          {body}
        </p>
      </div>

      <ul className="flex flex-col gap-1.5 text-xs text-[var(--color-text-muted)]">
        {bullets.map((b) => (
          <li key={b} className="inline-flex items-center gap-2">
            <Check
              className="h-3 w-3 text-[var(--color-brand-primary)]"
              aria-hidden
            />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <span
        className={`mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-[background,transform] duration-200 ease-[var(--ease-standard)] ${ctaCls}`}
      >
        {loading ? "…" : cta}
        {!loading ? ctaIcon : null}
      </span>
    </motion.button>
  );
}
