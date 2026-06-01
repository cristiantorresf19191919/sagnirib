"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";

import { t } from "@/core/i18n/messages";
import {
  useActiveLocale,
  useLocalizedHref,
} from "@/core/i18n/use-active-locale";

import { updateListingDraft } from "../actions/update-draft";
import type { EnrollmentCatalogs } from "../lib/catalogs";
import {
  type EditDraftValues,
  editValuesToUpdateInput,
} from "../lib/edit-draft-mapping";
import { humanizeDraftError } from "../lib/to-server-payload";
import type { AttributesValues, DetailsValues } from "../lib/types";
import { ChipChoice, ToggleSwitch } from "./FormField";
import { SectionShell } from "./SectionShell";
import { StepAttributes } from "./StepAttributes";
import { StepDetails } from "./StepDetails";

interface EditDraftFormProps {
  draftId: string;
  /** The slug the draft already owns — lets the title check skip self. */
  ownSlug: string;
  catalogs: EnrollmentCatalogs;
  initial: EditDraftValues;
}

/**
 * Owner-side granular edit of a `pending_review` draft. Reuses the wizard's
 * StepDetails + StepAttributes (pre-filled) plus a services / meeting-place
 * editor. Photos and the free-text descriptions are intentionally NOT here —
 * a banner explains those require a fresh publish (the server also rejects
 * any attempt to change them).
 */
export function EditDraftForm({
  draftId,
  ownSlug,
  catalogs,
  initial,
}: Readonly<EditDraftFormProps>) {
  const locale = useActiveLocale();
  const router = useRouter();
  const miCuentaHref = useLocalizedHref("/mi-cuenta");
  const v = (key: string) => t(locale, key);

  const [details, setDetails] = useState<DetailsValues>(initial.details);
  const [attributes, setAttributes] = useState<AttributesValues>(
    initial.attributes,
  );
  const [services, setServices] = useState<ReadonlyArray<string>>(
    initial.services,
  );
  const [meetingContexts, setMeetingContexts] = useState<ReadonlyArray<string>>(
    initial.meetingContexts,
  );
  const [faceVisible, setFaceVisible] = useState(initial.faceVisible);
  const [paymentByCard, setPaymentByCard] = useState(initial.paymentByCard);

  const [forceShowErrors, setForceShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  function toggleService(s: string) {
    setServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }
  function togglePlace(p: string) {
    setMeetingContexts((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }

  function isValid(): boolean {
    if (!details.displayName.trim()) return false;
    if (!details.age || Number(details.age) < 18) return false;
    if (!details.city) return false;
    if (!details.category) return false;
    if (!details.pricePerHour || Number(details.pricePerHour) <= 0) return false;
    if (!details.phone) return false;
    if (details.contactChannels.length === 0) return false;
    if (services.length === 0) return false;
    if (
      !attributes.country ||
      !attributes.ethnicity ||
      !attributes.hair ||
      !attributes.height ||
      !attributes.body ||
      !attributes.breastSize ||
      !attributes.breastType
    ) {
      return false;
    }
    return true;
  }

  async function onSave() {
    setBanner(null);
    if (!isValid()) {
      setForceShowErrors(true);
      return;
    }
    setSubmitting(true);
    try {
      const input = editValuesToUpdateInput(draftId, {
        details,
        attributes,
        services,
        meetingContexts,
        faceVisible,
        paymentByCard,
      });
      const res = await updateListingDraft(input);
      if (!res.ok) {
        setBanner(humanizeDraftError(res.error));
        setSubmitting(false);
        return;
      }
      router.push(miCuentaHref);
      router.refresh();
    } catch {
      setBanner(v("editar.error.generic"));
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div
        role="note"
        className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--color-brand-accent)]/40 bg-[var(--color-brand-accent)]/8 p-4 text-sm text-[var(--color-foreground)]"
      >
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand-accent-strong)]"
          aria-hidden
        />
        <p className="leading-relaxed">{v("editar.disclaimer")}</p>
      </div>

      {banner && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-brand-highlight)]/40 bg-[var(--color-brand-highlight)]/8 p-3 text-sm text-[var(--color-foreground)]"
        >
          {banner}
        </p>
      )}

      <StepDetails
        values={details}
        catalogs={catalogs}
        onChange={setDetails}
        forceShowErrors={forceShowErrors}
        ownSlug={ownSlug}
      />

      <SectionShell
        eyebrow={v("editar.section.offer.eyebrow")}
        title={v("editar.section.offer.title")}
        description={v("editar.section.offer.description")}
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
            {v("step.description.services.legend")}
          </legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {catalogs.services.map((s) => (
              <ChipChoice
                key={s}
                label={s}
                active={services.includes(s)}
                onClick={() => toggleService(s)}
              />
            ))}
          </div>
          {forceShowErrors && services.length === 0 && (
            <p role="alert" className="text-[11px] text-[var(--color-brand-highlight)]">
              {v("publicar.validation.services")}
            </p>
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
            {v("step.description.places.legend")}
          </legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {catalogs.meetingContexts.map((p) => (
              <ChipChoice
                key={p}
                label={p}
                active={meetingContexts.includes(p)}
                onClick={() => togglePlace(p)}
              />
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-3">
          <ToggleSwitch
            label={v("editar.toggle.faceVisible")}
            checked={faceVisible}
            onChange={setFaceVisible}
          />
          <ToggleSwitch
            label={v("editar.toggle.paymentByCard")}
            checked={paymentByCard}
            onChange={setPaymentByCard}
          />
        </div>
      </SectionShell>

      <StepAttributes
        values={attributes}
        catalogs={{ appearance: catalogs.appearance, languages: catalogs.languages }}
        onChange={setAttributes}
        forceShowErrors={forceShowErrors}
      />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href={miCuentaHref}
          className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-6 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          {v("editar.cancel")}
        </Link>
        <button
          type="button"
          onClick={onSave}
          disabled={submitting}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-7 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {v("editar.save")}
        </button>
      </div>
    </div>
  );
}
