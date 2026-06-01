"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Mobile-first default for the catalog layout.
 *
 * The catalog view is URL-driven (`?view=…`) and server-rendered; the default
 * with no param is the desktop-oriented `grid3` (3–4 up). On phones a 1-up
 * "spotlight" reads far better — bigger, immersive cards — so when the visitor
 * lands on `/explorar` with NO explicit view and a mobile-width viewport, we
 * preselect `spotlight`.
 *
 * Why viewport (not user-agent): the decision is about available width, so it
 * must react to the actual viewport — including desktop devtools at a phone
 * width — which only the client knows. An explicit `?view=` always wins, so a
 * user who picked a layout is never overridden.
 *
 * Renders nothing; it only nudges the URL once on mount when the conditions
 * hold. Below the `sm` breakpoint (640px) every view collapses to a single
 * column anyway, so the only visible change is the card aspect — no layout
 * jump, just a richer default.
 */
const MOBILE_QUERY = "(max-width: 639px)";

export function MobileViewDefault({
  hasExplicitView,
}: {
  hasExplicitView: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (hasExplicitView) return;
    if (!window.matchMedia(MOBILE_QUERY).matches) return;

    const url = new URL(window.location.href);
    if (url.searchParams.get("view")) return;
    url.searchParams.set("view", "spotlight");
    router.replace(`${url.pathname}${url.search}`, { scroll: false });
  }, [hasExplicitView, router]);

  return null;
}
