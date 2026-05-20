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
import { useRef, useState } from "react";

import { submitVerification } from "../actions/verify";
import {
  KycUploadError,
  type KycUploadKind,
  type KycUploadPhase,
  type KycUploadedAsset,
  uploadKycFile,
} from "../lib/upload-kyc-file";
import type {
  VerificationRecord,
  VerificationStatus,
} from "@/server/verification";

/**
 * Status-aware wizard. Three behaviors:
 *
 *   - status='approved'    → ya quedó verificada; pantalla de éxito
 *   - status='pending_review' → en revisión; pantalla de espera
 *   - status='rejected' o 'not_submitted' → renderizamos el wizard
 *
 * Per-file FSM (queued → compressing → uploading → ready / error) mirrors
 * the photo upload UX in /publicar.
 */

const STEP_ORDER: ReadonlyArray<{
  kind: KycUploadKind;
  title: string;
  description: string;
  icon: typeof IdCard;
  helper: string;
}> = [
  {
    kind: "document_front",
    title: "Documento — anverso",
    description: "Sube una foto clara del frente de tu cédula o pasaporte.",
    icon: IdCard,
    helper:
      "Asegúrate que todos los datos sean legibles. JPG, PNG, WebP o HEIC. Comprimimos en el navegador para protegerte; ningún metadato sale de tu dispositivo.",
  },
  {
    kind: "document_back",
    title: "Documento — reverso",
    description: "Ahora el dorso del mismo documento.",
    icon: IdCard,
    helper:
      "El número de identificación y los hologramas deben verse. Si tu documento es de una sola cara, repite la foto del anverso aquí.",
  },
  {
    kind: "selfie",
    title: "Selfie con documento",
    description:
      "Una foto de ti sosteniendo el documento al lado de tu rostro.",
    icon: ScanFace,
    helper:
      "Tu cara y el documento deben aparecer en la misma toma sin cubrir datos. Esta es la capa más importante: confirma que eres la persona del documento.",
  },
];

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
  initialStatus: VerificationStatus;
  initialRecord: VerificationRecord | null;
}

export function VerificationWizard({
  initialStatus,
  initialRecord,
}: VerificationWizardProps) {
  // Status screens short-circuit the wizard render.
  if (initialStatus === "approved") {
    return <ApprovedScreen record={initialRecord} />;
  }
  if (initialStatus === "pending_review") {
    return <PendingScreen record={initialRecord} />;
  }

  // 'rejected' and 'not_submitted' both render the wizard; rejected adds
  // an explanatory banner above.
  return (
    <Form
      previousRejection={
        initialStatus === "rejected" ? initialRecord?.rejectionReason : undefined
      }
    />
  );
}

function Form({ previousRejection }: { previousRejection?: string }) {
  const [states, setStates] = useState<Record<KycUploadKind, StepState>>({
    document_front: { kind: "idle" },
    document_back: { kind: "idle" },
    selfie: { kind: "idle" },
  });
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
        message: "Formato no permitido. Usa JPG, PNG, WebP o HEIC.",
      });
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setStep(kind, {
        kind: "error",
        previewUrl: URL.createObjectURL(file),
        message: "El archivo pesa más de 40 MB sin comprimir.",
      });
      return;
    }

    // Revoke previous preview URL if any.
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
          : "No pudimos subir este archivo.";
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
      setBanner("Completa los tres archivos antes de enviar.");
      return;
    }

    setSubmitting(true);
    setBanner(null);
    const res = await submitVerification({
      documentFrontPath: front.asset.path,
      documentBackPath: back.asset.path,
      selfiePath: selfie.asset.path,
    });
    setSubmitting(false);

    if (!res.ok) {
      setBanner(
        humanizeSubmitError(res.error?.kind, res.error?.message ?? null),
      );
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return <SubmittedScreen />;
  }

  const allReady =
    states.document_front.kind === "ready" &&
    states.document_back.kind === "ready" &&
    states.selfie.kind === "ready";

  return (
    <div className="flex flex-col gap-6">
      {previousRejection && (
        <div
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-brand-highlight)]/40 bg-[var(--color-brand-highlight)]/8 p-4 text-sm text-[var(--color-foreground)]"
        >
          <span className="font-semibold">Verificación anterior rechazada:</span>{" "}
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

      <div className="grid gap-4 lg:grid-cols-3">
        {STEP_ORDER.map((step) => (
          <StepCard
            key={step.kind}
            step={step}
            state={states[step.kind]}
            onPick={(f) => pickFile(step.kind, f)}
            onRetry={() => retry(step.kind)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-background-elevated)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] text-[var(--color-text-muted)]">
          <Shield className="mr-1 inline h-3 w-3" aria-hidden /> Tus archivos
          quedan privados. Solo el equipo de Biringas puede verlos, por tiempo
          limitado, durante la revisión.
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allReady || submitting}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-6 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,box-shadow] duration-150 hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {submitting ? "Enviando…" : "Enviar verificación"}
        </button>
      </div>
    </div>
  );
}

interface StepCardProps {
  step: (typeof STEP_ORDER)[number];
  state: StepState;
  onPick: (file: File) => void;
  onRetry: () => void;
}

function StepCard({ step, state, onPick, onRetry }: StepCardProps) {
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
            Subir archivo
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
                {state.kind === "compressing" ? "Comprimiendo" : "Subiendo"}
              </span>
            </span>
          )}
          {isReady && (
            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              Listo
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
                Reintentar
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

function humanizeSubmitError(kind: string | undefined, message: string | null): string {
  if (kind === "no-session") {
    return "Tu sesión expiró. Vuelve a ingresar.";
  }
  if (kind === "permission-denied") {
    return "Uno o más archivos no son tuyos. Vuelve a subirlos.";
  }
  if (message?.includes("already pending review")) {
    return "Ya tienes una verificación en revisión. Espera la respuesta antes de reenviar.";
  }
  return message ?? "No pudimos enviar la verificación. Intenta de nuevo.";
}

function SubmittedScreen() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center shadow-[var(--shadow-md)]">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary)]">
        <Shield className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="text-2xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
        Verificación enviada
      </h2>
      <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
        Tus archivos están en revisión. Confirmamos identidad y consentimiento
        usualmente en menos de 24 horas. Cuando esté lista te avisamos por
        WhatsApp y tu perfil queda activo en el catálogo.
      </p>
      <Link
        href="/explorar"
        className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-6 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-colors hover:bg-[var(--color-brand-primary-strong)]"
      >
        Volver al catálogo
      </Link>
    </div>
  );
}

function PendingScreen({ record }: { record: VerificationRecord | null }) {
  const submittedAt = record?.submittedAt
    ? new Date(record.submittedAt).toLocaleString("es-CO", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center shadow-[var(--shadow-md)]">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
      </span>
      <h2 className="text-2xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
        Verificación en revisión
      </h2>
      <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
        Recibimos tu documentación el {submittedAt}. Te avisamos en cuanto
        esté lista.
      </p>
    </div>
  );
}

function ApprovedScreen({ record }: { record: VerificationRecord | null }) {
  const approvedAt = record?.approvedAt
    ? new Date(record.approvedAt).toLocaleString("es-CO", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 rounded-[var(--radius-2xl)] border border-emerald-200 bg-emerald-50 p-10 text-center shadow-[var(--shadow-md)]">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white">
        <CheckCircle2 className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="text-2xl font-semibold leading-tight tracking-tight text-emerald-950">
        Identidad verificada
      </h2>
      <p className="text-sm leading-relaxed text-emerald-900">
        Tu verificación quedó aprobada el {approvedAt}. Las modelos con
        identidad verificada aparecen con la insignia dorada en el catálogo.
      </p>
      <Link
        href="/explorar"
        className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-6 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-colors hover:bg-[var(--color-brand-primary-strong)]"
      >
        Volver al catálogo
      </Link>
    </div>
  );
}
