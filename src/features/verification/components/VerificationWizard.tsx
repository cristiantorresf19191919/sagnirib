"use client";

import {
  AlertCircle,
  CheckCircle2,
  IdCard,
  Loader2,
  RotateCw,
  ScanFace,
  Shield,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { t } from "@/core/i18n/messages";
import {
  useActiveLocale,
  useLocalizedHref,
} from "@/core/i18n/use-active-locale";

import { submitVerification } from "../actions/verify";
import {
  KycUploadError,
  type KycUploadKind,
  type KycUploadPhase,
  type KycUploadedAsset,
  uploadKycFile,
} from "../lib/upload-kyc-file";
import {
  DOCUMENT_TYPES,
  VERIFICATION_DOCUMENT_LIMITS,
  type DocumentType,
} from "@/shared/verification/limits";
import type {
  KycReadUrls,
  VerificationRecord,
  VerificationStatus,
} from "@/server/verification";

/**
 * Client-side mirror of the server's `normalizeDocumentNumber` so the
 * wizard can show the canonical form back to the user as they type
 * (e.g. "1.234.567" → "1234567"). The server re-runs the same
 * normalization on submit as defense in depth.
 */
function normalizeDocumentNumberClient(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Whitelist a `?next=...` query param to relative app paths only.
 * Blocks `//evil.com`, `http://…`, and any other off-host destination
 * so a malicious link can't pivot the post-KYC redirect into an
 * external site.
 */
function safeNextPath(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  return raw;
}

/**
 * Status-aware wizard. Three behaviors:
 *
 *   - status='approved'    → ya quedó verificada; pantalla de éxito
 *   - status='pending_review' → en revisión; pantalla de espera
 *   - status='rejected' o 'not_submitted' → renderizamos el wizard
 */

interface StepDescriptor {
  kind: KycUploadKind;
  title: string;
  description: string;
  icon: typeof IdCard;
  helper: string;
}

function buildSteps(locale: SupportedLocale): ReadonlyArray<StepDescriptor> {
  return [
    {
      kind: "document_front",
      title: t(locale, "verificacion.wizard.step.front.title"),
      description: t(locale, "verificacion.wizard.step.front.description"),
      icon: IdCard,
      helper: t(locale, "verificacion.wizard.step.front.helper"),
    },
    {
      kind: "document_back",
      title: t(locale, "verificacion.wizard.step.back.title"),
      description: t(locale, "verificacion.wizard.step.back.description"),
      icon: IdCard,
      helper: t(locale, "verificacion.wizard.step.back.helper"),
    },
    {
      kind: "selfie",
      title: t(locale, "verificacion.wizard.step.selfie.title"),
      description: t(locale, "verificacion.wizard.step.selfie.description"),
      icon: ScanFace,
      helper: t(locale, "verificacion.wizard.step.selfie.helper"),
    },
  ];
}

const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";
const ACCEPTED_TYPES: ReadonlySet<string> = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const MAX_SOURCE_BYTES = 40 * 1024 * 1024;

type StepState =
  | { kind: "idle" }
  | { kind: "compressing"; previewUrl: string }
  | { kind: "uploading"; previewUrl: string }
  | { kind: "ready"; previewUrl: string; asset: KycUploadedAsset }
  | { kind: "error"; previewUrl: string; message: string };

interface VerificationWizardProps {
  /** ADR-018 — the person this wizard is verifying. Threaded into every
   *  Server Action call so the server scopes signed URLs, blob paths,
   *  and the `verifications/{personId}` doc id correctly. */
  personId: string;
  /** Optional display label for the active person — shown in the
   *  pending / approved screens so a partner with several modelos
   *  knows which one is being talked about. */
  personDisplayName?: string;
  initialStatus: VerificationStatus;
  initialRecord: VerificationRecord | null;
  /** Server-minted signed GET URLs for the 3 uploaded KYC assets. Only
   *  non-null when `initialStatus` is `pending_review` or `approved`
   *  and the record carries all three paths; otherwise the read-only
   *  view falls back to text-only. */
  initialReadUrls?: KycReadUrls | null;
}

export function VerificationWizard({
  personId,
  personDisplayName,
  initialStatus,
  initialRecord,
  initialReadUrls,
}: VerificationWizardProps) {
  const locale = useActiveLocale();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));

  if (initialStatus === "approved") {
    return (
      <ApprovedScreen
        record={initialRecord}
        locale={locale}
        personDisplayName={personDisplayName}
        readUrls={initialReadUrls ?? null}
      />
    );
  }
  if (initialStatus === "pending_review") {
    return (
      <PendingScreen
        record={initialRecord}
        locale={locale}
        personDisplayName={personDisplayName}
        readUrls={initialReadUrls ?? null}
      />
    );
  }

  return (
    <Form
      locale={locale}
      personId={personId}
      previousRejection={
        initialStatus === "rejected" ? initialRecord?.rejectionReason : undefined
      }
      nextPath={nextPath}
    />
  );
}

function Form({
  locale,
  personId,
  previousRejection,
  nextPath,
}: {
  locale: SupportedLocale;
  personId: string;
  previousRejection?: string;
  nextPath: string | null;
}) {
  const STEP_ORDER = buildSteps(locale);
  const [states, setStates] = useState<Record<KycUploadKind, StepState>>({
    document_front: { kind: "idle" },
    document_back: { kind: "idle" },
    selfie: { kind: "idle" },
  });
  /**
   * ADR-018 amendment — structured identity. `documentType` defaults
   * to `"CC"` (most common in Colombia); the user can flip it before
   * typing the number. The number is stored RAW (with separators)
   * for display so the user sees what they typed; normalization
   * happens on submit.
   */
  const [documentType, setDocumentType] = useState<DocumentType>("CC");
  const [documentNumberRaw, setDocumentNumberRaw] = useState<string>("");
  const documentNumberNormalized = normalizeDocumentNumberClient(
    documentNumberRaw,
  );
  const documentNumberValid =
    documentNumberNormalized.length >=
      VERIFICATION_DOCUMENT_LIMITS.documentNumberMin &&
    documentNumberNormalized.length <=
      VERIFICATION_DOCUMENT_LIMITS.documentNumberMax;

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const controllers = useRef<Map<KycUploadKind, AbortController>>(new Map());

  function setStep(kind: KycUploadKind, next: StepState) {
    setStates((prev) => ({ ...prev, [kind]: next }));
  }

  async function pickFile(kind: KycUploadKind, file: File) {
    if (!ACCEPTED_TYPES.has(file.type)) {
      setStep(kind, {
        kind: "error",
        previewUrl: URL.createObjectURL(file),
        message: t(locale, "verificacion.wizard.error.format"),
      });
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setStep(kind, {
        kind: "error",
        previewUrl: URL.createObjectURL(file),
        message: t(locale, "verificacion.wizard.error.tooBig"),
      });
      return;
    }

    const prev = states[kind];
    if (prev.kind !== "idle" && "previewUrl" in prev) {
      URL.revokeObjectURL(prev.previewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setStep(kind, { kind: "compressing", previewUrl });

    const controller = new AbortController();
    controllers.current.set(kind, controller);

    try {
      const asset = await uploadKycFile(file, {
        personId,
        kind,
        signal: controller.signal,
        onPhase: (phase: KycUploadPhase) => {
          setStep(kind, {
            kind: phase === "compressing" ? "compressing" : "uploading",
            previewUrl,
          });
        },
      });
      controllers.current.delete(kind);
      setStep(kind, { kind: "ready", previewUrl, asset });
    } catch (err) {
      controllers.current.delete(kind);
      if (err instanceof KycUploadError && err.kind === "aborted") return;
      const message =
        err instanceof Error
          ? err.message
          : t(locale, "verificacion.wizard.error.upload");
      setStep(kind, { kind: "error", previewUrl, message });
    }
  }

  function retry(kind: KycUploadKind) {
    const s = states[kind];
    if (s.kind !== "error") return;
    URL.revokeObjectURL(s.previewUrl);
    setStep(kind, { kind: "idle" });
  }

  async function handleSubmit() {
    const front = states.document_front;
    const back = states.document_back;
    const selfie = states.selfie;
    if (front.kind !== "ready" || back.kind !== "ready" || selfie.kind !== "ready") {
      setBanner(t(locale, "verificacion.wizard.error.completeAll"));
      return;
    }
    if (!documentNumberValid) {
      setBanner(t(locale, "verificacion.wizard.error.documentNumberInvalid"));
      return;
    }

    setSubmitting(true);
    setBanner(null);
    const res = await submitVerification({
      personId,
      documentFrontPath: front.asset.path,
      documentBackPath: back.asset.path,
      selfiePath: selfie.asset.path,
      documentType,
      // Normalized form ONLY — the server re-normalizes as defense in
      // depth, but sending the canonical value keeps the uniqueness
      // check semantically identical to what the user sees in the
      // preview ("1.234.567" → "1234567").
      documentNumber: documentNumberNormalized,
    });
    setSubmitting(false);

    if (!res.ok) {
      setBanner(
        humanizeSubmitError(locale, res.error?.kind, res.error?.message ?? null),
      );
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return <SubmittedScreen locale={locale} nextPath={nextPath} />;
  }

  const allReady =
    states.document_front.kind === "ready" &&
    states.document_back.kind === "ready" &&
    states.selfie.kind === "ready" &&
    documentNumberValid;

  return (
    <div className="flex flex-col gap-6">
      {previousRejection && (
        <div
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-brand-highlight)]/40 bg-[var(--color-brand-highlight)]/8 p-4 text-sm text-[var(--color-foreground)]"
        >
          <span className="font-semibold">
            {t(locale, "verificacion.wizard.previousRejection")}
          </span>{" "}
          {previousRejection}
        </div>
      )}

      {banner && (
        <div
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-brand-highlight)]/40 bg-[var(--color-brand-highlight)]/8 px-4 py-3 text-sm text-[var(--color-brand-highlight)]"
        >
          {banner}
        </div>
      )}

      <DocumentIdentitySection
        locale={locale}
        documentType={documentType}
        onDocumentTypeChange={setDocumentType}
        documentNumberRaw={documentNumberRaw}
        onDocumentNumberChange={setDocumentNumberRaw}
        normalized={documentNumberNormalized}
        valid={documentNumberValid}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {STEP_ORDER.map((step) => (
          <StepCard
            key={step.kind}
            locale={locale}
            step={step}
            state={states[step.kind]}
            onPick={(f) => pickFile(step.kind, f)}
            onRetry={() => retry(step.kind)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-background-elevated)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] text-[var(--color-text-muted)]">
          <Shield className="mr-1 inline h-3 w-3" aria-hidden />{" "}
          {t(locale, "verificacion.wizard.privacyHint")}
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allReady || submitting}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-6 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,box-shadow] duration-150 hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {submitting
            ? t(locale, "verificacion.wizard.submitting")
            : t(locale, "verificacion.wizard.submit")}
        </button>
      </div>
    </div>
  );
}

interface StepCardProps {
  locale: SupportedLocale;
  step: StepDescriptor;
  state: StepState;
  onPick: (file: File) => void;
  onRetry: () => void;
}

function StepCard({ locale, step, state, onPick, onRetry }: StepCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isBusy = state.kind === "compressing" || state.kind === "uploading";
  const isReady = state.kind === "ready";
  const isError = state.kind === "error";

  function openPicker() {
    if (isBusy) return;
    inputRef.current?.click();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onPick(file);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]">
          <step.icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-[var(--color-foreground)]">
            {step.title}
          </span>
          <span className="text-[12px] leading-relaxed text-[var(--color-text-muted)]">
            {step.description}
          </span>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleChange}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
      />

      {state.kind === "idle" ? (
        <button
          type="button"
          onClick={openPicker}
          className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-background-elevated)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          <Upload className="h-5 w-5" aria-hidden />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
            {t(locale, "verificacion.wizard.upload")}
          </span>
        </button>
      ) : (
        <div className="group relative aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={state.previewUrl}
            alt={step.title}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity ${
              isBusy || isError ? "opacity-50" : "opacity-100"
            }`}
          />
          {isBusy && (
            <span
              aria-live="polite"
              className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[var(--color-foreground)]/30 text-[var(--color-surface)]"
            >
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
                {state.kind === "compressing"
                  ? t(locale, "verificacion.wizard.compressing")
                  : t(locale, "verificacion.wizard.uploading")}
              </span>
            </span>
          )}
          {isReady && (
            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              {t(locale, "verificacion.wizard.ready")}
            </span>
          )}
          {isError && (
            <button
              type="button"
              onClick={onRetry}
              title={state.message}
              className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[var(--color-brand-highlight)]/40 text-[var(--color-surface)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
            >
              <AlertCircle className="h-5 w-5" aria-hidden />
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em]">
                <RotateCw className="h-3 w-3" aria-hidden />
                {t(locale, "verificacion.wizard.retry")}
              </span>
            </button>
          )}
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-[var(--color-text-subtle)]">
        {step.helper}
      </p>
    </div>
  );
}

function humanizeSubmitError(
  locale: SupportedLocale,
  kind: string | undefined,
  message: string | null,
): string {
  if (kind === "no-session") {
    return t(locale, "verificacion.wizard.error.noSession");
  }
  if (kind === "permission-denied") {
    return t(locale, "verificacion.wizard.error.permissionDenied");
  }
  if (kind === "duplicate-document-number") {
    return t(locale, "verificacion.wizard.error.duplicateDocument");
  }
  if (message?.includes("already pending review")) {
    return t(locale, "verificacion.wizard.error.pendingReview");
  }
  return message ?? t(locale, "verificacion.wizard.error.submitDefault");
}

interface DocumentIdentitySectionProps {
  locale: SupportedLocale;
  documentType: DocumentType;
  onDocumentTypeChange: (type: DocumentType) => void;
  documentNumberRaw: string;
  onDocumentNumberChange: (raw: string) => void;
  normalized: string;
  valid: boolean;
}

/**
 * Document type + number capture (ADR-018 amendment). Lives ABOVE the
 * three image upload cards because the type drives the placeholder /
 * helper copy for the number, and the number is the uniqueness key
 * the admin queries against — capturing it last would put the
 * uniqueness check at the END of the flow, after the user has
 * uploaded three images. Failing then would be a worse UX.
 */
function DocumentIdentitySection({
  locale,
  documentType,
  onDocumentTypeChange,
  documentNumberRaw,
  onDocumentNumberChange,
  normalized,
  valid,
}: DocumentIdentitySectionProps) {
  const inputMode = documentType === "PASSPORT" ? "text" : "numeric";
  const placeholder = t(
    locale,
    documentType === "PASSPORT"
      ? "verificacion.wizard.doc.placeholder.passport"
      : documentType === "CE"
        ? "verificacion.wizard.doc.placeholder.ce"
        : "verificacion.wizard.doc.placeholder.cc",
  );
  const dirty = documentNumberRaw.length > 0;
  const showError = dirty && !valid;
  const showNormalizedHint =
    dirty && normalized !== documentNumberRaw.trim().toUpperCase();

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
          {t(locale, "verificacion.wizard.doc.kicker")}
        </span>
        <h2 className="text-base font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
          {t(locale, "verificacion.wizard.doc.title")}
        </h2>
        <p className="text-[12px] leading-relaxed text-[var(--color-text-muted)]">
          {t(locale, "verificacion.wizard.doc.subtitle")}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
          {t(locale, "verificacion.wizard.doc.typeLabel")}
        </span>
        <div
          role="radiogroup"
          aria-label={t(locale, "verificacion.wizard.doc.typeLabel")}
          className="grid grid-cols-3 gap-2"
        >
          {DOCUMENT_TYPES.map((type) => {
            const selected = documentType === type;
            return (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onDocumentTypeChange(type)}
                className={`h-11 rounded-full border text-sm font-semibold transition-[border-color,background] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${
                  selected
                    ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary-strong)]"
                    : "border-[var(--color-border)] bg-[var(--color-background-elevated)] text-[var(--color-text-muted)] hover:border-[var(--color-brand-primary-soft)] hover:text-[var(--color-foreground)]"
                }`}
              >
                {t(locale, `verificacion.wizard.doc.type.${type}`)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="kyc-document-number"
          className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]"
        >
          {t(locale, "verificacion.wizard.doc.numberLabel")}
        </label>
        <input
          id="kyc-document-number"
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          spellCheck={false}
          value={documentNumberRaw}
          onChange={(e) => onDocumentNumberChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={showError}
          aria-describedby={showError ? "kyc-document-number-error" : undefined}
          className={`h-12 rounded-[var(--radius-md)] border bg-[var(--color-background-elevated)] px-4 text-sm tracking-[0.04em] text-[var(--color-foreground)] outline-none transition-colors duration-150 focus:border-[var(--color-brand-primary)] ${
            showError
              ? "border-[var(--color-brand-highlight)]"
              : "border-[var(--color-border)]"
          }`}
        />
        {showError ? (
          <span
            id="kyc-document-number-error"
            className="text-[11px] text-[var(--color-brand-highlight)]"
          >
            {t(locale, "verificacion.wizard.error.documentNumberInvalid")}
          </span>
        ) : showNormalizedHint ? (
          <span className="text-[11px] text-[var(--color-text-muted)]">
            {t(locale, "verificacion.wizard.doc.normalizedHint")}:{" "}
            <span className="font-mono text-[var(--color-foreground)]">
              {normalized}
            </span>
          </span>
        ) : (
          <span className="text-[11px] text-[var(--color-text-muted)]">
            {t(locale, "verificacion.wizard.doc.numberHelper")}
          </span>
        )}
      </div>
    </div>
  );
}

function SubmittedScreen({
  locale,
  nextPath,
}: {
  locale: SupportedLocale;
  nextPath: string | null;
}) {
  const exploreHref = useLocalizedHref("/explorar");
  // When the wizard was invoked from the publish gate
  // (`/publicar` → KYC → back), `nextPath` carries the original
  // destination. Honor it so the user lands where they were going
  // instead of in the public catalog.
  const ctaHref = nextPath ?? exploreHref;
  const ctaLabel = nextPath
    ? t(locale, "verificacion.wizard.continueToNext")
    : t(locale, "verificacion.wizard.backToCatalog");
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center shadow-[var(--shadow-md)]">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary)]">
        <Shield className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="text-2xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
        {t(locale, "verificacion.wizard.submitted.title")}
      </h2>
      <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
        {t(locale, "verificacion.wizard.submitted.body")}
      </p>
      <Link
        href={ctaHref}
        className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-6 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-colors hover:bg-[var(--color-brand-primary-strong)]"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

/**
 * Mask everything except the last 4 chars of the document number. The
 * full number is captured on the server for admin review; the dashboard
 * only needs enough for the owner to recognize WHICH document is on
 * file — not enough to copy if someone shoulder-surfs.
 */
function maskDocumentNumber(n: string | undefined): string {
  if (!n) return "—";
  if (n.length <= 4) return "•".repeat(Math.max(0, n.length - 1)) + n.slice(-1);
  return "•".repeat(n.length - 4) + n.slice(-4);
}

function PendingScreen({
  record,
  locale,
  personDisplayName,
  readUrls,
}: {
  record: VerificationRecord | null;
  locale: SupportedLocale;
  personDisplayName?: string;
  readUrls: KycReadUrls | null;
}) {
  const dateLocale = locale === "en" ? "en-US" : "es-CO";
  const submittedAt = record?.submittedAt
    ? new Date(record.submittedAt).toLocaleString(dateLocale, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col items-center gap-4 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-[var(--shadow-md)]">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        </span>
        <h2 className="text-2xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
          {t(locale, "verificacion.wizard.pending.title")}
        </h2>
        {personDisplayName ? (
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">
            {personDisplayName}
          </p>
        ) : null}
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          {t(locale, "verificacion.wizard.pending.body", { when: submittedAt })}
        </p>
      </div>
      {record && readUrls ? (
        <SubmittedSummary
          locale={locale}
          record={record}
          readUrls={readUrls}
          notice={t(locale, "verificacion.wizard.readonly.pendingNotice")}
          noticeTone="info"
        />
      ) : null}
    </div>
  );
}

function ApprovedScreen({
  record,
  locale,
  personDisplayName,
  readUrls,
}: {
  record: VerificationRecord | null;
  locale: SupportedLocale;
  personDisplayName?: string;
  readUrls: KycReadUrls | null;
}) {
  const exploreHref = useLocalizedHref("/explorar");
  const dateLocale = locale === "en" ? "en-US" : "es-CO";
  const approvedAt = record?.approvedAt
    ? new Date(record.approvedAt).toLocaleString(dateLocale, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col items-center gap-4 rounded-[var(--radius-2xl)] border border-emerald-200 bg-emerald-50 p-8 text-center shadow-[var(--shadow-md)]">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white">
          <CheckCircle2 className="h-6 w-6" aria-hidden />
        </span>
        <h2 className="text-2xl font-semibold leading-tight tracking-tight text-emerald-950">
          {t(locale, "verificacion.wizard.approved.title")}
        </h2>
        {personDisplayName ? (
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
            {personDisplayName}
          </p>
        ) : null}
        <p className="text-sm leading-relaxed text-emerald-900">
          {t(locale, "verificacion.wizard.approved.body", { when: approvedAt })}
        </p>
        <Link
          href={exploreHref}
          className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-6 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-colors hover:bg-[var(--color-brand-primary-strong)]"
        >
          {t(locale, "verificacion.wizard.backToCatalog")}
        </Link>
      </div>
      {record && readUrls ? (
        <SubmittedSummary
          locale={locale}
          record={record}
          readUrls={readUrls}
          notice={t(locale, "verificacion.wizard.readonly.approvedNotice")}
          noticeTone="approved"
        />
      ) : null}
    </div>
  );
}

/**
 * Read-only summary of what the owner submitted: document type + masked
 * number + 3 photo thumbnails. Used by both PendingScreen and
 * ApprovedScreen. Plain `<img>` (not `next/image`) because the URLs are
 * short-lived V4-signed GETs — `next/image` would proxy + cache them,
 * breaking the signature.
 */
function SubmittedSummary({
  locale,
  record,
  readUrls,
  notice,
  noticeTone,
}: {
  locale: SupportedLocale;
  record: VerificationRecord;
  readUrls: KycReadUrls;
  notice: string;
  noticeTone: "info" | "approved";
}) {
  const docTypeLabel = record.documentType
    ? t(locale, `verificacion.wizard.doc.type.${record.documentType}`)
    : "—";
  const docNumberMasked = maskDocumentNumber(record.documentNumber);
  const photos: ReadonlyArray<{ url: string; label: string }> = [
    {
      url: readUrls.documentFront,
      label: t(locale, "verificacion.wizard.readonly.documentFront"),
    },
    {
      url: readUrls.documentBack,
      label: t(locale, "verificacion.wizard.readonly.documentBack"),
    },
    {
      url: readUrls.selfie,
      label: t(locale, "verificacion.wizard.readonly.selfie"),
    },
  ];
  const noticeClass =
    noticeTone === "approved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-[var(--color-brand-accent)]/40 bg-[var(--color-brand-accent)]/8 text-[var(--color-foreground)]";

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
      <div
        role="note"
        className={`flex items-start gap-2 rounded-[var(--radius-md)] border px-4 py-3 text-sm leading-relaxed ${noticeClass}`}
      >
        <Shield className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>{notice}</span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
          {t(locale, "verificacion.wizard.readonly.documentSectionTitle")}
        </span>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-0.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background-elevated)] px-3 py-2">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              {t(locale, "verificacion.wizard.readonly.docTypeLabel")}
            </dt>
            <dd className="text-sm font-semibold text-[var(--color-foreground)]">
              {docTypeLabel}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background-elevated)] px-3 py-2">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              {t(locale, "verificacion.wizard.readonly.docNumberLabel")}
            </dt>
            <dd className="font-mono text-sm tracking-[0.08em] text-[var(--color-foreground)]">
              {docNumberMasked}
            </dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {photos.map((p) => (
          <figure
            key={p.label}
            className="flex flex-col gap-2 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-background-elevated)] p-3"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.label}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <figcaption className="text-[11px] font-medium leading-relaxed text-[var(--color-text-muted)]">
              {p.label}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
