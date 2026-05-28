"use client";

import { motion, type Variants } from "framer-motion";
import { Gift, UserCircle, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

import { InstallAppPill } from "./InstallAppPill";

interface TabDef {
  id: string;
  label: string;
  icon: LucideIcon;
  content: ReactNode;
}

interface DashboardShellProps {
  /** Display name shown in the welcome eyebrow. */
  greetingName: string;
  tabs: Readonly<{
    profile: ReactNode;
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
 * Two-tab seller dashboard shell — Mi perfil / Invitar.
 *
 * Active tab tracked in component state (client-only). Tab content is
 * passed in as ReactNode so each tab can be a Server-Component subtree
 * with its own data fetch, while the tab strip + animations live in
 * this client wrapper.
 */
export function DashboardShell({
  greetingName,
  tabs,
}: Readonly<DashboardShellProps>) {
  const TABS: ReadonlyArray<TabDef> = [
    {
      id: "profile",
      label: "Mi perfil",
      icon: UserCircle,
      content: tabs.profile,
    },
    {
      id: "referrals",
      label: "Invitar",
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
          Mi cuenta
        </span>
        <h1 className="font-[var(--font-display)] text-[clamp(28px,3.4vw,38px)] font-[370] leading-[1.05] tracking-[-0.025em] text-[var(--color-foreground)]">
          Hola,{" "}
          <span className="italic font-[340] text-[var(--color-brand-primary)]">
            {greetingName}
          </span>
          .
        </h1>
        <p className="max-w-2xl font-[var(--font-serif)] text-[15px] leading-[1.55] text-[var(--color-text-muted)]">
          Aquí editás tu perfil e invitás a otras modelos. Discreto, sin
          notificaciones invasivas — vos decidís cuándo entrar.
        </p>
      </header>

      {/* Surfaces only when the browser fires `beforeinstallprompt` —
          invisible by default, so it never feels like a nag. */}
      <InstallAppPill />

      <div
        role="tablist"
        aria-label="Secciones del panel"
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
