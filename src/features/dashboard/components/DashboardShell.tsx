"use client";

import { motion, type Variants } from "framer-motion";
import {
  Calendar,
  Gift,
  Inbox,
  UserCircle,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { useLocale } from "@/core/i18n/LocaleProvider";
import { t } from "@/core/i18n/messages";

import { InstallAppPill } from "./InstallAppPill";

interface TabDef {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  content: ReactNode;
}

interface DashboardShellProps {
  /** Display name shown in the welcome eyebrow. */
  greetingName: string;
  /** Optional badge of unread / pending bookings shown beside the tab. */
  pendingCount?: number;
  tabs: Readonly<{
    inbox: ReactNode;
    profile: ReactNode;
    agenda: ReactNode;
    referrals: ReactNode;
  }>;
}

const REVEAL: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * Three-tab seller dashboard shell — Solicitudes / Mi perfil / Agenda.
 *
 * Active tab tracked in component state (client-only). Tab content is
 * passed in as ReactNode so each tab can be a Server-Component subtree
 * with its own data fetch, while the tab strip + animations live in
 * this client wrapper. Switching tabs slides the panel in from the
 * right with a soft blur — mirrors the gallery vocabulary used
 * elsewhere on the site.
 */
export function DashboardShell({
  greetingName,
  pendingCount = 0,
  tabs,
}: Readonly<DashboardShellProps>) {
  const locale = useLocale();
  const TABS: ReadonlyArray<TabDef> = [
    {
      id: "inbox",
      label: t(locale, "dashboard.tab.requests"),
      icon: Inbox,
      badge: pendingCount > 0 ? pendingCount : undefined,
      content: tabs.inbox,
    },
    {
      id: "profile",
      label: t(locale, "dashboard.tab.profile"),
      icon: UserCircle,
      content: tabs.profile,
    },
    {
      id: "agenda",
      label: t(locale, "dashboard.tab.schedule"),
      icon: Calendar,
      content: tabs.agenda,
    },
    {
      id: "referrals",
      label: t(locale, "dashboard.tab.invite"),
      icon: Gift,
      content: tabs.referrals,
    },
  ];

  const [activeId, setActiveId] = useState<string>(TABS[0]!.id);
  const active = TABS.find((t) => t.id === activeId) ?? TABS[0]!;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-brand-primary)]">
          <span
            aria-hidden
            className="inline-block h-px w-8 bg-gradient-to-r from-[var(--color-gold)] to-transparent"
          />
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--color-gold)] shadow-[0_0_0_3px_rgba(200,166,118,0.18)]"
          />
          {t(locale, "dashboard.title")}
        </span>
        <h1 className="font-[var(--font-display)] text-[clamp(28px,3.4vw,38px)] font-[370] leading-[1.05] tracking-[-0.025em] text-[var(--color-foreground)]">
          {(() => {
            const tpl = t(locale, "dashboard.greeting", { name: "__N__" });
            const [before, after] = tpl.split("__N__");
            return (
              <>
                {before}
                <span className="italic font-[340] text-[var(--color-brand-primary)]">
                  {greetingName}
                </span>
                {after}
              </>
            );
          })()}
        </h1>
        <p className="max-w-2xl font-[var(--font-serif)] text-[15px] leading-[1.55] text-[var(--color-text-muted)]">
          {t(locale, "dashboard.intro")}
        </p>
      </header>

      {/* Surfaces only when the browser fires `beforeinstallprompt` —
          invisible by default, so it never feels like a nag. */}
      <InstallAppPill />

      <div
        role="tablist"
        aria-label={t(locale, "dashboard.tablistAria")}
        className="flex flex-wrap items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-1 backdrop-blur-sm sm:w-fit"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeId;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`dashboard-panel-${tab.id}`}
              id={`dashboard-tab-${tab.id}`}
              onClick={() => setActiveId(tab.id)}
              className={`relative inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors duration-200 ease-[var(--ease-standard)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] ${
                isActive
                  ? "bg-[var(--color-brand-primary)] text-[var(--color-surface)] shadow-[var(--shadow-sm)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-background-elevated)] hover:text-[var(--color-foreground)]"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  aria-label={t(locale, "dashboard.pendingBadge", {
                    count: tab.badge,
                  })}
                  className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums ${
                    isActive
                      ? "bg-[var(--color-surface)] text-[var(--color-brand-primary)]"
                      : "bg-[var(--color-brand-highlight)] text-[var(--color-surface)]"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <motion.section
        key={active.id}
        role="tabpanel"
        id={`dashboard-panel-${active.id}`}
        aria-labelledby={`dashboard-tab-${active.id}`}
        variants={REVEAL}
        initial="hidden"
        animate="visible"
      >
        {active.content}
      </motion.section>
    </div>
  );
}
