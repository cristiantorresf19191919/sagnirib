import type { EnrollmentDraft, StepId } from "./types";

export interface CompletionResult {
  /** Required fields currently satisfied. */
  filled: number;
  /** Total required fields. */
  total: number;
  /** filled / total, in [0, 1]. */
  fraction: number;
}

/**
 * Per-step required-field checks. Mirror `validateCurrent` in
 * `EnrollmentWizard` one-for-one so progress is honest — it rises and recedes
 * with exactly the fields that gate publishing. Keep in sync: if a step's
 * required fields change, update both. Optional fields (`attention`, `pubis`,
 * `languages`, videos, toggles) are intentionally excluded.
 */
const STEP_CHECKS: Record<
  StepId,
  (draft: EnrollmentDraft) => ReadonlyArray<boolean>
> = {
  details: ({ details: d }) => [
    d.displayName.trim().length > 0,
    d.age.length > 0 && Number(d.age) >= 18,
    d.city.length > 0,
    d.category.length > 0,
    d.pricePerHour.length > 0 && Number(d.pricePerHour) > 0,
    d.preferredSlug.length > 0,
    d.phone.length > 0,
    d.contactChannels.length > 0,
  ],
  description: ({ description: d }) => [
    d.shortBio.trim().length > 0,
    d.bio.trim().length >= 60,
    d.services.length > 0,
    d.gallery.some((item) => item.status === "ready"),
  ],
  attributes: ({ attributes: a }) => [
    a.country.length > 0,
    a.ethnicity.length > 0,
    a.hair.length > 0,
    a.height.length > 0,
    a.body.length > 0,
    a.breastSize.length > 0,
    a.breastType.length > 0,
  ],
  publish: ({ publish: p }) => [p.acceptsTerms, p.acceptsAdult],
};

const STEP_IDS = Object.keys(STEP_CHECKS) as ReadonlyArray<StepId>;

function fractionOf(checks: ReadonlyArray<boolean>): number {
  if (checks.length === 0) return 0;
  const filled = checks.reduce((sum, ok) => (ok ? sum + 1 : sum), 0);
  return filled / checks.length;
}

/** Completion fraction (0–1) for each step — drives the active step's ring. */
export function computeStepFractions(
  draft: EnrollmentDraft,
): Record<StepId, number> {
  return {
    details: fractionOf(STEP_CHECKS.details(draft)),
    description: fractionOf(STEP_CHECKS.description(draft)),
    attributes: fractionOf(STEP_CHECKS.attributes(draft)),
    publish: fractionOf(STEP_CHECKS.publish(draft)),
  };
}

/** Overall field-level completion across all required fields — drives the orb. */
export function computeCompletion(draft: EnrollmentDraft): CompletionResult {
  const all = STEP_IDS.flatMap((id) => STEP_CHECKS[id](draft));
  const total = all.length;
  const filled = all.reduce((sum, ok) => (ok ? sum + 1 : sum), 0);
  return { filled, total, fraction: total === 0 ? 0 : filled / total };
}
