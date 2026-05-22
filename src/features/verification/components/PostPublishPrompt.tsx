"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Camera,
  CheckCircle2,
  IdCard,
  Info,
  ShieldCheck,
  Video,
  X,
} from "lucide-react";
import { useState } from "react";

import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";
import { PHOTO_VERIFICATION_ENABLED } from "@/features/auth/lib/rbac";

type Step =
  | "banner"
  | "ask"
  | "rules"
  | "verifyStep1"
  | "verifyStep2"
  | "success";

const REVEAL: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  },
};

/**
 * Post-publish verification UI per PDF pages 4, 9, 10.
 *
 * Renders the "perfil bajo moderación" banner, the "¿Querés verificar
 * tus fotos?" yes/no prompt, the rules card, and the two-step
 * verification stub (short video + ID document). Photo capture itself
 * is gated by `PHOTO_VERIFICATION_ENABLED` and runs in optimistic-pass
 * mode while the feature is dark.
 *
 * Visible only when `?just_published=1` is present in the URL (set by
 * `PublisherSignUpWizard` after a successful submission).
 */
export function PostPublishPrompt() {
  const router = useRouter();
  const locale = useActiveLocale();
  const params = useSearchParams();
  const visible = params.get("just_published") === "1";
  const [step, setStep] = useState<Step>("banner");

  if (!visible) return null;

  function dismiss() {
    const href = localizedHref(locale, "/mi-cuenta");
    router.replace(href);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <Banner onDismiss={dismiss} />

      <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-md)] sm:p-6">
        <AnimatePresence mode="wait">
          {step === "banner" || step === "ask" ? (
            <motion.div
              key="ask"
              variants={REVEAL}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center gap-4 text-center"
            >
              <span
                aria-hidden
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/30"
              >
                <Camera className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="font-[var(--font-display)] text-xl font-[420] tracking-tight text-[var(--color-foreground)]">
                {t(locale, "rbac.publisher.postPublish.question")}
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep("rules")}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-6 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)]"
                >
                  {t(locale, "rbac.publisher.postPublish.yes")}
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-6 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)]"
                >
                  {t(locale, "rbac.publisher.postPublish.no")}
                </button>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="text-[11px] font-semibold text-[var(--color-text-subtle)] underline-offset-2 hover:underline"
              >
                {t(locale, "rbac.publisher.postPublish.skip")}
              </button>
            </motion.div>
          ) : null}

          {step === "rules" ? (
            <motion.div
              key="rules"
              variants={REVEAL}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col gap-4"
            >
              <header className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-primary)]">
                    {t(locale, "rbac.publisher.kicker")}
                  </span>
                  <h2 className="mt-1 font-[var(--font-display)] text-xl font-[420] tracking-tight text-[var(--color-foreground)]">
                    {t(locale, "rbac.publisher.postPublish.rules.title")}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={dismiss}
                  aria-label="Cerrar"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-background-elevated)] hover:text-[var(--color-foreground)]"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </header>

              <ol className="flex flex-col gap-2 text-sm text-[var(--color-text-muted)]">
                {[
                  "rbac.publisher.postPublish.rules.1",
                  "rbac.publisher.postPublish.rules.2",
                  "rbac.publisher.postPublish.rules.3",
                  "rbac.publisher.postPublish.rules.4",
                ].map((k, i) => (
                  <li key={k} className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/12 text-[11px] font-semibold text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/20"
                    >
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{t(locale, k)}</span>
                  </li>
                ))}
              </ol>

              <p className="rounded-[var(--radius-md)] border border-[var(--color-brand-highlight)]/30 bg-[var(--color-brand-highlight)]/10 px-3 py-2 text-[12px] text-[var(--color-brand-highlight)]">
                {t(locale, "rbac.publisher.postPublish.rules.delete")}
              </p>
              <p className="text-[11px] text-[var(--color-text-subtle)]">
                {t(locale, "rbac.publisher.postPublish.rules.twoSteps")}
              </p>

              {!PHOTO_VERIFICATION_ENABLED ? (
                <DisabledNotice
                  body={t(locale, "rbac.publisher.postPublish.disabled")}
                />
              ) : null}

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={dismiss}
                  className="inline-flex h-11 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-xs font-semibold text-[var(--color-foreground)] transition-colors hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)]"
                >
                  {t(locale, "rbac.publisher.postPublish.understood")}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("verifyStep1")}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)]"
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  {t(locale, "rbac.publisher.postPublish.next")}
                </button>
              </div>
            </motion.div>
          ) : null}

          {step === "verifyStep1" ? (
            <Step1
              onContinue={() => setStep("verifyStep2")}
              onDismiss={dismiss}
            />
          ) : null}
          {step === "verifyStep2" ? (
            <Step2
              onContinue={() => setStep("success")}
              onDismiss={dismiss}
            />
          ) : null}
          {step === "success" ? <SuccessStep onClose={dismiss} /> : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Banner({ onDismiss }: { onDismiss: () => void }) {
  const locale = useActiveLocale();
  return (
    <div className="flex items-start gap-2.5 rounded-[var(--radius-lg)] border border-[var(--color-brand-accent)]/30 bg-[var(--color-brand-accent)]/10 px-3 py-2.5 text-xs text-[var(--color-foreground)]">
      <Info
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-brand-accent-strong)]"
        aria-hidden
      />
      <span className="leading-relaxed">
        {t(locale, "rbac.publisher.postPublish.banner")}
        <Link
          href="#rules"
          onClick={(e) => {
            e.preventDefault();
            const el = document.getElementById("post-publish-rules");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
          className="font-semibold text-[var(--color-brand-primary)] underline-offset-2 hover:underline"
        >
          {t(locale, "rbac.publisher.postPublish.bannerLink")}
        </Link>
      </span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar"
        className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-subtle)] hover:text-[var(--color-foreground)]"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}

function Step1({
  onContinue,
  onDismiss,
}: {
  onContinue: () => void;
  onDismiss: () => void;
}) {
  const locale = useActiveLocale();
  return (
    <motion.div
      key="step1"
      variants={REVEAL}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col gap-4"
    >
      <header className="flex items-center justify-between gap-3">
        <h2 className="font-[var(--font-display)] text-xl font-[420] tracking-tight text-[var(--color-foreground)]">
          {t(locale, "rbac.publisher.verify.step1.title")}
        </h2>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-subtle)] hover:bg-[var(--color-background-elevated)] hover:text-[var(--color-foreground)]"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </header>

      <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background-elevated)] p-4">
        <span
          aria-hidden
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/30"
        >
          <Video className="h-5 w-5" aria-hidden />
        </span>
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          {t(locale, "rbac.publisher.verify.step1.body")}
        </p>
      </div>
      <p className="rounded-[var(--radius-md)] border border-[var(--color-brand-highlight)]/30 bg-[var(--color-brand-highlight)]/10 px-3 py-2 text-[11px] text-[var(--color-brand-highlight)]">
        {t(locale, "rbac.publisher.verify.step1.warn")}
      </p>
      {!PHOTO_VERIFICATION_ENABLED ? (
        <DisabledNotice
          body={t(locale, "rbac.publisher.postPublish.disabled")}
        />
      ) : null}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)]"
        >
          <Video className="h-4 w-4" aria-hidden />
          {t(locale, "rbac.publisher.verify.step1.cta")}
        </button>
      </div>
    </motion.div>
  );
}

function Step2({
  onContinue,
  onDismiss,
}: {
  onContinue: () => void;
  onDismiss: () => void;
}) {
  const locale = useActiveLocale();
  const [type, setType] = useState<"id" | "passport" | null>(null);
  return (
    <motion.div
      key="step2"
      variants={REVEAL}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col gap-4"
    >
      <header className="flex items-center justify-between gap-3">
        <h2 className="font-[var(--font-display)] text-xl font-[420] tracking-tight text-[var(--color-foreground)]">
          {t(locale, "rbac.publisher.verify.step2.title")}
        </h2>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-subtle)] hover:bg-[var(--color-background-elevated)] hover:text-[var(--color-foreground)]"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </header>

      <p className="text-sm text-[var(--color-text-muted)]">
        {t(locale, "rbac.publisher.verify.step2.body")}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          {
            key: "id" as const,
            label: t(locale, "rbac.publisher.verify.step2.id"),
          },
          {
            key: "passport" as const,
            label: t(locale, "rbac.publisher.verify.step2.passport"),
          },
        ].map((opt) => {
          const active = type === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setType(opt.key)}
              className={`flex items-center gap-3 rounded-[var(--radius-xl)] border p-4 text-left text-sm font-semibold transition-colors ${
                active
                  ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/8 text-[var(--color-foreground)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:border-[var(--color-brand-primary-soft)]"
              }`}
            >
              <IdCard className="h-4 w-4 text-[var(--color-brand-primary)]" aria-hidden />
              {opt.label}
            </button>
          );
        })}
      </div>

      <ul className="flex flex-col gap-1 text-[11px] text-[var(--color-text-muted)]">
        <li>· {t(locale, "rbac.publisher.verify.step2.hint.1")}</li>
        <li>· {t(locale, "rbac.publisher.verify.step2.hint.2")}</li>
        <li>· {t(locale, "rbac.publisher.verify.step2.hint.3")}</li>
      </ul>

      {!PHOTO_VERIFICATION_ENABLED ? (
        <DisabledNotice
          body={t(locale, "rbac.publisher.postPublish.disabled")}
        />
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onContinue}
          disabled={!type}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Camera className="h-4 w-4" aria-hidden />
          {t(locale, "rbac.publisher.verify.step2.front")}
        </button>
      </div>
    </motion.div>
  );
}

function SuccessStep({ onClose }: { onClose: () => void }) {
  const locale = useActiveLocale();
  return (
    <motion.div
      key="success"
      variants={REVEAL}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col items-center gap-3 text-center"
    >
      <span
        aria-hidden
        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/30"
      >
        <CheckCircle2 className="h-5 w-5" aria-hidden />
      </span>
      <h2 className="font-[var(--font-display)] text-xl font-[420] tracking-tight text-[var(--color-foreground)]">
        {t(locale, "rbac.publisher.verify.success.title")}
      </h2>
      <p className="max-w-md text-sm text-[var(--color-text-muted)]">
        {t(locale, "rbac.publisher.verify.success.body")}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-11 items-center rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)]"
      >
        {t(locale, "rbac.publisher.verify.success.cta")}
      </button>
    </motion.div>
  );
}

function DisabledNotice({ body }: { body: string }) {
  return (
    <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-brand-accent)]/30 bg-[var(--color-brand-accent)]/10 px-3 py-2 text-[11px] text-[var(--color-foreground)]">
      <Info
        className="mt-0.5 h-3 w-3 shrink-0 text-[var(--color-brand-accent-strong)]"
        aria-hidden
      />
      <span className="leading-relaxed">{body}</span>
    </div>
  );
}
