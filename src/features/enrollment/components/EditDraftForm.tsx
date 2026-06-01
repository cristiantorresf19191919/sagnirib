"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CircleAlert, Dot, Loader2 } from "lucide-react";

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
import { EditDraftPreview } from "./EditDraftPreview";
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

/** Set equality (order-insensitive) for the chip-style array fields. */
function sameSet(a: ReadonlyArray<string>, b: ReadonlyArray<string>): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(b);
  return a.every((x) => set.has(x));
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

  // Has the user touched anything? Drives the sticky bar's status + the
  // unsaved-changes guards. Arrays compare order-insensitively so merely
  // re-picking the same chips doesn't read as a change.
  const dirty =
    JSON.stringify(details) !== JSON.stringify(initial.details) ||
    JSON.stringify(attributes) !== JSON.stringify(initial.attributes) ||
    !sameSet(services, initial.services) ||
    !sameSet(meetingContexts, initial.meetingContexts) ||
    faceVisible !== initial.faceVisible ||
    paymentByCard !== initial.paymentByCard;

  const showValidationHint = forceShowErrors && !isValid();

  // Warn on tab close / hard refresh while edits are unsaved.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function onCancel() {
    if (submitting) return;
    if (dirty && !window.confirm(v("editar.discardConfirm"))) return;
    router.push(miCuentaHref);
  }

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

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-8">
        {/* Live preview — first on mobile (so the impact of edits is visible
            without scrolling), sticky sidebar on desktop. */}
        <aside className="order-first lg:order-last lg:sticky lg:top-24">
          <EditDraftPreview
            locale={locale}
            details={details}
            attributes={attributes}
            catalogs={catalogs}
          />
          <p className="mt-2 px-1 text-[11px] leading-relaxed text-[var(--color-text-subtle)]">
            {v("editar.preview.caption")}
          </p>
        </aside>

        <div className="order-last flex min-w-0 flex-col gap-8 lg:order-first">
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
        </div>
      </div>

      {/* Sticky action bar — stays reachable on this long form, surfaces the
          unsaved-changes state, and only enables Save once something changed.
          Glassy surface so the form scrolls visibly beneath it. */}
      <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)]/85 p-3 shadow-[var(--shadow-md)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pl-5">
        <span
          aria-live="polite"
          className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ring-1 ${
            showValidationHint
              ? "bg-[var(--color-brand-highlight)]/12 text-[var(--color-brand-highlight)] ring-[var(--color-brand-highlight)]/35"
              : dirty
                ? "bg-[var(--color-brand-accent)]/15 text-[var(--color-brand-accent-strong)] ring-[var(--color-brand-accent)]/35"
                : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] ring-[var(--color-border)]"
          }`}
        >
          {showValidationHint ? (
            <>
              <CircleAlert className="h-3.5 w-3.5" aria-hidden />
              {v("editar.validationHint")}
            </>
          ) : dirty ? (
            <>
              <Dot className="h-4 w-4 animate-pulse" aria-hidden />
              {v("editar.dirty")}
            </>
          ) : (
            v("editar.pristine")
          )}
        </span>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-6 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          >
            {v("editar.cancel")}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={submitting || !dirty}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-7 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {v("editar.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
