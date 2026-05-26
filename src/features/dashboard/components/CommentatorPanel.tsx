"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Heart,
  KeyRound,
  LogOut,
  MessageSquare,
  ShieldAlert,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";
import { useAuthSession } from "@/features/auth/lib/use-auth-session";

type PanelSection = "favorites" | "comments" | "password" | "delete";

const REVEAL: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

const STAGGER: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

/**
 * Limited dashboard for ROLE_COMMENT_PUBLISHER (PDF page 12).
 *
 * Available sections: Favoritos · Mis comentarios · Cambiar contraseña ·
 * Borrar mi cuenta · Salir del panel. There is intentionally NO
 * "Publicar perfil" affordance — that capability is reserved for
 * ROLE_PROFILE_PUBLISHER. A persistent "cannot publish" card explains the
 * limitation and links to the publisher registration flow.
 */
export function CommentatorPanel() {
  const router = useRouter();
  const locale = useActiveLocale();
  const { signOut } = useAuthSession();
  const [active, setActive] = useState<PanelSection>("favorites");

  async function onSignOut() {
    try {
      await signOut();
      router.push(localizedHref(locale, "/"));
      router.refresh();
    } catch (err) {
      console.error("[commentator-panel] signOut failed", err);
    }
  }

  const items: ReadonlyArray<{
    key: PanelSection;
    label: string;
    icon: LucideIcon;
  }> = [
    {
      key: "favorites",
      label: t(locale, "rbac.commentator.panel.nav.favorites"),
      icon: Heart,
    },
    {
      key: "comments",
      label: t(locale, "rbac.commentator.panel.nav.comments"),
      icon: MessageSquare,
    },
    {
      key: "password",
      label: t(locale, "rbac.commentator.panel.nav.password"),
      icon: KeyRound,
    },
    {
      key: "delete",
      label: t(locale, "rbac.commentator.panel.nav.delete"),
      icon: Trash2,
    },
  ];

  return (
    <motion.div
      variants={STAGGER}
      initial="hidden"
      animate="visible"
      className="grid w-full grid-cols-1 gap-5 md:grid-cols-[260px_1fr]"
    >
      <motion.aside
        variants={REVEAL}
        aria-label={t(locale, "rbac.commentator.panel.section.options")}
        className="flex flex-col gap-1 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-sm)]"
      >
        <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
          {t(locale, "rbac.commentator.panel.section.options")}
        </div>
        <nav className="flex flex-col gap-0.5">
          {items.map((item) => {
            const isActive = active === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActive(item.key)}
                className={`group relative inline-flex h-11 items-center gap-2.5 rounded-full px-3 text-left text-sm font-medium transition-colors duration-200 ease-[var(--ease-standard)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${
                  isActive
                    ? "text-[var(--color-foreground)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-foreground)]"
                }`}
              >
                {/* Shared-element pill — animates between items via layoutId */}
                {isActive ? (
                  <motion.span
                    layoutId="commentator-nav-pill"
                    aria-hidden
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                    }}
                    className="absolute inset-0 -z-10 rounded-full bg-[var(--color-brand-primary)]/12 ring-1 ring-[var(--color-brand-primary)]/30"
                  />
                ) : null}
                <motion.span
                  whileHover={{ rotate: -8 }}
                  transition={{ duration: 0.25 }}
                  className="inline-flex h-4 w-4 items-center justify-center"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </motion.span>
                {item.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={onSignOut}
            className="mt-1 inline-flex h-11 items-center gap-2.5 rounded-full px-3 text-left text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background-elevated)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {t(locale, "rbac.commentator.panel.nav.signOut")}
          </button>
        </nav>
      </motion.aside>

      <motion.section
        variants={REVEAL}
        className="flex flex-col gap-4"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <CommentatorContent section={active} />
          </motion.div>
        </AnimatePresence>
        <CantPublishCard />
      </motion.section>
    </motion.div>
  );
}

function CommentatorContent({ section }: { section: PanelSection }) {
  const locale = useActiveLocale();

  if (section === "favorites") {
    return (
      <EmptySurface
        title={t(locale, "rbac.commentator.panel.nav.favorites")}
        body={t(locale, "rbac.commentator.panel.favorites.empty")}
        icon={<Heart className="h-5 w-5" aria-hidden />}
      />
    );
  }
  if (section === "comments") {
    return (
      <EmptySurface
        title={t(locale, "rbac.commentator.panel.nav.comments")}
        body={t(locale, "rbac.commentator.panel.comments.empty")}
        icon={<MessageSquare className="h-5 w-5" aria-hidden />}
      />
    );
  }
  if (section === "password") {
    return (
      <Surface title={t(locale, "rbac.commentator.panel.nav.password")}>
        <div className="flex flex-col gap-3">
          <input
            type="password"
            placeholder={t(locale, "auth.signin.field.password.placeholder")}
            disabled
            className="h-12 w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] disabled:cursor-not-allowed disabled:opacity-60"
          />
          <input
            type="password"
            placeholder={t(locale, "rbac.commentator.field.passwordConfirm.placeholder")}
            disabled
            className="h-12 w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="button"
            disabled
            className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] opacity-60"
          >
            {t(locale, "rbac.commentator.panel.success.updated")}
          </button>
        </div>
      </Surface>
    );
  }
  // delete
  return (
    <Surface
      title={t(locale, "rbac.commentator.panel.dialog.delete.title")}
      tone="danger"
    >
      <p className="text-sm text-[var(--color-text-muted)]">
        {t(locale, "rbac.commentator.panel.dialog.delete.body")}
      </p>
      <p className="text-[11px] text-[var(--color-text-subtle)]">
        {t(locale, "rbac.commentator.panel.dialog.delete.disabled")}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-brand-highlight)] px-4 text-xs font-semibold text-[var(--color-surface)] opacity-60"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          {t(locale, "rbac.commentator.panel.dialog.delete.confirm")}
        </button>
        <button
          type="button"
          disabled
          className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--color-border)] px-4 text-xs font-semibold text-[var(--color-foreground)] opacity-60"
        >
          {t(locale, "rbac.commentator.panel.dialog.delete.cancel")}
        </button>
      </div>
    </Surface>
  );
}

function Surface({
  title,
  tone = "default",
  children,
}: Readonly<{
  title: string;
  tone?: "default" | "danger";
  children: React.ReactNode;
}>) {
  const surface =
    tone === "danger"
      ? "border-[var(--color-brand-highlight)]/30 bg-[var(--color-brand-highlight)]/5"
      : "border-[var(--color-border)] bg-[var(--color-surface)]";
  return (
    <div
      className={`flex flex-col gap-3 rounded-[var(--radius-2xl)] border p-5 shadow-[var(--shadow-sm)] ${surface}`}
    >
      <h2 className="font-[var(--font-display)] text-lg font-[420] tracking-tight text-[var(--color-foreground)]">
        {title}
      </h2>
      {children}
    </div>
  );
}

function EmptySurface({
  title,
  body,
  icon,
}: Readonly<{ title: string; body: string; icon: React.ReactNode }>) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-2xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/60 p-10 text-center">
      <span
        aria-hidden
        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/20"
      >
        {icon}
      </span>
      <h2 className="font-[var(--font-display)] text-xl font-[420] tracking-tight text-[var(--color-foreground)]">
        {title}
      </h2>
      <p className="max-w-sm text-sm text-[var(--color-text-muted)]">{body}</p>
    </div>
  );
}

/**
 * Informational notice on the commentator dashboard. No CTA — the
 * accountType lock is immutable (ADR-019), so the only "next step"
 * for someone who wants to publish is to register a new account with
 * a different email. The body says exactly that; offering a button
 * here would be misleading because every wizard target now refuses
 * the navigation via `AccountTypeLockedScreen`.
 */
function CantPublishCard() {
  const locale = useActiveLocale();
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-2xl)] border border-[var(--color-brand-accent)]/30 bg-[var(--color-brand-accent)]/8 p-5 text-[var(--color-foreground)]">
      <span
        aria-hidden
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-brand-accent)]/20 text-[var(--color-brand-accent-strong)] ring-1 ring-[var(--color-brand-accent)]/35"
      >
        <ShieldAlert className="h-4.5 w-4.5" aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="font-[var(--font-display)] text-base font-[420] tracking-tight">
          {t(locale, "rbac.commentator.panel.cantPublish.title")}
        </h3>
        <p className="text-xs text-[var(--color-text-muted)]">
          {t(locale, "rbac.commentator.panel.cantPublish.body")}
        </p>
      </div>
    </div>
  );
}
