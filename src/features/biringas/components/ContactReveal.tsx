"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";
import { useAuthSession } from "@/features/auth/lib/use-auth-session";
import { revealContact } from "@/features/biringas/actions/reveal-contact";
import type { ContactChannel } from "@/server/biringas";
import { Button } from "@/shared/design-system/components/Button";

interface PrivateContact {
  privatePhone?: string;
  privateWhatsapp?: string;
}

interface ContactRevealProps {
  slug: string;
  listingName: string;
  contactChannels: ReadonlyArray<ContactChannel>;
}

type RevealState =
  | { kind: "loading" }
  | { kind: "revealed"; data: PrivateContact }
  | { kind: "error"; message: string };

export function ContactReveal({
  slug,
  listingName,
  contactChannels,
}: Readonly<ContactRevealProps>) {
  const locale = useActiveLocale();
  const [state, setState] = useState<RevealState>({ kind: "loading" });
  const { status } = useAuthSession();
  const router = useRouter();

  const nextHref = `${localizedHref(locale, "/ingresar")}?next=${encodeURIComponent(
    localizedHref(locale, `/p/${slug}`),
  )}`;

  useEffect(() => {
    if (status === "loading" || status === "anonymous" || status === "disabled") return;
    let cancelled = false;
    void revealContact(slug)
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          if (result.error?.kind === "no-session") {
            router.push(nextHref);
            return;
          }
          setState({ kind: "error", message: t(locale, "contact.reveal.error") });
          return;
        }
        setState({ kind: "revealed", data: result.data ?? {} });
      })
      .catch(() => {
        // The action returns `{ ok: false }` for handled errors; a rejection
        // here is an unexpected throw. Surface it instead of leaving the user
        // stuck on the loading state (no silent failures).
        if (!cancelled) {
          setState({ kind: "error", message: t(locale, "contact.reveal.error") });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [status, slug, locale, nextHref, router]);

  if (status === "anonymous" || status === "disabled") {
    return (
      <Button id="contacto" href={nextHref} variant="primary" size="lg" glow block>
        {t(locale, "contact.reveal.cta")}
      </Button>
    );
  }

  if (state.kind === "loading") {
    return (
      <div id="contacto" className="flex items-center gap-2 text-sm text-[var(--color-text-subtle)]">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        {t(locale, "contact.reveal.revealing")}
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <p id="contacto" role="alert" className="text-xs text-[var(--color-brand-highlight)]">
        {state.message}
      </p>
    );
  }

  return (
    <div id="contacto" className="flex flex-col gap-3">
      <RevealedChannels
        locale={locale}
        listingName={listingName}
        contactChannels={contactChannels}
        contact={state.data}
      />
    </div>
  );
}

interface RevealedChannelsProps {
  locale: SupportedLocale;
  listingName: string;
  contactChannels: ReadonlyArray<ContactChannel>;
  contact: PrivateContact;
}

function RevealedChannels({
  locale,
  listingName,
  contactChannels,
  contact,
}: Readonly<RevealedChannelsProps>) {
  const accepts = new Set(contactChannels);
  const phoneDigits = digitsOnly(contact.privatePhone);
  const whatsappDigits = digitsOnly(contact.privateWhatsapp ?? contact.privatePhone);

  const buttons: Array<{
    key: ContactChannel;
    href: string;
    label: string;
    Icon: typeof MessageCircle;
  }> = [];

  if (accepts.has("whatsapp") && whatsappDigits) {
    const text = encodeURIComponent(
      t(locale, "contact.reveal.whatsappGreeting", { name: listingName }),
    );
    buttons.push({
      key: "whatsapp",
      href: `https://wa.me/${whatsappDigits}?text=${text}`,
      label: t(locale, "contact.reveal.channel.whatsapp"),
      Icon: MessageCircle,
    });
  }
  if (accepts.has("telegram") && phoneDigits) {
    buttons.push({
      key: "telegram",
      href: `https://t.me/+${phoneDigits}`,
      label: t(locale, "contact.reveal.channel.telegram"),
      Icon: Send,
    });
  }

  if (buttons.length === 0) {
    return (
      <div
        role="status"
        className="rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)]"
      >
        {t(locale, "contact.reveal.empty")}
      </div>
    );
  }

  return <RevealedChannelsView locale={locale} buttons={buttons} />;
}

/**
 * Per-channel brand colours so both CTAs read as equal-weight, premium pills
 * (WhatsApp emerald, Telegram slate-blue) instead of one filled + one outline.
 * Channel brand colours intentionally sit outside the design tokens — they
 * belong to WhatsApp/Telegram, not Biringas, and must stay constant in every
 * theme. `--ch-shadow` tints the drop shadow; `--tw-ring-color` the focus ring.
 */
const CHANNEL_STYLE: Record<string, CSSProperties> = {
  whatsapp: {
    backgroundColor: "#0E7A52",
    ["--ch-shadow" as string]: "rgba(14,122,82,0.85)",
    ["--tw-ring-color" as string]: "#0E7A52",
  },
  telegram: {
    backgroundColor: "#2A6F9E",
    ["--ch-shadow" as string]: "rgba(42,111,158,0.85)",
    ["--tw-ring-color" as string]: "#2A6F9E",
  },
  default: {
    backgroundColor: "var(--color-brand-primary)",
    ["--ch-shadow" as string]: "rgba(0,0,0,0.4)",
    ["--tw-ring-color" as string]: "var(--color-brand-primary)",
  },
};

function RevealedChannelsView({
  locale,
  buttons,
}: Readonly<{
  locale: SupportedLocale;
  buttons: ReadonlyArray<{
    key: ContactChannel;
    href: string;
    label: string;
    Icon: typeof MessageCircle;
  }>;
}>) {
  const reduced = useReducedMotion();
  const stagger = reduced ? 0 : 0.06;

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
        {t(locale, "contact.reveal.title")}
      </span>
      <motion.div
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: stagger, delayChildren: 0.05 } },
        }}
      >
        {buttons.map(({ key, href, label, Icon }) => (
          <motion.a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={`contact-reveal-${key}`}
            variants={{
              hidden: { opacity: 0, y: 6 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            style={CHANNEL_STYLE[key] ?? CHANNEL_STYLE.default}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_var(--ch-shadow)] transition-[transform,filter] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] active:translate-y-px"
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </motion.a>
        ))}
      </motion.div>
      {/* Disclaimer — centered in its own quiet panel so it reads as a polished
          house rule, not stranded fine print. */}
      <p className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]/60 px-3 py-2 text-center text-[11px] leading-relaxed text-[var(--color-text-subtle)]">
        {t(locale, "contact.reveal.footer")}
      </p>
    </div>
  );
}

function digitsOnly(value: string | undefined): string {
  if (!value) return "";
  return value.replace(/\D+/g, "");
}
