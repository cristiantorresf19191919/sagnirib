import { Play } from "lucide-react";

import type { BiringaVideo } from "@/server/biringas";

import { resolveAssetUrl } from "../lib/asset-url";

interface VideoPlayerProps {
  video: BiringaVideo;
  /** Poster image — defaults to the listing's mainImage. Without a
   *  poster the browser shows the first frame, which on iOS can be
   *  black until interaction. */
  posterUrl?: string | null;
  /** When true (default), the native `controls` are rendered. */
  controls?: boolean;
  className?: string;
}

/**
 * Native HTML5 video player (ADR-015).
 *
 * Stays on `<video controls preload="metadata">` instead of a library
 * (Plyr, video.js, Vidstack) — the cap is 30s per clip, max 2 clips,
 * and the player only exists on the profile surface. Native controls
 * work on every browser including iOS Safari, fight the least with
 * the design system, and ship zero kB of JS.
 *
 * The asset URL is resolved by `resolveAssetUrl` so the same component
 * works in dev (mock GET endpoint) and in prod (Firebase Storage
 * public-download URL). When the path is unresolvable (no Firebase
 * configured + path not in the mock store) the component renders a
 * muted placeholder rather than a broken `<video>` element.
 */
export function VideoPlayer({
  video,
  posterUrl,
  controls = true,
  className = "",
}: Readonly<VideoPlayerProps>) {
  const src = resolveAssetUrl(video.path);

  if (!src) {
    return (
      <div
        className={
          "relative flex aspect-video items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] " +
          className
        }
        aria-label="Video no disponible"
      >
        <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em]">
          <Play className="h-3 w-3" aria-hidden />
          Video no disponible
        </span>
      </div>
    );
  }

  return (
    <div
      className={
        "relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-black " +
        className
      }
    >
      <video
        src={src}
        poster={posterUrl ?? undefined}
        controls={controls}
        playsInline
        preload="metadata"
        className="block aspect-video h-full w-full bg-black"
      />
      <span className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-[var(--color-foreground)]/75 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-surface)]">
        <Play className="h-2.5 w-2.5 fill-current" aria-hidden />
        {formatDuration(video.durationSeconds)}
      </span>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mm = Math.floor(seconds / 60);
  const ss = Math.floor(seconds % 60);
  return `${mm}:${String(ss).padStart(2, "0")}`;
}
