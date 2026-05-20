"use client";

import {
  Check,
  Copy,
  MessageCircle,
  Send,
  Share2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useLocale } from "@/core/i18n/LocaleProvider";
import { t } from "@/core/i18n/messages";

interface ShareMenuProps {
  /** Pre-formatted absolute URL to share. Server provides this so it's
   *  canonical, not host-relative — important for messaging apps. */
  url: string;
  /** Profile name used to build the message body. */
  name: string;
  /** Short call-to-action used as the message preamble. */
  preamble?: string;
}

const COPY_FEEDBACK_MS = 1800;

/**
 * Three-channel share popover for the profile page.
 *
 * - **Native share** (mobile): tries `navigator.share` first when available.
 *   Falls back to the inline menu if the user dismisses or the API is missing.
 * - **WhatsApp / Telegram**: deep-links via `wa.me` / `t.me/share/url` —
 *   pre-fills the message with the listing name and URL. No SDKs.
 * - **Copy link**: writes the URL to the clipboard and shows a 1.8s "Copiado"
 *   confirmation. Falls back to a `document.execCommand` legacy path on
 *   browsers without `navigator.clipboard`.
 *
 * Dismissal: outside-click, Escape, focus-loss. Re-opening focuses the first
 * channel button so keyboard users land in the menu, not on the trigger.
 */
export function ShareMenu({
  url,
  name,
  preamble,
}: Readonly<ShareMenuProps>) {
  const locale = useLocale();
  const resolvedPreamble = preamble ?? t(locale, "share.preamble");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const firstActionRef = useRef<HTMLAnchorElement>(null);

  const message = `${resolvedPreamble} ${name} — ${url}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const tgHref = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`${resolvedPreamble} ${name}`)}`;

  // Outside-click + Escape close the menu.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Move focus to the first action when the menu opens.
  useEffect(() => {
    if (open) firstActionRef.current?.focus();
  }, [open]);

  async function handleClick() {
    // Try native share first; if the user dismisses or the API is missing,
    // fall through to the inline menu.
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: t(locale, "share.nativeTitle", { name }),
          text: `${resolvedPreamble} ${name}`,
          url,
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to the popover menu.
      }
    }
    setOpen((prev) => !prev);
  }

  async function copyLink() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Legacy fallback for old browsers without the async clipboard API.
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    } catch {
      // Clipboard blocked — leave the menu open so the user can long-press the URL.
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        data-testid="share-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleClick}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-foreground)] transition-[border-color,background] duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        <Share2 className="h-4 w-4" aria-hidden />
        {t(locale, "share.button")}
      </button>

      {open && (
        <div
          role="menu"
          data-testid="share-menu-popover"
          className="absolute right-0 top-12 z-30 flex w-56 flex-col gap-1 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-[var(--shadow-md)]"
        >
          <a
            ref={firstActionRef}
            role="menuitem"
            data-testid="share-menu-whatsapp"
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-background-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
          >
            <MessageCircle
              className="h-4 w-4 text-[var(--color-brand-primary)]"
              aria-hidden
            />
            WhatsApp
          </a>
          <a
            role="menuitem"
            data-testid="share-menu-telegram"
            href={tgHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-background-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
          >
            <Send
              className="h-4 w-4 text-[var(--color-brand-primary)]"
              aria-hidden
            />
            Telegram
          </a>
          <button
            type="button"
            role="menuitem"
            data-testid="share-menu-copy"
            onClick={copyLink}
            className="inline-flex items-center justify-between gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-background-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
          >
            <span className="inline-flex items-center gap-2.5">
              {copied ? (
                <Check
                  className="h-4 w-4 text-[var(--color-brand-primary)]"
                  aria-hidden
                />
              ) : (
                <Copy
                  className="h-4 w-4 text-[var(--color-brand-primary)]"
                  aria-hidden
                />
              )}
              {copied ? t(locale, "share.copied") : t(locale, "share.copyLink")}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
