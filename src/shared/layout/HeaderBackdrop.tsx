"use client";

import { useEffect, useState } from "react";

/**
 * Scroll-aware backdrop for the sticky header. Bumps blur, opacity and
 * shadow once the user scrolls past 12px so the header gains presence
 * without overpowering the page at rest.
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
    <div
      aria-hidden
      data-scrolled={scrolled ? "true" : "false"}
      className="pointer-events-none absolute inset-0 -z-10 border-b border-[var(--color-border)]/70 bg-[var(--color-background)]/80 backdrop-blur-xl shadow-none transition-[background,box-shadow,border-color] duration-300 ease-[var(--ease-standard)] data-[scrolled=true]:border-[var(--color-border)] data-[scrolled=true]:bg-[var(--color-background)]/95 data-[scrolled=true]:shadow-[var(--shadow-md)] supports-[backdrop-filter]:bg-[var(--color-background)]/65 supports-[backdrop-filter]:data-[scrolled=true]:bg-[var(--color-background)]/85"
    />
  );
}
