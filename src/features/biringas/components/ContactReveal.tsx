"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Loader2, MessageCircle, Phone, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";
import { useAuthSession } from "@/features/auth/lib/use-auth-session";
import { revealContact } from "@/features/biringas/actions/reveal-contact";
import type { ContactChannel } from "@/server/biringas";

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
    void revealContact(slug).then((result) => {
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
    });
    return () => { cancelled = true; };
  }, [status, slug, locale, nextHref, router]);

  if (status === "anonymous" || status === "disabled") {
    return (
      <a
        id="contacto"
        href={nextHref}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-sm)] transition-[background,transform] duration-200 ease-[var(--ease-standard)] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        {t(locale, "contact.reveal.cta")}
      </a>
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

interface PrivateContact {
  privatePhone?: string;
  privateWhatsapp?: string;
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
        id="contacto"
        role="status"
        className="rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)]"
      >
        {t(locale, "contact.reveal.empty")}
      </div>
    );
  }

  return <RevealedChannelsView locale={locale} buttons={buttons} />;
}

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
    <div id="contacto" className="flex flex-col gap-3">
      <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
        {t(locale, "contact.reveal.title")}
      </span>
      <motion.div
        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: stagger, delayChildren: 0.05 } },
        }}
      >
        {buttons.map(({ key, href, label, Icon }, idx) => (
          <motion.a
            key={key}
            href={href}
            target={key === "llamada" ? undefined : "_blank"}
            rel={key === "llamada" ? undefined : "noopener noreferrer"}
            data-testid={`contact-reveal-${key}`}
            variants={{
              hidden: { opacity: 0, y: 6 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className={
              idx === 0
                ? "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-sm)] transition-[background,transform] duration-200 ease-[var(--ease-standard)] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] active:translate-y-px"
                : "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-sm font-semibold text-[var(--color-foreground)] transition-[background,border-color] duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
            }
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </motion.a>
        ))}
      </motion.div>
      <p className="text-xs text-[var(--color-text-subtle)]">
        {t(locale, "contact.reveal.footer")}
      </p>
    </div>
  );
}

function digitsOnly(value: string | undefined): string {
  if (!value) return "";
  return value.replace(/\D+/g, "");
}
