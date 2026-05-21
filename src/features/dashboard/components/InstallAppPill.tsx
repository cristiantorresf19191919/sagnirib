"use client";

import { motion } from "framer-motion";
import { Download, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Browser-defined event surface for the PWA install prompt. The W3C
 * spec is implemented by Chromium-family browsers but not yet typed
 * in `lib.dom.d.ts`, so we declare the minimum shape we need.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "biringas:install-app:dismissed";

/**
 * Discreet "instalá la app" pill on the seller dashboard.
 *
 * Hooks the browser-provided `beforeinstallprompt` event. The event
 * fires only when the user has met the install heuristic (revisit
 * count, engagement signals) so we never nag — when it arrives, we
 * surface a small pill they can tap to install. Persistence: a
 * dismissal sticks via localStorage; the pill never returns unless
 * the user clears storage.
 *
 * iOS Safari does NOT fire this event (Apple requires the manual
 * "Share → Add to Home Screen" path). We could add a Safari-specific
 * tooltip later; for v1 we keep silence over noise.
 */
export function InstallAppPill() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      return window.localStorage.getItem(DISMISSED_KEY) === "1";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    function onBeforeInstall(e: Event) {
      // Stop Chrome's default mini-infobar so we can surface our own.
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferred(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
  };

  const handleInstall = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
      }
    } finally {
      setDeferred(null);
    }
  };

  if (installed || dismissed || !deferred) return null;

  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-wrap items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/8 p-4"
    >
      <span
        aria-hidden
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)] text-[var(--color-surface)]"
      >
        <Smartphone className="h-5 w-5" aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-sm font-semibold text-[var(--color-foreground)]">
          Instalá Biringas en tu pantalla de inicio
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          Abrí el panel con un toque, sin pasar por el navegador. Discreto:
          ningún icono que diga &ldquo;Biringas&rdquo; más allá del que vos elijas
          renombrar.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleInstall}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--color-brand-primary)] px-4 text-xs font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          Instalar
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Descartar"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </motion.div>
  );
}
