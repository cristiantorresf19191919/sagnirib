"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";

import type { AppearanceCatalogs } from "../lib/catalogs";
import type { AttributesValues } from "../lib/types";
import { ChipChoice } from "./FormField";
import { SectionShell } from "./SectionShell";

/**
 * Staggered reveal for each attribute block. They animate as the step enters
 * (it mounts in view), cascading top-to-bottom so the long form feels like it
 * "assembles" rather than dumping at once. Honors reduced motion via the
 * app-wide MotionConfig. A re-usable container/item pair keyed off the index.
 */
const revealContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};
const revealItem = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};

interface StepAttributesProps {
  values: AttributesValues;
  catalogs: {
    appearance: AppearanceCatalogs;
    languages: ReadonlyArray<string>;
  };
  onChange: (next: AttributesValues) => void;
  forceShowErrors: boolean;
}

type AppearanceKey = keyof AppearanceCatalogs;

const REQUIRED_FIELDS: ReadonlySet<AppearanceKey> = new Set([
  "country",
  "ethnicity",
  "hair",
  "height",
  "body",
  "breastSize",
  "breastType",
]);

const FIELDS_WITH_HINT: ReadonlySet<AppearanceKey> = new Set(["country", "pubis"]);

export function StepAttributes({ values, catalogs, onChange, forceShowErrors }: StepAttributesProps) {
  const locale = useActiveLocale();
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());

  function touch(name: string) {
    setTouched((prev) => new Set([...prev, name]));
  }

  function show(name: string): boolean {
    return forceShowErrors || touched.has(name);
  }

  function setSingle(key: AppearanceKey, value: string) {
    const next = values[key] === value ? "" : value;
    onChange({ ...values, [key]: next });
    // Touch immediately when the user deselects back to empty
    if (next === "" && REQUIRED_FIELDS.has(key)) touch(key);
  }

  function toggleLanguage(lang: string) {
    const has = values.languages.includes(lang);
    onChange({
      ...values,
      languages: has
        ? values.languages.filter((x) => x !== lang)
        : [...values.languages, lang],
    });
  }

  const v = (key: string) => t(locale, key);

  /** Renders one single-select appearance field (legend + chips + error). */
  function field(key: AppearanceKey) {
    const fieldError =
      REQUIRED_FIELDS.has(key) && !values[key]
        ? v(`publicar.validation.${key}`)
        : undefined;

    return (
      <fieldset key={key} className="flex flex-col gap-2">
        <legend className="text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
          {t(locale, `step.attributes.${key}.label`)}
        </legend>
        {FIELDS_WITH_HINT.has(key) && (
          <p className="text-[11px] text-[var(--color-text-subtle)]">
            {t(locale, `step.attributes.${key}.hint`)}
          </p>
        )}
        <div className="mt-1 flex flex-wrap gap-2">
          {catalogs.appearance[key].map((option) => (
            <ChipChoice
              key={option}
              label={option}
              active={values[key] === option}
              onClick={() => setSingle(key, option)}
            />
          ))}
        </div>
        {show(key) && fieldError && (
          <p role="alert" className="text-[11px] text-[var(--color-brand-highlight)]">
            {fieldError}
          </p>
        )}
      </fieldset>
    );
  }

  return (
    <SectionShell
      eyebrow={t(locale, "step.attributes.eyebrow")}
      title={t(locale, "step.attributes.title")}
      description={t(locale, "step.attributes.description")}
    >
      <motion.div
        variants={revealContainer}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-6"
      >
        {/* Nationality leads full-width — it's the primary catalog filter. */}
        <motion.div variants={revealItem}>{field("country")}</motion.div>

        {/* Short single-select fields pair into two columns on desktop so the
            step stays mostly above the fold instead of one tall column. */}
        <motion.div
          variants={revealItem}
          className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2"
        >
          {field("ethnicity")}
          {field("hair")}
          {field("height")}
          {field("body")}
        </motion.div>

        {/* Senos — size and type are INDEPENDENT dimensions (you can be
            "Grandes" + "Naturales" at once). Wrapping them under one labelled
            group makes that explicit so they never read as mutually exclusive. */}
        <motion.fieldset
          variants={revealItem}
          className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background-elevated)]/40 p-4"
        >
          <legend className="px-1.5 text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
            {t(locale, "step.attributes.breasts.legend")}
          </legend>
          {field("breastSize")}
          {field("breastType")}
        </motion.fieldset>

        {/* Optional section — a labelled divider gives permission to skip the
            rest of the step. Everything below is non-required. */}
        <motion.div variants={revealItem} className="flex items-center gap-3 pt-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
            {t(locale, "step.attributes.optional.heading")}
          </span>
          <span aria-hidden className="h-px flex-1 bg-[var(--color-border)]" />
        </motion.div>

        <motion.div variants={revealItem}>{field("pubis")}</motion.div>

        <motion.fieldset variants={revealItem} className="flex flex-col gap-2">
          <legend className="text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
            {t(locale, "step.attributes.languages.legend")}
          </legend>
          <p className="text-[11px] text-[var(--color-text-subtle)]">
            {t(locale, "step.attributes.languages.hint")}
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            {catalogs.languages.map((lang) => (
              <ChipChoice
                key={lang}
                multi
                label={lang}
                active={values.languages.includes(lang)}
                onClick={() => toggleLanguage(lang)}
              />
            ))}
          </div>
        </motion.fieldset>
      </motion.div>
    </SectionShell>
  );
}
