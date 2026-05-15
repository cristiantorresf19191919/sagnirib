"use client";

import { ArrowLeft, ArrowRight, Loader2, PartyPopper } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { createListingDraft } from "../actions/create-draft";
import type { EnrollmentCatalogs } from "../lib/catalogs";
import { calculateTotal, formatCop } from "../lib/pricing";
import { humanizeDraftError, toServerPayload } from "../lib/to-server-payload";
import {
  type DescriptionValues,
  type DetailsValues,
  type EnrollmentDraft,
  INITIAL_DRAFT,
  type PublishValues,
  type StepId,
} from "../lib/types";
import { OrderSummary } from "./OrderSummary";
import { StepDescription } from "./StepDescription";
import { StepDetails } from "./StepDetails";
import { StepPublish } from "./StepPublish";
import { Stepper, type StepDescriptor } from "./Stepper";
import { UsefulTip } from "./UsefulTip";

const STEPS: ReadonlyArray<StepDescriptor> = [
  {
    id: "details",
    number: 1,
    title: "Detalles",
    description: "Datos públicos y privados de tu perfil.",
  },
  {
    id: "description",
    number: 2,
    title: "Descripción",
    description: "Lo que las personas verán y leerán.",
  },
  {
    id: "publish",
    number: 3,
    title: "Publicar",
    description: "Plan, refuerzos y publicación.",
  },
];

const TIPS_BY_STEP: Record<StepId, { title: string; body: string }> = {
  details: {
    title: "Tip — Detalles",
    body: "Las modelos que usan su nombre artístico real, edad correcta y una sola ciudad reciben un 38% más de clics. La URL preferida también funciona como SEO: usa nombre + ciudad.",
  },
  description: {
    title: "Tip — Descripción",
    body: "Las descripciones honestas en primera persona convierten 2.5× más. Evita números de teléfono o enlaces externos en el texto — los marcamos como spam y bloquean tu publicación.",
  },
  publish: {
    title: "Tip — Plan",
    body: "El plan Destacada es el que más eligen las modelos verificadas: incluye boost de catálogo, badge y stories diarias. Si tienes alta competencia en tu ciudad, suma un Boost de ciudad de 24h.",
  },
};

const STEP_ORDER: ReadonlyArray<StepId> = ["details", "description", "publish"];

interface EnrollmentWizardProps {
  catalogs: EnrollmentCatalogs;
}

export function EnrollmentWizard({ catalogs }: EnrollmentWizardProps) {
  const [draft, setDraft] = useState<EnrollmentDraft>(INITIAL_DRAFT);
  const [current, setCurrent] = useState<StepId>("details");
  const [completed, setCompleted] = useState<ReadonlyArray<StepId>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const tip = TIPS_BY_STEP[current];

  function handleChangeDetails(next: DetailsValues) {
    setDraft((prev) => ({ ...prev, details: next }));
  }
  function handleChangeDescription(next: DescriptionValues) {
    setDraft((prev) => ({ ...prev, description: next }));
  }
  function handleChangePublish(next: PublishValues) {
    setDraft((prev) => ({ ...prev, publish: next }));
  }

  function validateCurrent(): string | null {
    if (current === "details") {
      const d = draft.details;
      if (!d.displayName.trim()) return "Cuéntanos tu nombre artístico.";
      if (!d.age || Number(d.age) < 18)
        return "La edad mínima permitida es 18.";
      if (!d.city) return "Selecciona la ciudad principal.";
      if (!d.category) return "Selecciona una categoría.";
      if (!d.pricePerHour || Number(d.pricePerHour) <= 0)
        return "Pon una tarifa por hora válida.";
      if (!d.preferredSlug) return "Define una URL preferida.";
      if (!d.phone) return "Necesitamos un teléfono privado para verificar.";
      if (d.contactChannels.length === 0)
        return "Selecciona al menos un canal de contacto.";
      return null;
    }
    if (current === "description") {
      const d = draft.description;
      if (!d.shortBio.trim()) return "Escribe una descripción corta.";
      if (d.bio.trim().length < 60)
        return "La descripción larga debe tener al menos 60 caracteres.";
      if (d.services.length === 0)
        return "Selecciona al menos un servicio incluido.";
      // Photo upload lands in PR2b (Firebase Storage). Until then the
      // gallery is optional — the modelo can attach photos at review time.
      return null;
    }
    if (current === "publish") {
      const p = draft.publish;
      if (!p.acceptsAdult)
        return "Confirma que eres mayor de 18 y tienes autorización sobre tus fotos.";
      if (!p.acceptsTerms) return "Acepta los términos para publicar.";
      return null;
    }
    return null;
  }

  function next() {
    const err = validateCurrent();
    if (err) {
      setErrorBanner(err);
      return;
    }
    setErrorBanner(null);
    setCompleted((prev) => (prev.includes(current) ? prev : [...prev, current]));
    const idx = STEP_ORDER.indexOf(current);
    if (idx < STEP_ORDER.length - 1) setCurrent(STEP_ORDER[idx + 1]);
  }

  function back() {
    setErrorBanner(null);
    const idx = STEP_ORDER.indexOf(current);
    if (idx > 0) setCurrent(STEP_ORDER[idx - 1]);
  }

  function jump(id: StepId) {
    if (id === current) return;
    if (!completed.includes(id) && STEP_ORDER.indexOf(id) > STEP_ORDER.indexOf(current))
      return;
    setErrorBanner(null);
    setCurrent(id);
  }

  async function submit() {
    const err = validateCurrent();
    if (err) {
      setErrorBanner(err);
      return;
    }
    setSubmitting(true);
    setErrorBanner(null);

    const result = await createListingDraft(toServerPayload(draft));

    setSubmitting(false);

    if (!result.ok) {
      setErrorBanner(humanizeDraftError(result.error));
      return;
    }

    setSubmitted(true);
    setCompleted((prev) =>
      prev.includes("publish") ? prev : [...prev, "publish"],
    );
  }

  if (submitted) {
    return <SubmittedScreen draft={draft} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,260px)]">
        <Stepper
          steps={STEPS}
          current={current}
          completed={completed}
          onJump={jump}
        />
        <UsefulTip title={tip.title}>{tip.body}</UsefulTip>
      </div>

      {errorBanner && (
        <div
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-brand-highlight)]/40 bg-[var(--color-brand-highlight)]/8 px-4 py-3 text-sm text-[var(--color-brand-highlight)]"
        >
          {errorBanner}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <div className="flex flex-col gap-6">
          {current === "details" && (
            <StepDetails
              values={draft.details}
              catalogs={catalogs}
              onChange={handleChangeDetails}
            />
          )}
          {current === "description" && (
            <StepDescription
              values={draft.description}
              catalogs={catalogs}
              onChange={handleChangeDescription}
            />
          )}
          {current === "publish" && (
            <StepPublish
              values={draft.publish}
              onChange={handleChangePublish}
            />
          )}

          <NavBar
            isFirst={current === "details"}
            isLast={current === "publish"}
            submitting={submitting}
            totalLabel={
              current === "publish"
                ? formatCop(
                    calculateTotal(
                      draft.publish.packageId,
                      draft.publish.addOnIds,
                      draft.publish.billing,
                    ).totalCop,
                  )
                : null
            }
            onBack={back}
            onNext={next}
            onSubmit={submit}
          />
        </div>

        <div className="lg:block">
          {current === "publish" ? (
            <OrderSummary
              packageId={draft.publish.packageId}
              addOnIds={draft.publish.addOnIds}
              billing={draft.publish.billing}
            />
          ) : (
            <ProgressRail current={current} draft={draft} />
          )}
        </div>
      </div>
    </div>
  );
}

interface NavBarProps {
  isFirst: boolean;
  isLast: boolean;
  submitting: boolean;
  totalLabel: string | null;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

function NavBar({
  isFirst,
  isLast,
  submitting,
  totalLabel,
  onBack,
  onNext,
  onSubmit,
}: NavBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-background-elevated)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={onBack}
        disabled={isFirst}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-sm font-semibold text-[var(--color-text-muted)] transition-[color,border-color,background] duration-150 hover:border-[var(--color-brand-primary-soft)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver
      </button>

      {isLast ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-6 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,box-shadow] duration-150 hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          {submitting
            ? "Publicando..."
            : totalLabel
              ? `Publicar y pagar ${totalLabel}`
              : "Publicar"}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-6 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,box-shadow] duration-150 hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          Guardar y continuar
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

interface ProgressRailProps {
  current: StepId;
  draft: EnrollmentDraft;
}

function ProgressRail({ current, draft }: ProgressRailProps) {
  const summary: ReadonlyArray<{ label: string; value: string }> = [
    { label: "Nombre", value: draft.details.displayName || "—" },
    {
      label: "Ciudad",
      value: draft.details.city || "—",
    },
    {
      label: "Categoría",
      value: draft.details.category || "—",
    },
    {
      label: "Tarifa / hora",
      value: draft.details.pricePerHour
        ? formatCop(Number(draft.details.pricePerHour))
        : "—",
    },
    {
      label: "Servicios",
      value:
        draft.description.services.length > 0
          ? `${draft.description.services.length} elegidos`
          : "—",
    },
    {
      label: "Galería",
      value:
        draft.description.galleryFileNames.length > 0
          ? `${draft.description.galleryFileNames.length} fotos`
          : "—",
    },
  ];

  return (
    <aside className="sticky top-24 flex flex-col gap-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
      <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-muted)]">
        Tu publicación · borrador
      </span>
      <ul className="flex flex-col gap-2.5">
        {summary.map((row) => (
          <li
            key={row.label}
            className="flex items-baseline justify-between gap-3 text-[12px]"
          >
            <span className="text-[var(--color-text-subtle)]">{row.label}</span>
            <span className="text-right font-semibold text-[var(--color-foreground)]">
              {row.value}
            </span>
          </li>
        ))}
      </ul>
      <p className="rounded-[var(--radius-md)] bg-[var(--color-background-elevated)] p-3 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
        Llegando al paso final eliges tu plan de visibilidad. Cada perfil pasa
        revisión humana antes de aparecer en el catálogo.
      </p>
      <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
        Paso actual: {current}
      </span>
    </aside>
  );
}

function SubmittedScreen({ draft }: { draft: EnrollmentDraft }) {
  const totals = calculateTotal(
    draft.publish.packageId,
    draft.publish.addOnIds,
    draft.publish.billing,
  );
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center shadow-[var(--shadow-md)]">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary)]">
        <PartyPopper className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="text-2xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
        Recibimos tu publicación
      </h2>
      <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
        Estamos verificando tu identidad y consentimiento de imagen. Esto suele
        tardar entre 4 y 24 horas. Cuando esté listo te avisamos por WhatsApp y
        tu perfil se activa automáticamente.
      </p>
      <dl className="grid w-full grid-cols-2 gap-3 rounded-[var(--radius-md)] bg-[var(--color-background-elevated)] p-4 text-left text-[12px]">
        <div className="flex flex-col">
          <dt className="text-[var(--color-text-subtle)]">Plan</dt>
          <dd className="font-semibold capitalize text-[var(--color-foreground)]">
            {draft.publish.packageId}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-[var(--color-text-subtle)]">Refuerzos</dt>
          <dd className="font-semibold text-[var(--color-foreground)]">
            {draft.publish.addOnIds.length}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-[var(--color-text-subtle)]">Total cobrado (mock)</dt>
          <dd className="font-semibold text-[var(--color-foreground)]">
            {formatCop(totals.totalCop)}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-[var(--color-text-subtle)]">URL futura</dt>
          <dd className="truncate font-mono text-[12px] text-[var(--color-foreground)]">
            /p/{draft.details.preferredSlug || "—"}
          </dd>
        </div>
      </dl>
      <Link
        href="/explorar"
        className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-6 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-colors hover:bg-[var(--color-brand-primary-strong)]"
      >
        Volver al catálogo
      </Link>
    </div>
  );
}
