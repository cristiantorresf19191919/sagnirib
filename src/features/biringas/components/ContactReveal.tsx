"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2, Lock, MessageCircle, Phone, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "revealed"; data: PrivateContact }
  | { kind: "error"; message: string };

export function ContactReveal({
  slug,
  listingName,
  contactChannels,
}: Readonly<ContactRevealProps>) {
  const locale = useActiveLocale();
  const [state, setState] = useState<RevealState>({ kind: "idle" });
  const { status } = useAuthSession();
  const router = useRouter();

  const nextHref = `${localizedHref(locale, "/ingresar")}?next=${encodeURIComponent(
    localizedHref(locale, `/p/${slug}`),
  )}`;

  async function handleReveal() {
    if (status === "anonymous" || status === "disabled") {
      router.push(nextHref);
      return;
    }
    if (status === "loading") return;

    setState({ kind: "loading" });
    const result = await revealContact(slug);
    if (!result.ok) {
      if (result.error?.kind === "no-session") {
        router.push(nextHref);
        return;
      }
      setState({
        kind: "error",
        message: t(locale, "contact.reveal.error"),
      });
      return;
    }
    setState({ kind: "revealed", data: result.data ?? {} });
  }

  const isLoading = state.kind === "loading" || status === "loading";

  return (
    <div id="contacto" className="flex flex-col gap-3">
      <AnimatePresence mode="wait" initial={false}>
        {state.kind === "revealed" ? (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <RevealedChannels
              locale={locale}
              listingName={listingName}
              contactChannels={contactChannels}
              contact={state.data}
            />
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-3"
          >
            <BlurredPreview locale={locale} />
            <Button
              onClick={handleReveal}
              variant="primary"
              size="lg"
              glow
              disabled={isLoading}
              aria-label={t(locale, "contact.reveal.ariaLabel", {
                name: listingName,
              })}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {t(locale, "contact.reveal.revealing")}
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" aria-hidden />
                  {t(locale, "contact.reveal.cta")}
                </>
              )}
            </Button>
            <p className="text-xs text-[var(--color-text-subtle)]">
              {status === "authenticated"
                ? t(locale, "contact.reveal.hint.authenticated")
                : t(locale, "contact.reveal.hint.anonymous")}
            </p>
            {state.kind === "error" && (
              <p
                role="alert"
                className="text-xs text-[var(--color-brand-highlight)]"
              >
                {state.message}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BlurredPreview({ locale }: { locale: SupportedLocale }) {
  return (
    <div
      aria-hidden
      className="select-none rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] px-4 py-3 ring-1 ring-[var(--color-border)]"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
          {t(locale, "contact.reveal.previewLabel")}
        </span>
        <Lock className="h-3.5 w-3.5 text-[var(--color-text-subtle)]" />
      </div>
      <p className="mt-2 select-none font-mono text-base tracking-[0.2em] text-[var(--color-text-muted)] blur-[5px]">
        +57 300 000 0000
      </p>
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
  if (accepts.has("llamada") && phoneDigits) {
    buttons.push({
      key: "llamada",
      href: `tel:+${phoneDigits}`,
      label: t(locale, "contact.reveal.channel.llamada"),
      Icon: Phone,
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
