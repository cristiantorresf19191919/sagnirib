"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

import { ACCENT, TIPS } from "./loading-tips-data";

// Account holders are sellers — show only the tips that speak to growing,
// protecting and completing their profile (not buyer-side safety advice).
const ACCOUNT_TIPS = TIPS.filter((tip) => tip.audience.includes("seller"));

const ROTATE_MS = 5000;

/**
 * Inline "consejos para tu perfil" rotator for the signed-in loading screen.
 *
 * Reuses the canonical tip catalogue (filtered to the seller audience) so no
 * copy is forked. Unlike the public `LoadingTips` overlay this renders inline
 * beneath the big loader and randomises its starting tip on mount so a quick
 * load doesn't always show the same one.
 *
 * Hydration-safe: SSR and the first client render both show index 0; the
 * random pick happens in an effect, after hydration. The rotation interval is
 * plain JS (not a gated CSS animation), so tips keep cycling even under
 * `prefers-reduced-motion` — only the per-tip fade (a `.motion-*` utility) is
 * suppressed there.
 */
export function AccountLoadingTips() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const len = ACCOUNT_TIPS.length;
    // Random first tip once we're on the client. Deferred to a macrotask so it
    // doesn't fire a synchronous in-effect setState, and stays hydration-safe
    // (SSR + first client render both show index 0, then this re-picks).
    const seed = window.setTimeout(
      () => setIndex(Math.floor(Math.random() * len)),
      0,
    );
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % len);
    }, ROTATE_MS);
    return () => {
      window.clearTimeout(seed);
      window.clearInterval(id);
    };
  }, []);

  const tip = ACCOUNT_TIPS[index]!;
  const accent = ACCENT[tip.kind];
  const Icon = tip.icon;

  // Remount key replays the fade-up keyframe each rotation.
  const key = useMemo(() => `acct-tip-${index}`, [index]);

  return (
    <aside
      data-testid="account-loading-tips"
      aria-live="polite"
      aria-label="Consejos para tu perfil"
      className="relative w-full max-w-[460px] overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-5 py-4 shadow-[0_24px_56px_-30px_rgba(20,28,24,0.30)] backdrop-blur-md"
    >
      {/* Soft accent aurora — shifts mood with the active tip's category. */}
      <span
        aria-hidden
        className={`pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full opacity-50 blur-3xl ${accent.text}`}
        style={{ background: "currentColor" }}
      />

      <div key={key} className="motion-safe:motion-hero-reveal relative flex items-start gap-4">
        <span
          aria-hidden
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ${accent.ring}`}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span
            className={`inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] ${accent.text}`}
          >
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rotate-45 bg-current opacity-70"
            />
            {tip.eyebrow}
          </span>
          <p className="mt-1.5 font-[var(--font-serif)] text-[14.5px] leading-[1.5] text-[var(--color-foreground)]">
            {tip.body}
          </p>
        </div>
        <Sparkles
          className="hidden h-3.5 w-3.5 shrink-0 text-[var(--color-gold)]/70 motion-safe:motion-sparkle-float sm:block"
          aria-hidden
        />
      </div>

      {/* Progress dots — orient the user that tips rotate. */}
      <div
        aria-hidden
        className="relative mt-4 flex flex-wrap items-center justify-center gap-1.5"
      >
        {ACCOUNT_TIPS.map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-[width,background-color] duration-500 ease-[var(--ease-standard)] ${
              i === index
                ? "w-5 bg-[var(--color-brand-primary)]"
                : "w-1 bg-[var(--color-border)]"
            }`}
          />
        ))}
      </div>
    </aside>
  );
}
