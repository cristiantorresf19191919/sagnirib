"use client";

import { useEffect } from "react";

import { recordView } from "../store/recently-viewed";

interface RecordRecentViewProps {
  id: string;
  slug: string;
  name: string;
  image: string;
  city: string;
  /** Pre-formatted price string (server provides it to keep formatting consistent). */
  price: string;
}

/**
 * Invisible mount-time recorder — pushed onto the profile page so the user's
 * visit lands in the localStorage history. Keeps the profile page itself a
 * Server Component; only this tiny island hydrates on the client.
 *
 * Renders nothing. The single `useEffect` fires once on mount with the
 * server-provided listing snapshot; subsequent re-renders (HMR, prop change)
 * just refresh the `viewedAt` timestamp via the store's dedupe-by-id logic.
 */
export function RecordRecentView({
  id,
  slug,
  name,
  image,
  city,
  price,
}: Readonly<RecordRecentViewProps>) {
  useEffect(() => {
    recordView({ id, slug, name, image, city, price });
  }, [id, slug, name, image, city, price]);

  return null;
}
