"use client";

import { Loader2, Lock, MessageCircle, Phone, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

/**
 * Profile-page CTA that reveals the private contact channels of a listing.
 *
 * Flow:
 *   1. Anonymous click → push to `/ingresar?next=/p/<slug>` (same pattern
 *      `/publicar` uses for its auth gate).
 *   2. Authenticated click → calls `revealContact` Server Action. The action
 *      delegates to `getPrivateContact()` which runs `requireAuth()` +
 *      `auditLog("biringa.private_contact.viewed", …)` on every successful
 *      reveal — that audit row is the analytics seed for lister dashboards.
 *   3. On reveal, channel-aware deep links are rendered for whichever
 *      `contactChannels` the listing accepts AND whichever private fields
 *      came back populated.
 *
 * The component never receives the private values until after the action
 * resolves, so the bytes are not present in server-rendered HTML.
 */
export function ContactReveal({
  slug,
  listingName,
  contactChannels,
}: Readonly<ContactRevealProps>) {
  const [state, setState] = useState<RevealState>({ kind: "idle" });
  const { status } = useAuthSession();
  const router = useRouter();

  const nextHref = `/ingresar?next=${encodeURIComponent(`/p/${slug}`)}`;

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
        message: "No pudimos revelar el contacto. Intenta de nuevo.",
      });
      return;
    }
    setState({ kind: "revealed", data: result.data ?? {} });
  }

  if (state.kind === "revealed") {
    return (
      <RevealedChannels
        listingName={listingName}
        contactChannels={contactChannels}
        contact={state.data}
      />
    );
  }

  const isLoading = state.kind === "loading" || status === "loading";

  return (
    <div id="contacto" className="flex flex-col gap-3">
      <BlurredPreview />
      <Button
        onClick={handleReveal}
        variant="primary"
        size="lg"
        glow
        disabled={isLoading}
        aria-label={`Revelar contacto de ${listingName}`}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Revelando…
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" aria-hidden />
            Revelar contacto
          </>
        )}
      </Button>
      <p className="text-xs text-[var(--color-text-subtle)]">
        {status === "authenticated"
          ? "Toca para mostrar los canales privados de este perfil."
          : "Inicia sesión para ver los canales privados de este perfil."}
      </p>
      {state.kind === "error" && (
        <p
          role="alert"
          className="text-xs text-[var(--color-brand-highlight)]"
        >
          {state.message}
        </p>
      )}
    </div>
  );
}

function BlurredPreview() {
  return (
    <div
      aria-hidden
      className="select-none rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] px-4 py-3 ring-1 ring-[var(--color-border)]"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
          Canales privados
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
  listingName: string;
  contactChannels: ReadonlyArray<ContactChannel>;
  contact: PrivateContact;
}

function RevealedChannels({
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
      `Hola ${listingName}, vi tu perfil en Biringas.`,
    );
    buttons.push({
      key: "whatsapp",
      href: `https://wa.me/${whatsappDigits}?text=${text}`,
      label: "WhatsApp",
      Icon: MessageCircle,
    });
  }
  if (accepts.has("llamada") && phoneDigits) {
    buttons.push({
      key: "llamada",
      href: `tel:+${phoneDigits}`,
      label: "Llamar",
      Icon: Phone,
    });
  }
  if (accepts.has("telegram") && phoneDigits) {
    buttons.push({
      key: "telegram",
      href: `https://t.me/+${phoneDigits}`,
      label: "Telegram",
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
        Este perfil no tiene canales públicos disponibles ahora.
      </div>
    );
  }

  return (
    <div id="contacto" className="flex flex-col gap-3">
      <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
        Canales disponibles
      </span>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {buttons.map(({ key, href, label, Icon }, idx) => (
          <a
            key={key}
            href={href}
            target={key === "llamada" ? undefined : "_blank"}
            rel={key === "llamada" ? undefined : "noopener noreferrer"}
            data-testid={`contact-reveal-${key}`}
            className={
              idx === 0
                ? "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-sm)] transition-[background,transform] duration-200 ease-[var(--ease-standard)] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] active:translate-y-px"
                : "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-sm font-semibold text-[var(--color-foreground)] transition-[background,border-color] duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
            }
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </a>
        ))}
      </div>
      <p className="text-xs text-[var(--color-text-subtle)]">
        Saluda con respeto. Toda interacción queda registrada.
      </p>
    </div>
  );
}

function digitsOnly(value: string | undefined): string {
  if (!value) return "";
  return value.replace(/\D+/g, "");
}
