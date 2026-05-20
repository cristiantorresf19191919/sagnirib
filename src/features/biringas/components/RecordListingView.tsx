"use client";

import { useEffect, useRef } from "react";

import { recordListingView } from "../actions/record-listing-view";

interface RecordListingViewProps {
  slug: string;
}

/**
 * Invisible mount-time beacon that bumps `reputation.totalViews` for a
 * listing. Mounted from the profile Server Component on `/p/[slug]` so the
 * page itself stays a Server Component; only this tiny island hydrates.
 *
 * Dedupe is server-side (httpOnly cookie, 24h) — the local `useRef` guard
 * only prevents the double-fire that React's strict mode would otherwise
 * cause in dev. Real per-visitor dedupe lives in
 * `@/server/biringas#recordListingView`.
 */
export function RecordListingView({ slug }: Readonly<RecordListingViewProps>) {
  const firedRef = useRef(false);
  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    void recordListingView(slug);
  }, [slug]);
  return null;
}
