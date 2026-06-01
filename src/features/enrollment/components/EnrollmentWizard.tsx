"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  PartyPopper,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useLocalizedHref, useActiveLocale } from "@/core/i18n/use-active-locale";
import { t } from "@/core/i18n/messages";

import { createListingDraft } from "../actions/create-draft";
import type { EnrollmentCatalogs } from "../lib/catalogs";
import { containsUrl } from "../lib/bio-content-rules";
import {
  calculateTotal,
  formatCop,
  galleryMaxFor,
  PLANS_ENABLED,
} from "../lib/pricing";
import { humanizeDraftError, toServerPayload } from "../lib/to-server-payload";
import {
  type AttributesValues,
  type DescriptionValues,
  type DetailsValues,
  type EnrollmentDraft,
  INITIAL_DRAFT,
  type PublishValues,
  type StepId,
} from "../lib/types";
import { OrderSummary } from "./OrderSummary";
import { StepAttributes } from "./StepAttributes";
import {
  StepDescription,
  hasErroredUploads,
  hasErroredVideoUploads,
  hasInFlightUploads,
  hasInFlightVideoUploads,
} from "./StepDescription";
import { StepDetails } from "./StepDetails";
import { StepPublish } from "./StepPublish";
import { Stepper, type StepDescriptor } from "./Stepper";
import { UsefulTip } from "./UsefulTip";

import type { SupportedLocale } from "@/core/branding/brand-config";

function buildSteps(locale: SupportedLocale): ReadonlyArray<StepDescriptor> {
  return [
    {
      id: "details",
      number: 1,
      title: t(locale, "publicar.steps.details.title"),
      description: t(locale, "publicar.steps.details.description"),
    },
    {
      id: "description",
      number: 2,
      title: t(locale, "publicar.steps.description.title"),
      description: t(locale, "publicar.steps.description.description"),
    },
    {
      id: "attributes",
      number: 3,
      title: t(locale, "publicar.steps.attributes.title"),
      description: t(locale, "publicar.steps.attributes.description"),
    },
    {
      id: "publish",
      number: 4,
      title: t(locale, "publicar.steps.publish.title"),
      description: t(locale, "publicar.steps.publish.description"),
    },
  ];
}

function tipFor(
  locale: SupportedLocale,
  step: StepId,
): { title: string; body: string } {
  return {
    title: t(locale, `publicar.tip.${step}.title`),
    body: t(locale, `publicar.tip.${step}.body`),
  };
}

const STEP_ORDER: ReadonlyArray<StepId> = [
  "details",
  "description",
  "attributes",
  "publish",
];

interface EnrollmentWizardProps {
  catalogs: EnrollmentCatalogs;
  personId?: string;
}

export function EnrollmentWizard({ catalogs, personId }: EnrollmentWizardProps) {
  const locale = useActiveLocale();
  const STEPS = buildSteps(locale);
  const [draft, setDraft] = useState<EnrollmentDraft>(INITIAL_DRAFT);
  const [current, setCurrent] = useState<StepId>("details");
  const [completed, setCompleted] = useState<ReadonlyArray<StepId>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [forceShowErrors, setForceShowErrors] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const reduced = useReducedMotion();
  const wizardTopRef = useRef<HTMLDivElement | null>(null);
  const isInitialStepRef = useRef(true);

  // Each step's form is long enough that the submit button lives well below
  // the fold; if we leave the scroll position untouched the next step renders
  // mid-form and the user has to scroll back up to fill it from the top.
  useEffect(() => {
    if (isInitialStepRef.current) {
      isInitialStepRef.current = false;
      return;
    }
    wizardTopRef.current?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  }, [current, reduced]);
  // Stable wizard-mount upload session. Used as the `users/<uid>/staging/<sessionId>/`
  // prefix for every photo uploaded via this wizard instance, and submitted
  // verbatim to `createListingDraft` so the server can scope the staging→draft
  // copy. Regenerated when the wizard remounts (e.g. after a successful submit).
  const [sessionId] = useState(() => globalThis.crypto.randomUUID());

  const tip = tipFor(locale, current);

  function handleChangeDetails(next: DetailsValues) {
    setDraft((prev) => ({ ...prev, details: next }));
  }
  function handleChangeDescription(next: DescriptionValues) {
    setDraft((prev) => ({ ...prev, description: next }));
  }
  function handleChangeAttributes(next: AttributesValues) {
    setDraft((prev) => ({ ...prev, attributes: next }));
  }
  function handleChangePublish(next: PublishValues) {
    setDraft((prev) => ({ ...prev, publish: next }));
  }

  function validateCurrent(): string | null {
    const v = (key: string) => t(locale, key);
    if (current === "details") {
      const d = draft.details;
      if (!d.displayName.trim()) return v("publicar.validation.displayName");
      if (!d.age || Number(d.age) < 18) return v("publicar.validation.age");
      if (!d.city) return v("publicar.validation.city");
      if (!d.category) return v("publicar.validation.category");
      if (!d.pricePerHour || Number(d.pricePerHour) <= 0)
        return v("publicar.validation.pricePerHour");
      if (!d.preferredSlug) return v("publicar.validation.preferredSlug");
      if (!d.phone) return v("publicar.validation.phone");
      if (d.contactChannels.length === 0)
        return v("publicar.validation.contactChannels");
      return null;
    }
    if (current === "description") {
      const d = draft.description;
      if (!d.shortBio.trim()) return v("publicar.validation.shortBio");
      if (containsUrl(d.shortBio)) return v("publicar.validation.bioUrl");
      if (containsUrl(d.bio)) return v("publicar.validation.bioUrl");
      if (d.bio.trim().length < 60) return v("publicar.validation.bioLength");
      if (d.services.length === 0) return v("publicar.validation.services");
      if (hasInFlightUploads(d.gallery))
        return v("publicar.validation.galleryInFlight");
      if (hasErroredUploads(d.gallery))
        return v("publicar.validation.galleryErrored");
      if (hasInFlightVideoUploads(d.videos))
        return v("publicar.validation.videosInFlight");
      if (hasErroredVideoUploads(d.videos))
        return v("publicar.validation.videosErrored");
      return null;
    }
    if (current === "attributes") {
      const a = draft.attributes;
      if (!a.country) return v("publicar.validation.country");
      if (!a.ethnicity) return v("publicar.validation.ethnicity");
      if (!a.hair) return v("publicar.validation.hair");
      if (!a.height) return v("publicar.validation.height");
      if (!a.body) return v("publicar.validation.body");
      if (!a.breastSize) return v("publicar.validation.breastSize");
      if (!a.breastType) return v("publicar.validation.breastType");
      return null;
    }
    if (current === "publish") {
      const p = draft.publish;
      if (!p.acceptsAdult) return v("publicar.validation.adultConsent");
      if (!p.acceptsTerms) return v("publicar.validation.acceptTerms");
      return null;
    }
    return null;
  }

  function next() {
    const err = validateCurrent();
    if (err) {
      setForceShowErrors(true);
      return;
    }
    setForceShowErrors(false);
    setCompleted((prev) => (prev.includes(current) ? prev : [...prev, current]));
    const idx = STEP_ORDER.indexOf(current);
    if (idx < STEP_ORDER.length - 1) {
      setDirection(1);
      setCurrent(STEP_ORDER[idx + 1]);
    }
  }

  function back() {
    setForceShowErrors(false);
    const idx = STEP_ORDER.indexOf(current);
    if (idx > 0) {
      setDirection(-1);
      setCurrent(STEP_ORDER[idx - 1]);
    }
  }

  function jump(id: StepId) {
    if (id === current) return;
    if (!completed.includes(id) && STEP_ORDER.indexOf(id) > STEP_ORDER.indexOf(current))
      return;
    setDirection(
      STEP_ORDER.indexOf(id) > STEP_ORDER.indexOf(current) ? 1 : -1,
    );
    setForceShowErrors(false);
    setCurrent(id);
  }

  async function submit() {
    const err = validateCurrent();
    if (err) {
      setForceShowErrors(true);
      return;
    }
    setSubmitting(true);
    setForceShowErrors(false);
    setSubmitError(null);

    const result = await createListingDraft(
      toServerPayload(draft, sessionId, personId),
    );

    setSubmitting(false);

    if (!result.ok) {
      setSubmitError(humanizeDraftError(result.error));
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
    <div ref={wizardTopRef} className="flex flex-col gap-8 scroll-mt-24">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,260px)]">
        <Stepper
          steps={STEPS}
          current={current}
          completed={completed}
          onJump={jump}
        />
        <UsefulTip title={tip.title}>{tip.body}</UsefulTip>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <div className="flex flex-col gap-6">
          {/* Directional slide between steps — forward navigations slide
              right→left, back navigations slide left→right. mode="wait"
              ensures the outgoing step finishes before the next enters
              so the underlying form state never overlaps visually. */}
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={
                reduced
                  ? undefined
                  : {
                      enter: (dir: 1 | -1) => ({
                        opacity: 0,
                        x: dir > 0 ? 24 : -24,
                      }),
                      center: { opacity: 1, x: 0 },
                      exit: (dir: 1 | -1) => ({
                        opacity: 0,
                        x: dir > 0 ? -24 : 24,
                      }),
                    }
              }
              initial={reduced ? false : "enter"}
              animate={reduced ? undefined : "center"}
              exit={reduced ? undefined : "exit"}
              transition={
                reduced
                  ? { duration: 0 }
                  : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }
              }
            >
              {current === "details" && (
                <StepDetails
                  values={draft.details}
                  catalogs={catalogs}
                  onChange={handleChangeDetails}
                  forceShowErrors={forceShowErrors}
                />
              )}
              {current === "description" && (
                <StepDescription
                  values={draft.description}
                  catalogs={catalogs}
                  onChange={handleChangeDescription}
                  sessionId={sessionId}
                  galleryMax={galleryMaxFor(draft.publish.packageId)}
                  forceShowErrors={forceShowErrors}
                />
              )}
              {current === "attributes" && (
                <StepAttributes
                  values={draft.attributes}
                  catalogs={{
                    appearance: catalogs.appearance,
                    languages: catalogs.languages,
                  }}
                  onChange={handleChangeAttributes}
                  forceShowErrors={forceShowErrors}
                />
              )}
              {current === "publish" && (
                <StepPublish
                  values={draft.publish}
                  onChange={handleChangePublish}
                  forceShowErrors={forceShowErrors}
                  submitError={submitError}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <NavBar
            isFirst={current === "details"}
            isLast={current === "publish"}
            submitting={submitting}
            totalLabel={
              current === "publish" && PLANS_ENABLED
                ? formatCop(
                    calculateTotal(
                      draft.publish.packageId,
                      draft.publish.addOnIds,
                      draft.publish.billing,
                    ).totalCop,
                  )
                : null
            }
            freeMode={current === "publish" && !PLANS_ENABLED}
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
            <ProgressRail current={current} draft={draft} catalogs={catalogs} />
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
  freeMode: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

function NavBar({
  isFirst,
  isLast,
  submitting,
  totalLabel,
  freeMode,
  onBack,
  onNext,
  onSubmit,
}: NavBarProps) {
  const locale = useActiveLocale();
  const publishLabel = submitting
    ? t(locale, "publicar.nav.publishing")
    : freeMode
      ? t(locale, "publicar.nav.publishFree")
      : totalLabel
        ? t(locale, "publicar.nav.publishPaid", { total: totalLabel })
        : t(locale, "publicar.nav.publish");

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-background-elevated)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={onBack}
        disabled={isFirst}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-sm font-semibold text-[var(--color-text-muted)] transition-[color,border-color,background] duration-150 hover:border-[var(--color-brand-primary-soft)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t(locale, "publicar.nav.back")}
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
          {publishLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-6 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,box-shadow] duration-150 hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          {t(locale, "publicar.nav.continue")}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

interface ProgressRailProps {
  current: StepId;
  draft: EnrollmentDraft;
  catalogs: EnrollmentCatalogs;
}

/** Maps catalog ids (e.g. "mujeres") to their display labels ("Mujeres"). */
function labelsFor<T extends { id: string; label: string }>(
  catalog: ReadonlyArray<T>,
  ids: ReadonlyArray<string>,
): ReadonlyArray<string> {
  const map = new Map(catalog.map((c) => [c.id, c.label]));
  return ids.map((id) => map.get(id) ?? id);
}

function ProgressRail({ current, draft, catalogs }: ProgressRailProps) {
  const locale = useActiveLocale();
  const reduced = useReducedMotion();
  const empty = t(locale, "publicar.rail.row.empty");

  // Single-value rows stay as a compact key → value list. `empty` drives a
  // muted treatment so an unfilled field reads as "pending", not broken — and
  // the gallery shows a friendly "0 fotos" count instead of a bare dash.
  const rows: ReadonlyArray<{ label: string; value: string; empty: boolean }> = [
    {
      label: t(locale, "publicar.rail.row.name"),
      value: draft.details.displayName || empty,
      empty: !draft.details.displayName,
    },
    {
      label: t(locale, "publicar.rail.row.city"),
      value: draft.details.city || empty,
      empty: !draft.details.city,
    },
    {
      label: t(locale, "publicar.rail.row.category"),
      value: draft.details.category || empty,
      empty: !draft.details.category,
    },
    {
      label: t(locale, "publicar.rail.row.rate"),
      value: draft.details.pricePerHour
        ? formatCop(Number(draft.details.pricePerHour))
        : empty,
      empty: !draft.details.pricePerHour,
    },
    {
      label: t(locale, "publicar.rail.row.gallery"),
      value: t(locale, "publicar.rail.row.galleryCount", {
        count: draft.description.gallery.length,
      }),
      empty: draft.description.gallery.length === 0,
    },
  ];

  // Multi-select selections render as live chips so the user sees exactly
  // what they've picked so far, not just a count.
  const chipGroups: ReadonlyArray<{ key: string; label: string; items: ReadonlyArray<string> }> = [
    {
      key: "attention",
      label: t(locale, "step.details.attention.legend"),
      items: labelsFor(catalogs.attention, draft.details.attention),
    },
    {
      key: "contact",
      label: t(locale, "step.details.contact.legend"),
      items: labelsFor(catalogs.contact, draft.details.contactChannels),
    },
    {
      key: "services",
      label: t(locale, "step.description.services.legend"),
      items: draft.description.services,
    },
    {
      key: "places",
      label: t(locale, "step.description.places.legend"),
      items: draft.description.meetingContexts,
    },
  ].filter((group) => group.items.length > 0);

  return (
    <aside className="sticky top-24 flex flex-col gap-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
      <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-muted)]">
        {t(locale, "publicar.rail.kicker")}
      </span>
      <ul className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-baseline justify-between gap-3 text-[12px]"
          >
            <span className="text-[var(--color-text-subtle)]">{row.label}</span>
            <span
              className={`text-right ${
                row.empty
                  ? "font-normal text-[var(--color-text-subtle)]"
                  : "font-semibold text-[var(--color-foreground)]"
              }`}
            >
              {row.value}
            </span>
          </li>
        ))}
      </ul>

      {chipGroups.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-3">
          {chipGroups.map((group) => (
            <div key={group.key} className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                {group.label}
              </span>
              <motion.ul layout className="flex flex-wrap gap-1.5">
                <AnimatePresence initial={false}>
                  {group.items.map((item) => (
                    <motion.li
                      key={item}
                      layout
                      initial={reduced ? false : { opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
                      transition={
                        reduced
                          ? { duration: 0 }
                          : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
                      }
                      className="inline-flex items-center rounded-full bg-[var(--color-brand-primary)]/8 px-2.5 py-1 text-[11px] font-medium text-[var(--color-foreground)] ring-1 ring-[var(--color-brand-primary)]/15"
                    >
                      {item}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ul>
            </div>
          ))}
        </div>
      )}

      <p className="rounded-[var(--radius-md)] bg-[var(--color-background-elevated)] p-3 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
        {t(locale, "publicar.rail.note")}
      </p>
      <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
        {t(locale, "publicar.rail.currentStep", {
          step: t(locale, `publicar.steps.${current}.title`),
        })}
      </span>
    </aside>
  );
}

function SubmittedScreen({ draft }: { draft: EnrollmentDraft }) {
  const locale = useActiveLocale();
  const verifyHref = useLocalizedHref("/verificacion/enviar");
  const exploreHref = useLocalizedHref("/explorar");
  const empty = t(locale, "publicar.rail.row.empty");
  const totals = calculateTotal(
    draft.publish.packageId,
    draft.publish.addOnIds,
    draft.publish.billing,
  );
  const reduced = useReducedMotion();
  const cells: ReadonlyArray<{ label: string; value: string; mono?: boolean }> = [
    {
      label: PLANS_ENABLED
        ? t(locale, "publicar.submitted.plan")
        : t(locale, "publicar.submitted.mode"),
      value: PLANS_ENABLED
        ? draft.publish.packageId
        : t(locale, "publicar.submitted.freeLaunch"),
    },
    {
      label: t(locale, "publicar.submitted.photosSent"),
      value: String(
        draft.description.gallery.filter((g) => g.uploadedPath).length,
      ),
    },
    {
      label: t(locale, "publicar.submitted.total"),
      value: PLANS_ENABLED
        ? formatCop(totals.totalCop)
        : t(locale, "publicar.submitted.totalFree"),
    },
    {
      label: t(locale, "publicar.submitted.urlSoon"),
      value: `/p/${draft.details.preferredSlug || empty}`,
      mono: true,
    },
  ];

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
  };
  const item = reduced
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 8 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
        },
      };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="relative mx-auto flex max-w-xl flex-col items-center gap-5 overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-[var(--shadow-md)] sm:p-10"
    >
      {/* Soft brand wash behind the success header. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_50%_-20%,rgba(47,93,67,0.12),transparent_70%)]"
      />

      <motion.span
        variants={item}
        className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/25"
      >
        {!reduced && (
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full ring-2 ring-[var(--color-brand-primary)]/30"
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 1.35, opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeOut", repeat: Infinity, repeatDelay: 0.6 }}
          />
        )}
        <PartyPopper className="relative h-7 w-7" aria-hidden />
      </motion.span>

      <motion.h2
        variants={item}
        className="relative text-2xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]"
      >
        {t(locale, "publicar.submitted.title")}
      </motion.h2>
      <motion.p
        variants={item}
        className="relative max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]"
      >
        {t(locale, "publicar.submitted.description")}
      </motion.p>

      <motion.dl
        variants={item}
        className="relative grid w-full grid-cols-2 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background-elevated)] text-left text-[12px]"
      >
        {cells.map((cell, i) => (
          <div
            key={cell.label}
            className={`flex flex-col gap-1 p-4 ${
              i % 2 === 0 ? "border-r border-[var(--color-border)]" : ""
            } ${i < 2 ? "border-b border-[var(--color-border)]" : ""}`}
          >
            <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">
              {cell.label}
            </dt>
            <dd
              className={`truncate font-semibold text-[var(--color-foreground)] ${
                cell.mono ? "font-mono text-[11px]" : "capitalize"
              }`}
            >
              {cell.value}
            </dd>
          </div>
        ))}
      </motion.dl>

      <motion.div
        variants={item}
        className="relative flex w-full items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/8 p-3.5 text-left text-[12px] leading-relaxed text-[var(--color-foreground)]"
      >
        <span
          aria-hidden
          className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)]"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden />
        </span>
        <span>
          <strong>{t(locale, "publicar.submitted.verifyBanner.lead")}</strong>{" "}
          {t(locale, "publicar.submitted.verifyBanner.body")}
        </span>
      </motion.div>

      <motion.div variants={item} className="relative flex w-full flex-col gap-2 sm:flex-row">
        <Link
          href={verifyHref}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-6 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden />
          {t(locale, "publicar.submitted.cta.verify")}
        </Link>
        <Link
          href={exploreHref}
          className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-6 text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-brand-primary-soft)] hover:text-[var(--color-foreground)]"
        >
          {t(locale, "publicar.submitted.cta.later")}
        </Link>
      </motion.div>
    </motion.div>
  );
}
