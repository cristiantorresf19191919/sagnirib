/**
 * Brand "liquid" loader for route transitions.
 *
 * A thick broken gradient ring (forest → gold) with rounded, blob-like ends
 * and two detached droplets in the gap — a soft glow aura sits behind it, and
 * a faint inner arc counter-rotates for depth.
 *
 * Why this is a Server Component with **CSS** rotation, not framer-motion:
 * it renders inside `loading.tsx`, the Suspense fallback shown *while* the
 * destination route is loading and hydrating. A JS/framer-motion animation
 * can't start until that client code hydrates — which is exactly the work the
 * user is waiting on — so the spinner would sit frozen on its SSR markup. A
 * CSS animation runs on the compositor straight from the streamed HTML, with
 * zero dependency on hydration, so the spin is live the instant the fallback
 * paints.
 *
 * Rotation lives on wrapping `<div>`s (HTML transform-origin defaults to the
 * element centre) rather than on the SVG shape, whose rotation relies on
 * `transform-box`/`transform-origin` that older engines honour inconsistently.
 *
 * The glow is an `feGaussianBlur` of the *same* shape, so its colour always
 * tracks the gradient and everything stays tokenised. The spin utilities are
 * gated by the global `prefers-reduced-motion` block in globals.css — under
 * reduced motion the rings hold still as a calm static indicator.
 */

// Main ring: r = 20 → circumference ≈ 125.7. ~62% drawn, the rest is the gap
// where the two droplets live. Rounded caps give the liquid blob ends.
const MAIN_DASH = "78 48";
// Inner accent arc: r = 12 → circumference ≈ 75.4. A short ~22% sweep.
const INNER_DASH = "16 60";

interface RouteSpinnerProps {
  label: string;
  /** `md` (default) = 80px for inline route fallbacks; `lg` = 240px (3×) for
   *  the centred, full-screen account loading experience. */
  size?: "md" | "lg";
}

export function RouteSpinner({ label, size = "md" }: RouteSpinnerProps) {
  const isLg = size === "lg";
  return (
    <div
      data-testid="route-spinner"
      className={`flex flex-col items-center justify-center ${
        isLg ? "gap-8" : "min-h-[60vh] gap-6"
      }`}
    >
      <div className={`relative ${isLg ? "h-60 w-60" : "h-20 w-20"}`}>
        {/* Outer liquid ring + droplets + glow, spun as one rigid unit. */}
        <div className="route-spinner-outer absolute inset-0 will-change-transform">
          <svg
            viewBox="0 0 56 56"
            fill="none"
            aria-hidden
            className="h-full w-full"
          >
            <defs>
              <linearGradient
                id="route-spinner-grad"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0" stopColor="var(--color-brand-primary)" />
                <stop offset="0.55" stopColor="var(--color-gold)" />
                <stop
                  offset="1"
                  stopColor="var(--color-brand-primary-strong)"
                />
              </linearGradient>
              {/* Generous region so the blur halo is never clipped. */}
              <filter
                id="route-spinner-glow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="2.4" />
              </filter>

              {/* The shape, defined once so the glow can re-use it. */}
              <g id="route-spinner-shape">
                <circle
                  cx="28"
                  cy="28"
                  r="20"
                  stroke="url(#route-spinner-grad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={MAIN_DASH}
                />
                {/* Two droplets riding in the ring's gap. */}
                <circle cx="20" cy="9.5" r="2.4" fill="var(--color-gold)" />
                <circle
                  cx="38.5"
                  cy="11"
                  r="1.9"
                  fill="var(--color-brand-primary)"
                />
              </g>
            </defs>

            {/* Glow aura, then the crisp shape on top. */}
            <use
              href="#route-spinner-shape"
              filter="url(#route-spinner-glow)"
              opacity="0.55"
            />
            <use href="#route-spinner-shape" />
          </svg>
        </div>

        {/* Faint inner arc — counter-rotates for a subtle liquid-flux depth. */}
        <div className="route-spinner-inner absolute inset-0 will-change-transform">
          <svg
            viewBox="0 0 56 56"
            fill="none"
            aria-hidden
            className="h-full w-full"
          >
            <circle
              cx="28"
              cy="28"
              r="12"
              stroke="var(--color-brand-primary-soft)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={INNER_DASH}
            />
          </svg>
        </div>
      </div>

      <span
        className={`font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)] ${
          isLg ? "text-[13px]" : "text-[11px]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
