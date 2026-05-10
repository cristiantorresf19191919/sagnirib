"use client";

import { useId, useMemo, useState } from "react";

/**
 * Serializable formatter discriminator. The slider runs in a Client
 * Component but its parent is a Server Component — Next 16 forbids passing
 * functions across that boundary unless they are Server Actions. So the
 * parent passes a string token and this component owns the formatting.
 *
 * Add new tokens as needed; keep them stable, named after the intent
 * (`currency`, `age`, `percent`), not the visual output.
 */
export type RangeSliderFormat = "currency" | "age" | "plain";

const PRICE_FORMAT = new Intl.NumberFormat("es-CO");

function formatValue(value: number, kind: RangeSliderFormat): string {
  switch (kind) {
    case "currency":
      return `$${PRICE_FORMAT.format(value)}`;
    case "age":
      return `${value} años`;
    case "plain":
    default:
      return String(value);
  }
}

interface RangeSliderProps {
  label: string;
  /** Hidden input names — the catalog GET form will pick these up. */
  minName: string;
  maxName: string;
  /** Absolute bounds of the track. */
  min: number;
  max: number;
  step: number;
  /** Current bound values from the URL — undefined means "no bound". */
  initialMin?: number;
  initialMax?: number;
  /**
   * Serializable formatter token. Replaces the prior `format: (n) => string`
   * which broke Server → Client serialization in Next 16.
   */
  format: RangeSliderFormat;
  /** Optional preset chips rendered below the track. */
  presets?: ReadonlyArray<{ label: string; min?: number; max?: number }>;
}

/**
 * Dual-thumb range slider with a connected fill. Tracks two values entirely
 * on the client and writes them into hidden inputs so the surrounding GET
 * form picks them up on submit. When a thumb sits at the absolute bound,
 * the corresponding hidden input is omitted — that way the URL stays clean
 * and the catalog defaults to "no bound" rather than `priceMin=0`.
 *
 * Implementation note: two stacked native `<input type="range">` thumbs
 * share a track and a CSS-styled fill. Native inputs keep the slider
 * fully keyboard-accessible (arrows / page up / home / end) without any
 * extra ARIA wiring.
 */
export function RangeSlider({
  label,
  minName,
  maxName,
  min,
  max,
  step,
  initialMin,
  initialMax,
  format,
  presets,
}: RangeSliderProps) {
  const id = useId();
  const [low, setLow] = useState<number>(initialMin ?? min);
  const [high, setHigh] = useState<number>(initialMax ?? max);

  const lowPct = useMemo(
    () => ((low - min) / (max - min)) * 100,
    [low, min, max],
  );
  const highPct = useMemo(
    () => ((high - min) / (max - min)) * 100,
    [high, min, max],
  );

  const lowLabel = low > min ? formatValue(low, format) : "Sin mínimo";
  const highLabel = high < max ? formatValue(high, format) : "Sin máximo";

  function clampLow(next: number) {
    const ceiling = Math.max(min, high - step);
    setLow(Math.min(Math.max(min, next), ceiling));
  }
  function clampHigh(next: number) {
    const floor = Math.min(max, low + step);
    setHigh(Math.max(Math.min(max, next), floor));
  }

  function applyPreset(preset: NonNullable<RangeSliderProps["presets"]>[number]) {
    if (preset.min !== undefined) clampLow(preset.min);
    else setLow(min);
    if (preset.max !== undefined) clampHigh(preset.max);
    else setHigh(max);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
          {label}
        </span>
        <span className="text-[11px] tabular-nums text-[var(--color-text-muted)]">
          <span className="text-[var(--color-foreground)]">{lowLabel}</span>
          <span className="px-1.5 text-[var(--color-text-subtle)]">·</span>
          <span className="text-[var(--color-foreground)]">{highLabel}</span>
        </span>
      </div>

      <div className="relative h-9 select-none">
        {/* Track */}
        <div
          aria-hidden
          className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[var(--color-surface-muted)]"
        />
        {/* Fill */}
        <div
          aria-hidden
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[var(--color-brand-primary)] shadow-[0_0_0_1px_var(--color-brand-primary)/30] transition-[left,right] duration-150 ease-[var(--ease-standard)]"
          style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }}
        />

        <input
          id={`${id}-low`}
          type="range"
          aria-label={`${label} mínimo`}
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={(e) => clampLow(Number(e.target.value))}
          className="range-slider-thumb absolute left-0 right-0 top-1/2 h-9 w-full -translate-y-1/2 appearance-none bg-transparent"
          style={{ zIndex: low >= high - step ? 4 : 3 }}
        />
        <input
          id={`${id}-high`}
          type="range"
          aria-label={`${label} máximo`}
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={(e) => clampHigh(Number(e.target.value))}
          className="range-slider-thumb absolute left-0 right-0 top-1/2 h-9 w-full -translate-y-1/2 appearance-none bg-transparent"
          style={{ zIndex: 3 }}
        />
      </div>

      {/* Hidden inputs — only emit when bound is non-default. */}
      {low > min ? <input type="hidden" name={minName} value={low} /> : null}
      {high < max ? <input type="hidden" name={maxName} value={high} /> : null}

      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => {
            const matches =
              (preset.min ?? min) === low && (preset.max ?? max) === high;
            return (
              <button
                key={preset.label}
                type="button"
                aria-pressed={matches}
                onClick={() => applyPreset(preset)}
                className={`inline-flex h-7 items-center rounded-full border px-3 text-[11px] font-medium transition-[border-color,background,color] duration-150 ease-[var(--ease-standard)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${
                  matches
                    ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-brand-primary-soft)] hover:text-[var(--color-foreground)]"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
