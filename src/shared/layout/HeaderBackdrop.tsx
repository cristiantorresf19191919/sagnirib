"use client";

import { useEffect, useState } from "react";

/**
 * Scroll-aware backdrop for the sticky header. Bumps blur, opacity and
 * shadow once the user scrolls past 12px so the header gains presence
 * without overpowering the page at rest.
 *
 * Two layers stacked at -z-10:
 *   - the surface (blurred translucent background + bottom border)
 *   - a gold hairline accent that fades in only when scrolled — gives
 *     the header a premium "sticky" signal without adding a heavy
 *     shadow
 */
export function HeaderBackdrop() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div
        aria-hidden
        data-scrolled={scrolled ? "true" : "false"}
        className="pointer-events-none absolute inset-0 -z-10 border-b border-[var(--color-border)]/70 bg-[var(--color-background)]/80 backdrop-blur-xl shadow-none transition-[background,box-shadow,border-color] duration-300 ease-[var(--ease-standard)] data-[scrolled=true]:border-[var(--color-border)] data-[scrolled=true]:bg-[var(--color-background)]/95 data-[scrolled=true]:shadow-[var(--shadow-md)] supports-[backdrop-filter]:bg-[var(--color-background)]/65 supports-[backdrop-filter]:data-[scrolled=true]:bg-[var(--color-background)]/85"
      />
      {/* Gold hairline accent — sits just below the header border. Hidden
          at rest; eases in once the user scrolls past the threshold so
          the header gains a tiny editorial flourish without a heavy
          divider. */}
      <div
        aria-hidden
        data-scrolled={scrolled ? "true" : "false"}
        className="pointer-events-none absolute inset-x-0 -bottom-px -z-10 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)]/55 to-transparent opacity-0 transition-opacity duration-500 ease-[var(--ease-standard)] data-[scrolled=true]:opacity-100"
      />
    </>
  );
}
