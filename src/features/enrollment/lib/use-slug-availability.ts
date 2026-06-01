"use client";

import { useEffect, useRef, useState } from "react";

import { checkListingTitleAvailability } from "../actions/check-title";

export type SlugAvailabilityStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available" }
  | { state: "taken"; reason: "published" | "draft" }
  | { state: "error" };

/** The terminal states — only these come back from the server. */
type ResolvedStatus = Exclude<
  SlugAvailabilityStatus,
  { state: "idle" } | { state: "checking" }
>;

const DEBOUNCE_MS = 450;

/**
 * Debounced live uniqueness check for the derived profile slug.
 *
 * Fires `checkListingTitleAvailability` (a Server Action that hits Firestore)
 * after the slug stops changing. Only the resolved server answer is stored in
 * state — `idle` (empty slug) and `checking` (answer is for an older slug)
 * are derived at render time, so the effect never calls `setState`
 * synchronously. A monotonically increasing request id discards out-of-order
 * responses so a stale resolve never overwrites a newer one.
 *
 * `ownSlug` is the slug this draft already claims (edit flow). When the
 * current slug equals it, the value is reported `available` with no network
 * call — a draft never collides with itself.
 */
export function useSlugAvailability(
  slug: string,
  ownSlug?: string,
): SlugAvailabilityStatus {
  const [resolved, setResolved] = useState<{
    slug: string;
    status: ResolvedStatus;
  } | null>(null);
  const seq = useRef(0);

  const isOwn = Boolean(slug) && slug === ownSlug;

  useEffect(() => {
    if (!slug || isOwn) return;

    const requestId = ++seq.current;
    const timer = setTimeout(async () => {
      try {
        const res = await checkListingTitleAvailability(slug);
        if (seq.current !== requestId) return; // a newer keystroke won
        const status: ResolvedStatus =
          !res.ok || !res.data
            ? { state: "error" }
            : res.data.available
              ? { state: "available" }
              : { state: "taken", reason: res.data.reason ?? "published" };
        setResolved({ slug, status });
      } catch {
        if (seq.current === requestId) {
          setResolved({ slug, status: { state: "error" } });
        }
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [slug, isOwn]);

  if (!slug) return { state: "idle" };
  if (isOwn) return { state: "available" };
  if (resolved && resolved.slug === slug) return resolved.status;
  return { state: "checking" };
}
