"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * App-level page transition.
 *
 * Next 16 template.tsx re-mounts on every navigation (unlike layout.tsx),
 * so a CSS keyframe applied to the wrapper fires once per route change.
 *
 * Why CSS instead of framer-motion: a motion.div with `initial={{ opacity: 0 }}`
 * emits `style="opacity:0..."` into the SSR markup. When the route is in
 * Next 16's LoadingBoundary, the server tree (motion.div with inline style)
 * doesn't match the client tree (Suspense fallback), producing the React
 * hydration mismatch error we saw in production. A pure CSS animation
 * doesn't bake a starting style into the server HTML — the keyframe is the
 * only thing transforming the element — so SSR and CSR markup are
 * identical and hydration is clean.
 *
 * The `motion-safe:` variant short-circuits the animation when the user
 * has prefers-reduced-motion set (handled via the @media block in
 * globals.css).
 *
 * `key={pathname}` forces a fresh mount on each navigation; CSS animations
 * fire on first paint of an element, so the new mount re-runs the keyframe
 * cleanly.
 */
export default function Template({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="motion-safe:motion-page-in">
      {children}
    </div>
  );
}
