"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type Variants,
} from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Lock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useState, type PointerEvent as ReactPointerEvent } from "react";

import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";
import { setAccountType } from "@/features/auth/actions/set-account-type";
import {
  ACCOUNT_TYPE_COMMENTATOR,
  ACCOUNT_TYPE_PUBLISHER,
  type AccountType,
} from "@/features/auth/lib/rbac";
import { CornerOrnament } from "@/shared/design-system/components/EditorialAtmosphere";

const REVEAL: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const STAGGER: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
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
  /**
   * Lock-error surface (ADR-019). Set when the visitor is already
   * authenticated AND their persisted `accountType` differs from the
   * pick. Prevents the silent "click → push to wizard → wizard fails
   * at submit" UX of the old code.
   */
  const [lockedAs, setLockedAs] = useState<AccountType | null>(null);

  async function pick(accountType: AccountType, nextPath: string) {
    setPending(accountType);
    setLockedAs(null);
    try {
      const result = await setAccountType(accountType);
      if (!result.ok) {
        if (
          result.error?.kind === "account-type-locked" &&
          result.error.currentAccountType
        ) {
          setLockedAs(result.error.currentAccountType);
          setPending(null);
          return;
        }
        console.error("[rbac] setAccountType failed", result.error);
        setPending(null);
        return;
      }
      router.push(localizedHref(locale, nextPath));
    } catch (err) {
      console.error("[rbac] setAccountType threw", err);
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

      {lockedAs !== null ? (
        <motion.div variants={REVEAL}>
          <LockedNotice locale={locale} currentAccountType={lockedAs} />
        </motion.div>
      ) : null}

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
  const reducedMotion = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  // Springs smooth the cursor-tracking spotlight + tilt so the card glides
  // instead of snapping with mouse jitter.
  const sx = useSpring(px, { stiffness: 180, damping: 22, mass: 0.45 });
  const sy = useSpring(py, { stiffness: 180, damping: 22, mass: 0.45 });
  const rotateX = useSpring(useMotionValue(0), {
    stiffness: 220,
    damping: 24,
  });
  const rotateY = useSpring(useMotionValue(0), {
    stiffness: 220,
    damping: 24,
  });
  // Editorial spotlight — picks up the brand-gold tone, sub-15% opacity so
  // it reads as a sheen, not a highlight ring.
  const spotlight = useMotionTemplate`radial-gradient(220px circle at ${sx}px ${sy}px, rgba(200,166,118,0.18), transparent 65%)`;

  function onPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (reducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    px.set(x);
    py.set(y);
    const nx = (x / rect.width) * 2 - 1;
    const ny = (y / rect.height) * 2 - 1;
    rotateY.set(nx * 4);
    rotateX.set(-ny * 4);
  }

  function onPointerLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

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
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      disabled={disabled}
      style={
        reducedMotion
          ? undefined
          : { rotateX, rotateY, transformPerspective: 1000 }
      }
      whileTap={reducedMotion ? undefined : { scale: 0.985 }}
      className={`group relative flex h-full flex-col gap-4 overflow-hidden rounded-[var(--radius-2xl)] border p-6 text-left transition-[border-color,box-shadow] duration-300 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary)]/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-70 ${surface}`}
    >
      {/* Top gold hairline — editorial signature */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)]/55 to-transparent"
      />
      {/* Corner brackets — editorial frame */}
      <CornerOrnament position="top-left" />
      <CornerOrnament position="top-right" />
      <CornerOrnament position="bottom-left" />
      <CornerOrnament position="bottom-right" />
      {/* Cursor-tracked spotlight */}
      {!reducedMotion ? (
        <motion.span
          aria-hidden
          style={{ background: spotlight }}
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      ) : null}
      {/* Shimmer sweep on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/3 block w-1/3 bg-gradient-to-r from-transparent via-[rgba(200,166,118,0.4)] to-transparent opacity-0 group-hover:opacity-100 motion-safe:group-hover:motion-shimmer-sweep"
      />

      {tone === "primary" && recommended ? (
        <motion.span
          aria-hidden
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-primary)]/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/30"
        >
          <motion.span
            animate={{ rotate: [0, 12, 0, -8, 0] }}
            transition={{
              repeat: Infinity,
              repeatDelay: 4,
              duration: 1.4,
              ease: "easeInOut",
            }}
          >
            <Sparkles className="h-3 w-3" aria-hidden />
          </motion.span>
          {recommended}
        </motion.span>
      ) : null}

      <motion.span
        aria-hidden
        whileHover={reducedMotion ? undefined : { scale: 1.08, rotate: -3 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={`relative inline-flex h-11 w-11 items-center justify-center rounded-2xl ${iconTile}`}
      >
        {icon}
      </motion.span>

      <div className="relative flex flex-col gap-2">
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

      <ul className="relative flex flex-col gap-1.5 text-xs text-[var(--color-text-muted)]">
        {bullets.map((b, i) => (
          <motion.li
            key={b}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.18 + i * 0.06,
              duration: 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="inline-flex items-center gap-2"
          >
            <Check
              className="h-3 w-3 text-[var(--color-brand-primary)]"
              aria-hidden
            />
            <span>{b}</span>
          </motion.li>
        ))}
      </ul>

      <motion.span
        whileHover={
          reducedMotion ? undefined : { y: -2, transition: { duration: 0.2 } }
        }
        className={`relative mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-[background] duration-200 ease-[var(--ease-standard)] ${ctaCls}`}
      >
        {loading ? "…" : cta}
        {!loading ? (
          <motion.span
            whileHover={
              reducedMotion ? undefined : { x: 3, transition: { duration: 0.2 } }
            }
          >
            {ctaIcon}
          </motion.span>
        ) : null}
      </motion.span>
    </motion.button>
  );
}

/**
 * Reusable copy block for the ADR-019 lock refusal. Same shape as the
 * one in `SignInGate` and `AccountTypeFallbackModal` — duplicated
 * intentionally so each surface owns its visual treatment.
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
      className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--color-brand-warn)]/30 bg-[var(--color-brand-warn)]/8 p-4 text-[13px] leading-relaxed text-[var(--color-foreground)]"
    >
      <Lock
        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand-warn)]"
        aria-hidden
      />
      <div className="flex flex-col gap-1">
        <span className="font-semibold">
          {t(locale, "auth.accountType.locked.title")}
        </span>
        <span className="text-[var(--color-text-muted)]">{message}</span>
      </div>
    </div>
  );
}
