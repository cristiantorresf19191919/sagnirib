"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  Film,
  ImagePlus,
  Loader2,
  Lightbulb,
  Play,
  RotateCw,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";
import { brandConfig } from "@/core/branding/brand-config";
import { motionFM } from "@/shared/design-system/tokens/motion";
import type { EnrollmentCatalogs } from "../lib/catalogs";
import { containsUrl, hasContactLeak } from "../lib/bio-content-rules";
import type {
  DescriptionValues,
  GalleryItem,
  VideoItem,
} from "../lib/types";
import { uploadPhoto, UploadError } from "../lib/upload-photo";
import { CompressionError } from "../lib/compress-image";
import { LIQUID_SPRING } from "../lib/liquid-motion";
import {
  uploadVideo,
  UploadVideoError,
  VIDEO_LIMITS_CLIENT,
} from "../lib/upload-video";
import { CharCounter, ChipChoice, TextAreaField, ToggleSwitch } from "./FormField";
import { SectionShell } from "./SectionShell";
import { PROFILE_TOGGLES_ENABLED, PROFILE_VIDEOS_ENABLED } from "../lib/pricing";

/**
 * Step 2 of the publish wizard.
 *
 * Each photo flows through a 5-state FSM driven by `uploadPhoto`:
 *
 *   queued → compressing → uploading → ready
 *                        └─ → error (with a "Reintentar" button per card)
 *
 * The pipeline runs per-photo in parallel (Promise.all-style fan-out via
 * an effect that fires as soon as a `queued` item appears). Submitting
 * the step is gated by the wizard's NavBar — it asks `isAnyUploadInFlight()`
 * before letting the user advance.
 *
 * Accepted source MIME (input file picker): JPEG, PNG, WebP, HEIC. The
 * compression step normalises everything to JPEG before upload, so the
 * server only ever sees `image/jpeg` (or `image/webp` if a future toggle
 * flips that — schema accepts both).
 */

const ACCEPTED_SOURCE_MIMES: ReadonlySet<string> = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const ACCEPT_ATTR = "image/jpeg,image/png,image/webp,image/heic,image/heif";
/** Hard cap on the user-picked file BEFORE compression. Pre-compression
 *  blobs can be huge (45MP iPhones easily hit 20MB) — we cap at a sane
 *  ceiling that still covers DSLR shots. Post-compression every photo lands
 *  under STORAGE_LIMITS.photoMaxBytes (~4MB) on the server. */
const MAX_SOURCE_BYTES = 40 * 1024 * 1024;
/** Hard cap on how many photos the gallery accepts in the wizard. The plan
 *  may allow more, but the curated "1 cover + up to 4 supporting" layout is
 *  built around five, so we clamp here regardless of `galleryMax`. */
const GALLERY_DISPLAY_MAX = 5;

interface StepDescriptionProps {
  values: DescriptionValues;
  catalogs: Pick<EnrollmentCatalogs, "services" | "meetingContexts">;
  onChange: (next: DescriptionValues) => void;
  /** Stable sessionId from the parent wizard; uploads land under
   *  `users/<uid>/staging/<sessionId>/...`. */
  sessionId: string;
  /** Plan-driven gallery cap. The submit-time DRAFT_LIMITS.galleryMax = 24
   *  is the absolute ceiling regardless of plan. */
  galleryMax: number;
  forceShowErrors: boolean;
}

export function StepDescription({
  values,
  catalogs,
  onChange,
  sessionId,
  galleryMax,
  forceShowErrors,
}: StepDescriptionProps) {
  const locale = useActiveLocale();
  const effectiveMax = Math.min(galleryMax, GALLERY_DISPLAY_MAX);
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());

  function touch(name: string) {
    setTouched((prev) => new Set([...prev, name]));
  }

  function show(name: string): boolean {
    return forceShowErrors || touched.has(name);
  }

  function update<K extends keyof DescriptionValues>(
    key: K,
    value: DescriptionValues[K],
  ) {
    onChange({ ...values, [key]: value });
  }

  function toggleService(s: string) {
    const next = values.services.includes(s)
      ? values.services.filter((x) => x !== s)
      : [...values.services, s];
    update("services", next);
    if (next.length === 0) touch("services");
  }
  function togglePlace(p: string) {
    const has = values.meetingContexts.includes(p);
    update(
      "meetingContexts",
      has
        ? values.meetingContexts.filter((x) => x !== p)
        : [...values.meetingContexts, p],
    );
  }

  const v = (key: string) => t(locale, key);

  const errors = {
    shortBio: !values.shortBio.trim()
      ? v("publicar.validation.shortBio")
      : containsUrl(values.shortBio)
        ? v("publicar.validation.bioUrl")
        : undefined,
    bio: values.bio.trim().length < 60
      ? v("publicar.validation.bioLength")
      : containsUrl(values.bio)
        ? v("publicar.validation.bioUrl")
        : undefined,
    services: values.services.length === 0 ? v("publicar.validation.services") : undefined,
    galleryInFlight: hasInFlightUploads(values.gallery)
      ? v("publicar.validation.galleryInFlight")
      : undefined,
    galleryErrored: hasErroredUploads(values.gallery)
      ? v("publicar.validation.galleryErrored")
      : undefined,
    videosInFlight: hasInFlightVideoUploads(values.videos)
      ? v("publicar.validation.videosInFlight")
      : undefined,
    videosErrored: hasErroredVideoUploads(values.videos)
      ? v("publicar.validation.videosErrored")
      : undefined,
  };

  // ----- Gallery upload pipeline ------------------------------------------
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  // Track in-flight AbortControllers per gallery item id so we can cancel
  // PUTs when the user removes a photo mid-upload.
  const inFlight = useRef<Map<string, AbortController>>(new Map());
  // Avoid double-starting an upload when React StrictMode renders twice.
  const startedIds = useRef<Set<string>>(new Set());

  // Stable reference to current gallery state so concurrent updateItem()
  // calls fired in the same tick (e.g. multiple uploads finishing
  // simultaneously) compose against the latest array instead of clobbering
  // each other with stale props. Ref sync is moved to a layout effect so
  // we never assign to a ref during render.
  const galleryRef = useRef(values.gallery);
  useEffect(() => {
    galleryRef.current = values.gallery;
  }, [values.gallery]);

  const updateItem = useCallback(
    (id: string, patch: Partial<GalleryItem>) => {
      const current = galleryRef.current;
      const next = current.map((item) => (item.id === id ? { ...item, ...patch } : item));
      // Keep ref in sync immediately so concurrent updates within the same tick
      // don't overwrite each other.
      galleryRef.current = next;
      onChange({ ...values, gallery: next });
    },
    [onChange, values],
  );

  const startUpload = useCallback(
    (item: GalleryItem) => {
      if (startedIds.current.has(item.id)) return;
      startedIds.current.add(item.id);
      const controller = new AbortController();
      inFlight.current.set(item.id, controller);
      updateItem(item.id, { status: "compressing", errorMessage: undefined });

      uploadPhoto(item.file, {
        sessionId,
        signal: controller.signal,
        onPhase: (phase) => {
          // "compressing" → "uploading" → "confirming". We collapse
          // "confirming" into "uploading" on the card to keep the UI tight.
          if (phase === "compressing") {
            updateItem(item.id, { status: "compressing" });
          } else {
            updateItem(item.id, { status: "uploading" });
          }
        },
      })
        .then((result) => {
          inFlight.current.delete(item.id);
          updateItem(item.id, {
            status: "ready",
            uploadedPath: result.path,
            compressedSize: result.compressedSize,
            errorMessage: undefined,
          });
        })
        .catch((err: unknown) => {
          inFlight.current.delete(item.id);
          if (err instanceof UploadError && err.kind === "aborted") {
            // User removed the card mid-upload; nothing more to do.
            return;
          }
          const message =
            err instanceof UploadError || err instanceof CompressionError
              ? err.message
              : "No pudimos subir esta foto.";
          updateItem(item.id, {
            status: "error",
            errorMessage: message,
            uploadedPath: undefined,
          });
        });
    },
    [sessionId, updateItem],
  );

  // Whenever a new "queued" item lands in the gallery, kick off its upload.
  useEffect(() => {
    for (const item of values.gallery) {
      if (item.status === "queued") {
        startUpload(item);
      }
    }
  }, [values.gallery, startUpload]);

  // NOTE: We deliberately do NOT revoke blob URLs or abort uploads when this
  // step unmounts. The wizard swaps steps via `AnimatePresence mode="wait"`,
  // so StepDescription unmounts every time the user navigates to another step
  // (e.g. step 4 → step 2). The gallery itself lives in the parent wizard's
  // draft state and outlives this component, so revoking the preview blobs on
  // unmount left the persisted items pointing at dead URLs — the photos
  // vanished here AND in the live preview card the moment you stepped away and
  // came back. Blobs are revoked only on explicit removal (`removeFile` /
  // `removeVideo`); leaving an in-flight upload running across a step switch is
  // also desirable — it finishes in the background and the parent state
  // updates to "ready", so returning to the step shows the completed photo.
  // The browser reclaims any still-open object URLs on full page navigation.

  function openPicker() {
    if (values.gallery.length >= effectiveMax) return;
    setGalleryError(null);
    fileInputRef.current?.click();
  }

  // Shared ingest path for the file picker, drag&drop and paste. Validates
  // MIME + size, caps at the remaining slots, and appends queued items.
  function ingestFiles(picked: ReadonlyArray<File>) {
    if (picked.length === 0) return;
    const remaining = effectiveMax - values.gallery.length;
    if (remaining <= 0) {
      setGalleryError(`Se alcanzó el máximo de ${effectiveMax} fotos.`);
      return;
    }
    const accepted: GalleryItem[] = [];
    const errors: string[] = [];
    let consumedSlots = 0;

    for (const file of picked) {
      if (consumedSlots >= remaining) {
        errors.push(`Se alcanzó el máximo de ${effectiveMax} fotos.`);
        break;
      }
      if (!ACCEPTED_SOURCE_MIMES.has(file.type)) {
        errors.push(`${file.name}: solo JPG, PNG, WebP o HEIC.`);
        continue;
      }
      if (file.size > MAX_SOURCE_BYTES) {
        errors.push(`${file.name}: pesa más de 40 MB sin comprimir.`);
        continue;
      }
      accepted.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
        file,
        status: "queued",
      });
      consumedSlots += 1;
    }

    if (accepted.length > 0) {
      onChange({ ...values, gallery: [...values.gallery, ...accepted] });
    }
    setGalleryError(errors.length > 0 ? errors.join(" ") : null);
  }

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    // Snapshot the FileList into an array BEFORE resetting the input — the
    // input's `.files` is live, so clearing `value` first would empty the
    // list we're about to read (the bug that made picked uploads no-op).
    const files = event.target.files ? Array.from(event.target.files) : [];
    event.target.value = "";
    if (files.length === 0) return;
    ingestFiles(files);
  }

  // Keep a live ref to ingestFiles so the mount-once paste listener never
  // closes over a stale gallery snapshot. Synced in an effect (not during
  // render) so it doesn't trip the no-ref-writes-in-render rule.
  const ingestRef = useRef(ingestFiles);
  useEffect(() => {
    ingestRef.current = ingestFiles;
  });

  // Paste-to-upload (⌘/Ctrl + V) anywhere on the step.
  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const files = event.clipboardData?.files;
      if (!files || files.length === 0) return;
      const images = Array.from(files).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (images.length > 0) ingestRef.current(images);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  // ----- Drag&drop + reorder ----------------------------------------------
  const [dragActive, setDragActive] = useState(false);
  const [reorderId, setReorderId] = useState<string | null>(null);

  function onZoneDragOver(event: React.DragEvent) {
    // Only react to external file drags — internal reorder uses a custom
    // dataTransfer type so it never lights up the dropzone.
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    setDragActive(true);
  }
  function onZoneDragLeave(event: React.DragEvent) {
    if (event.currentTarget === event.target) setDragActive(false);
  }
  function onZoneDrop(event: React.DragEvent) {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    setDragActive(false);
    const dropped = Array.from(event.dataTransfer.files);
    if (dropped.length > 0) ingestFiles(dropped);
  }

  function reorderGallery(fromId: string, toId: string) {
    if (!fromId || fromId === toId) return;
    const arr = [...values.gallery];
    const from = arr.findIndex((i) => i.id === fromId);
    const to = arr.findIndex((i) => i.id === toId);
    if (from < 0 || to < 0) return;
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    onChange({ ...values, gallery: arr });
  }

  function setCover(id: string) {
    const arr = [...values.gallery];
    const idx = arr.findIndex((i) => i.id === id);
    if (idx <= 0) return;
    const [moved] = arr.splice(idx, 1);
    arr.unshift(moved);
    onChange({ ...values, gallery: arr });
  }

  function removeFile(item: GalleryItem) {
    const controller = inFlight.current.get(item.id);
    if (controller) {
      controller.abort();
      inFlight.current.delete(item.id);
    }
    startedIds.current.delete(item.id);
    URL.revokeObjectURL(item.previewUrl);
    onChange({
      ...values,
      gallery: values.gallery.filter((x) => x.id !== item.id),
    });
  }

  function retry(item: GalleryItem) {
    // Reset state and re-enter the queue; the effect picks it up.
    startedIds.current.delete(item.id);
    updateItem(item.id, { status: "queued", errorMessage: undefined });
  }

  const inFlightCount = values.gallery.filter(
    (g) => g.status === "compressing" || g.status === "uploading",
  ).length;

  // ----- Video upload pipeline (ADR-015) ----------------------------------
  // Mirror of the photo pipeline. Same FSM minus compression — videos go
  // straight to a duration-check step and then the signed PUT. Caps at 2.
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoInFlight = useRef<Map<string, AbortController>>(new Map());
  const videoStartedIds = useRef<Set<string>>(new Set());
  const videosRef = useRef(values.videos);
  useEffect(() => {
    videosRef.current = values.videos;
  }, [values.videos]);

  const updateVideo = useCallback(
    (id: string, patch: Partial<VideoItem>) => {
      const current = videosRef.current;
      const next = current.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      );
      videosRef.current = next;
      onChange({ ...values, videos: next });
    },
    [onChange, values],
  );

  const startVideoUpload = useCallback(
    (item: VideoItem) => {
      if (videoStartedIds.current.has(item.id)) return;
      videoStartedIds.current.add(item.id);
      const controller = new AbortController();
      videoInFlight.current.set(item.id, controller);
      updateVideo(item.id, { status: "validating", errorMessage: undefined });

      uploadVideo(item.file, {
        sessionId,
        signal: controller.signal,
        onPhase: (phase) => {
          if (phase === "validating") {
            updateVideo(item.id, { status: "validating" });
          } else {
            updateVideo(item.id, { status: "uploading" });
          }
        },
      })
        .then((result) => {
          videoInFlight.current.delete(item.id);
          updateVideo(item.id, {
            status: "ready",
            uploadedPath: result.path,
            durationSeconds: result.durationSeconds,
            errorMessage: undefined,
          });
        })
        .catch((err: unknown) => {
          videoInFlight.current.delete(item.id);
          if (err instanceof UploadVideoError && err.kind === "aborted") return;
          const message =
            err instanceof UploadVideoError
              ? err.message
              : "No pudimos subir este video.";
          updateVideo(item.id, {
            status: "error",
            errorMessage: message,
            uploadedPath: undefined,
          });
        });
    },
    [sessionId, updateVideo],
  );

  useEffect(() => {
    for (const item of values.videos) {
      if (item.status === "queued") {
        startVideoUpload(item);
      }
    }
  }, [values.videos, startVideoUpload]);

  // Same rationale as the gallery pipeline above: do not revoke blob URLs or
  // abort uploads on step-navigation unmount — the videos live in parent state
  // and must survive switching steps. Blobs are revoked only in `removeVideo`.

  function openVideoPicker() {
    if (values.videos.length >= 2) return;
    setVideoError(null);
    videoInputRef.current?.click();
  }

  function handleVideosSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files;
    if (!picked || picked.length === 0) return;

    const remaining = 2 - values.videos.length;
    const accepted: VideoItem[] = [];
    const errors: string[] = [];
    let consumedSlots = 0;

    for (const file of Array.from(picked)) {
      if (consumedSlots >= remaining) {
        errors.push(`Solo podés subir hasta 2 videos.`);
        break;
      }
      if (
        !(VIDEO_LIMITS_CLIENT.allowedMimes as ReadonlyArray<string>).includes(
          file.type,
        )
      ) {
        errors.push(`${file.name}: solo MP4 o WebM.`);
        continue;
      }
      if (file.size > VIDEO_LIMITS_CLIENT.maxBytes) {
        errors.push(`${file.name}: pesa más de 35 MB.`);
        continue;
      }
      accepted.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
        file,
        status: "queued",
      });
      consumedSlots += 1;
    }

    event.target.value = "";

    if (accepted.length > 0) {
      onChange({ ...values, videos: [...values.videos, ...accepted] });
    }
    setVideoError(errors.length > 0 ? errors.join(" ") : null);
  }

  function removeVideo(item: VideoItem) {
    const controller = videoInFlight.current.get(item.id);
    if (controller) {
      controller.abort();
      videoInFlight.current.delete(item.id);
    }
    videoStartedIds.current.delete(item.id);
    URL.revokeObjectURL(item.previewUrl);
    onChange({
      ...values,
      videos: values.videos.filter((x) => x.id !== item.id),
    });
  }

  function retryVideo(item: VideoItem) {
    videoStartedIds.current.delete(item.id);
    updateVideo(item.id, { status: "queued", errorMessage: undefined });
  }

  const videoInFlightCount = values.videos.filter(
    (v) => v.status === "validating" || v.status === "uploading",
  ).length;

  return (
    <SectionShell
      eyebrow={t(locale, "step.description.eyebrow")}
      title={t(locale, "step.description.title")}
      description={t(locale, "step.description.description")}
    >
      <TextAreaField
        label={t(locale, "step.description.shortBio.label")}
        name="shortBio"
        rows={2}
        maxLength={120}
        placeholder={t(locale, "step.description.shortBio.placeholder")}
        value={values.shortBio}
        onChange={(e) => update("shortBio", e.target.value)}
        onBlur={() => touch("shortBio")}
        footer={<CharCounter count={values.shortBio.length} max={120} />}
        warning={
          hasContactLeak(values.shortBio)
            ? t(locale, "step.description.contactLeak")
            : undefined
        }
        // URL errors surface in real time (a link is never valid here); the
        // empty/length errors still wait for blur or the "next" attempt.
        error={
          containsUrl(values.shortBio) || show("shortBio")
            ? errors.shortBio
            : undefined
        }
      />

      <div className="flex flex-col gap-2">
        <TextAreaField
          label={t(locale, "step.description.bio.label")}
          name="bio"
          rows={6}
          maxLength={1200}
          placeholder={t(locale, "step.description.bio.placeholder")}
          value={values.bio}
          onChange={(e) => update("bio", e.target.value)}
          onBlur={() => touch("bio")}
          footer={
            <CharCounter count={values.bio.length} max={1200} min={60} />
          }
          warning={
            hasContactLeak(values.bio)
              ? t(locale, "step.description.contactLeak")
              : undefined
          }
          // URL errors surface in real time; length error waits for blur/next.
          error={
            containsUrl(values.bio) || show("bio") ? errors.bio : undefined
          }
        />

        {/* Quality nudge — once they've started but are still short, point
            out that fuller bios convert better. Disappears past 200 chars. */}
        {values.bio.trim().length > 0 && values.bio.trim().length < 200 && (
          <p className="text-[11px] text-[var(--color-brand-accent-strong)]">
            {t(locale, "step.description.bio.qualityNudge")}
          </p>
        )}

        {/* Writing help — collapsible example lines. Native <details> so it
            needs no client state and stays keyboard-accessible. */}
        <details className="group/wh rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background-elevated)] px-3 py-2">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[12px] font-semibold text-[var(--color-brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]">
            <Lightbulb className="h-3.5 w-3.5" aria-hidden />
            {t(locale, "step.description.writingHelp.label")}
          </summary>
          <div className="mt-2 flex flex-col gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
              {t(locale, "step.description.writingHelp.intro")}
            </span>
            {(["item1", "item2", "item3"] as const).map((k) => (
              <span
                key={k}
                className="text-[12px] italic leading-relaxed text-[var(--color-text-muted)]"
              >
                “{t(locale, `step.description.writingHelp.${k}`)}”
              </span>
            ))}
          </div>
        </details>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="flex items-center gap-2 text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
          {t(locale, "step.description.services.legend")}
          {values.services.length > 0 && (
            <SelectionCount count={values.services.length} />
          )}
        </legend>
        <p className="text-[11px] text-[var(--color-text-subtle)]">
          {t(locale, "step.description.services.hint")}
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          {catalogs.services.map((service) => (
            <ChipChoice
              key={service}
              multi
              label={service}
              active={values.services.includes(service)}
              onClick={() => toggleService(service)}
            />
          ))}
        </div>
        {show("services") && errors.services && (
          <p role="alert" className="text-[11px] text-[var(--color-brand-highlight)]">
            {errors.services}
          </p>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="flex items-center gap-2 text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
          {t(locale, "step.description.places.legend")}
          {values.meetingContexts.length > 0 && (
            <SelectionCount count={values.meetingContexts.length} />
          )}
        </legend>
        <p className="text-[11px] text-[var(--color-text-subtle)]">
          {t(locale, "step.description.places.hint")}
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          {catalogs.meetingContexts.map((place) => (
            <ChipChoice
              key={place}
              multi
              label={place}
              active={values.meetingContexts.includes(place)}
              onClick={() => togglePlace(place)}
            />
          ))}
        </div>
      </fieldset>

      {PROFILE_TOGGLES_ENABLED && (
        <div className="grid gap-3 md:grid-cols-2">
          <ToggleSwitch
            label={t(locale, "step.description.toggle.faceVisible.label")}
            description={t(locale, "step.description.toggle.faceVisible.body")}
            checked={values.faceVisible}
            onChange={(v) => update("faceVisible", v)}
          />
          <ToggleSwitch
            label={t(locale, "step.description.toggle.paymentByCard.label")}
            description={t(
              locale,
              "step.description.toggle.paymentByCard.body",
            )}
            checked={values.paymentByCard}
            onChange={(v) => update("paymentByCard", v)}
          />
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <span className="text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
            {t(locale, "step.description.gallery.title")}
          </span>
          <span className="text-[11px] text-[var(--color-text-subtle)]">
            {t(locale, "step.description.gallery.counter", {
              count: values.gallery.length,
              max: effectiveMax,
            })}
            {inFlightCount > 0
              ? " " +
                t(locale, "step.description.gallery.uploading", {
                  count: inFlightCount,
                })
              : null}
          </span>
        </div>
        <p className="text-[11px] text-[var(--color-text-subtle)]">
          {t(locale, "step.description.gallery.helper")}
        </p>
        {/* Conversion nudge while the gallery is thin; reorder hint once they
            have a couple of photos to arrange. */}
        {values.gallery.length < 3 ? (
          <p className="text-[11px] font-medium text-[var(--color-brand-accent-strong)]">
            {t(locale, "step.description.gallery.nudge")}
          </p>
        ) : (
          <p className="text-[11px] text-[var(--color-text-subtle)]">
            {t(locale, "step.description.gallery.reorderHint")}
          </p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          onChange={handleFilesSelected}
          className="sr-only"
          aria-hidden
          tabIndex={-1}
        />
        <div
          onDragOver={onZoneDragOver}
          onDragLeave={onZoneDragLeave}
          onDrop={onZoneDrop}
          className={`relative rounded-[var(--radius-lg)] transition-colors ${
            dragActive
              ? "outline outline-2 outline-offset-4 outline-[var(--color-brand-primary)]"
              : "outline-none"
          }`}
        >
          {/* Editorial layout: one large cover on the left and up to four
              supporting thumbnails on the right. The cover is the photo
              visitors see first, so it gets the spotlight (PORTADA ribbon +
              brand ring). Adding/removing/reordering animates via framer-motion
              layout + AnimatePresence; promoting another photo to cover glides
              it into the big slot. */}
          {(() => {
            const items = values.gallery;
            const cover = items[0];
            const rest = items.slice(1);
            const secondarySlots = effectiveMax - 1; // thumbnails beside cover
            const canAddMore = items.length < effectiveMax;
            const filledRest = rest.length;
            // Ghost placeholders telegraph the remaining secondary capacity
            // (after accounting for the visible add tile).
            const ghostCount = Math.max(
              0,
              secondarySlots - filledRest - (canAddMore && items.length > 0 ? 1 : 0),
            );

            const renderCard = (
              item: GalleryItem,
              index: number,
              featured: boolean,
            ) => (
              <GalleryCard
                key={item.id}
                item={item}
                featured={featured}
                isCover={index === 0}
                coverLabel={t(locale, "step.description.gallery.coverBadge")}
                setCoverLabel={t(locale, "step.description.gallery.setCover")}
                dragging={reorderId === item.id}
                onRemove={() => removeFile(item)}
                onRetry={() => retry(item)}
                onSetCover={() => setCover(item.id)}
                onReorderStart={() => setReorderId(item.id)}
                onReorderEnd={() => setReorderId(null)}
                onReorderDrop={(fromId) => {
                  reorderGallery(fromId, item.id);
                  setReorderId(null);
                }}
              />
            );

            return (
              <div className="flex flex-col gap-2.5 sm:flex-row">
                {/* Cover / featured slot */}
                <div className="sm:w-[42%] sm:max-w-[260px] sm:shrink-0">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {cover ? (
                      <motion.div
                        key={cover.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {renderCard(cover, 0, true)}
                      </motion.div>
                    ) : (
                      <button
                        key="cover-empty"
                        type="button"
                        onClick={openPicker}
                        className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-brand-primary)]/40 bg-[var(--color-brand-primary)]/[0.04] text-[var(--color-brand-primary)] transition-colors hover:border-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
                        aria-label={t(locale, "step.description.gallery.add.aria")}
                      >
                        <ImagePlus className="h-7 w-7" aria-hidden />
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                          {t(locale, "step.description.gallery.coverCta")}
                        </span>
                      </button>
                    )}
                  </AnimatePresence>
                </div>

                {/* Supporting thumbnails + add tile + ghosts */}
                <div className="grid flex-1 grid-cols-3 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {rest.map((item, i) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {renderCard(item, i + 1, false)}
                      </motion.div>
                    ))}

                    {canAddMore && items.length > 0 && (
                      <motion.button
                        key="add-tile"
                        layout
                        type="button"
                        onClick={openPicker}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className="flex aspect-[3/4] flex-col items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-background-elevated)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
                        aria-label={t(locale, "step.description.gallery.add.aria")}
                      >
                        <ImagePlus className="h-5 w-5" aria-hidden />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">
                          {t(locale, "step.description.gallery.add.label")}
                        </span>
                      </motion.button>
                    )}

                    {Array.from({ length: ghostCount }).map((_, i) => (
                      <motion.div
                        // biome-ignore lint/suspicious/noArrayIndexKey: positional ghost slots
                        key={`ghost-${i}`}
                        layout
                        aria-hidden
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="aspect-[3/4] rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)]/70 bg-[var(--color-background-elevated)]/40"
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })()}
        </div>
        <p className="text-[11px] text-[var(--color-text-subtle)]">
          {t(locale, "step.description.gallery.pasteHint")}
        </p>
        {galleryError && (
          <p
            role="alert"
            className="text-[11px] text-[var(--color-brand-highlight)]"
          >
            {galleryError}
          </p>
        )}
        {forceShowErrors && (errors.galleryInFlight ?? errors.galleryErrored) && (
          <p role="alert" className="text-[11px] text-[var(--color-brand-highlight)]">
            {errors.galleryInFlight ?? errors.galleryErrored}
          </p>
        )}
      </div>

      {/* Videos block (ADR-015) — max 2 clips, 3..30s each. Optional. */}
      {PROFILE_VIDEOS_ENABLED && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <span className="text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
              {t(locale, "step.description.videos.title")}
            </span>
            <span className="text-[11px] text-[var(--color-text-subtle)]">
              {t(locale, "step.description.videos.counter", {
                count: values.videos.length,
              })}
              {videoInFlightCount > 0
                ? " " +
                  t(locale, "step.description.videos.uploading", {
                    count: videoInFlightCount,
                  })
                : null}
            </span>
          </div>
          <p className="text-[11px] text-[var(--color-text-subtle)]">
            {t(locale, "step.description.videos.helper")}
          </p>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm"
            multiple
            onChange={handleVideosSelected}
            className="sr-only"
            aria-hidden
            tabIndex={-1}
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {values.videos.map((item) => (
              <VideoCard
                key={item.id}
                item={item}
                onRemove={() => removeVideo(item)}
                onRetry={() => retryVideo(item)}
              />
            ))}
            {values.videos.length < 2 && (
              <button
                type="button"
                onClick={openVideoPicker}
                className="flex aspect-video flex-col items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-background-elevated)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
                aria-label={t(locale, "step.description.videos.add.aria")}
              >
                <Film className="h-5 w-5" aria-hidden />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                  {t(locale, "step.description.videos.add.label")}
                </span>
              </button>
            )}
          </div>
          {videoError && (
            <p
              role="alert"
              className="text-[11px] text-[var(--color-brand-highlight)]"
            >
              {videoError}
            </p>
          )}
        {forceShowErrors && (errors.videosInFlight ?? errors.videosErrored) && (
          <p role="alert" className="text-[11px] text-[var(--color-brand-highlight)]">
            {errors.videosInFlight ?? errors.videosErrored}
          </p>
        )}
        </div>
      )}
    </SectionShell>
  );
}

interface VideoCardProps {
  item: VideoItem;
  onRemove: () => void;
  onRetry: () => void;
}

function VideoCard({ item, onRemove, onRetry }: VideoCardProps) {
  const isBusy = item.status === "validating" || item.status === "uploading";
  const isError = item.status === "error";

  return (
    <div className="group relative aspect-video overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
      <video
        src={item.previewUrl}
        muted
        playsInline
        preload="metadata"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity ${
          isBusy || isError ? "opacity-50" : "opacity-100"
        }`}
      />

      {item.status === "ready" && item.durationSeconds && (
        <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-[var(--color-foreground)]/80 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-surface)]">
          <Play className="h-2.5 w-2.5 fill-current" aria-hidden />
          {formatDuration(item.durationSeconds)}
        </span>
      )}

      {isBusy && (
        <span
          aria-live="polite"
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[var(--color-foreground)]/30 text-[var(--color-surface)]"
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
            {item.status === "validating" ? "Validando" : "Subiendo"}
          </span>
        </span>
      )}

      {isError && (
        <button
          type="button"
          onClick={onRetry}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[var(--color-brand-highlight)]/40 text-[var(--color-surface)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
          title={item.errorMessage ?? "Reintentar subida"}
        >
          <AlertCircle className="h-5 w-5" aria-hidden />
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em]">
            <RotateCw className="h-3 w-3" aria-hidden />
            Reintentar
          </span>
        </button>
      )}

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar ${item.name}`}
        className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-foreground)]/80 text-[var(--color-surface)] opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
      >
        <X className="h-3 w-3" aria-hidden />
      </button>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mm = Math.floor(seconds / 60);
  const ss = Math.floor(seconds % 60);
  return `${mm}:${String(ss).padStart(2, "0")}`;
}

interface GalleryCardProps {
  item: GalleryItem;
  isCover: boolean;
  /** When true the card renders larger as the spotlight cover tile. */
  featured?: boolean;
  coverLabel: string;
  setCoverLabel: string;
  dragging: boolean;
  onRemove: () => void;
  onRetry: () => void;
  onSetCover: () => void;
  onReorderStart: () => void;
  onReorderEnd: () => void;
  onReorderDrop: (fromId: string) => void;
}

const REORDER_MIME = "text/x-gallery-id";

function GalleryCard({
  item,
  isCover,
  featured = false,
  coverLabel,
  setCoverLabel,
  dragging,
  onRemove,
  onRetry,
  onSetCover,
  onReorderStart,
  onReorderEnd,
  onReorderDrop,
}: GalleryCardProps) {
  const isBusy = item.status === "compressing" || item.status === "uploading";
  const isError = item.status === "error";
  const prefersReduced = useReducedMotion();
  // "Sello Biringas": the watermark is baked during `compressing`, so we treat
  // that phase as the visible "sealing" moment and name it "Protegiendo".
  const isSealing = item.status === "compressing";
  const busyLabel = isSealing ? "Protegiendo" : "Subiendo";
  // Read the mark from the single source of truth — never the literal string —
  // so a rebrand updates the stamp AND the baked watermark together.
  const markText = brandConfig.name;
  // Scale the type to the tile so the mosaic reads on small (non-featured)
  // cards instead of turning into noise.
  const markFontSize = featured ? 11 : 8;
  const markTileW = Math.round(markFontSize * 6.4);
  const markTileH = Math.round(markFontSize * 2.8);
  // Per-card ids so the SVG <defs> never collide across cards (orb pattern).
  const patternId = `wm-${item.id}`;
  const shineId = `shine-${item.id}`;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData(REORDER_MIME, item.id);
        onReorderStart();
      }}
      onDragEnd={onReorderEnd}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes(REORDER_MIME)) e.preventDefault();
      }}
      onDrop={(e) => {
        const fromId = e.dataTransfer.getData(REORDER_MIME);
        if (!fromId) return;
        e.preventDefault();
        e.stopPropagation();
        onReorderDrop(fromId);
      }}
      className={`group relative aspect-[3/4] cursor-grab overflow-hidden border bg-[var(--color-surface-muted)] transition-[opacity,box-shadow,border-color] active:cursor-grabbing ${
        featured ? "rounded-[var(--radius-lg)]" : "rounded-[var(--radius-md)]"
      } ${
        isCover
          ? "border-[var(--color-brand-primary)] shadow-[var(--shadow-glow-primary)] ring-2 ring-[var(--color-brand-primary)]/20"
          : "border-[var(--color-border)]"
      } ${dragging ? "opacity-40 ring-2 ring-[var(--color-brand-primary)]" : ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.previewUrl}
        alt={item.name}
        draggable={false}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity ${
          isBusy || isError ? "opacity-50" : "opacity-100"
        }`}
      />

      {/* Cover badge on the first photo — larger ribbon on the featured tile. */}
      {isCover && (
        <span
          className={`pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-primary)] font-bold uppercase tracking-[0.12em] text-[var(--color-surface)] shadow-[var(--shadow-sm)] ${
            featured ? "px-2.5 py-1 text-[10px]" : "px-2 py-0.5 text-[9px]"
          }`}
        >
          <Star className={featured ? "h-3 w-3 fill-current" : "h-2.5 w-2.5 fill-current"} aria-hidden />
          {coverLabel}
        </span>
      )}

      {/* "Make cover" — appears on hover for non-cover, ready photos. */}
      {!isCover && item.status === "ready" && (
        <button
          type="button"
          onClick={onSetCover}
          className="absolute inset-x-1.5 bottom-1.5 inline-flex items-center justify-center rounded-full bg-[var(--color-foreground)]/80 px-2 py-1 text-[10px] font-semibold text-[var(--color-surface)] opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
        >
          {setCoverLabel}
        </button>
      )}

      {isBusy && (
        <span
          aria-live="polite"
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[var(--color-foreground)]/30 text-[var(--color-surface)]"
        >
          {/* "Sello Biringas": the brand mark stamps onto the photo during the
              watermarking step (baked inside `compressing`), so the anti-theft
              moment is finally visible. The stamp unmounts before the long,
              concurrent upload phase to protect the mobile frame budget. */}
          <AnimatePresence>
            {isSealing && (
              <motion.svg
                key="stamp"
                viewBox="0 0 100 133"
                preserveAspectRatio="xMidYMid slice"
                className="pointer-events-none absolute inset-0 h-full w-full"
                aria-hidden
                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 1.35 }}
                animate={prefersReduced ? { opacity: 0.45 } : { opacity: 0.45, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: motionFM.fast } }}
                transition={
                  prefersReduced
                    ? { duration: motionFM.base, ease: motionFM.standardEase }
                    : {
                        // Slosh-settle from the shared brand spring; opacity is a
                        // plain fade so the keyframe never fights the spring.
                        scale: LIQUID_SPRING,
                        opacity: { duration: motionFM.base, ease: motionFM.standardEase },
                      }
                }
              >
                <defs>
                  {/* -24° mirrors the canvas watermark angle. Fixed white fill +
                      dark stroke (not tokens) so the stamp reads the same in
                      light AND dark themes, matching the baked mark — a
                      documented SVG geometry exception, like the canvas draw. */}
                  <pattern
                    id={patternId}
                    width={markTileW}
                    height={markTileH}
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(-24)"
                  >
                    <text
                      x="2"
                      y={Math.round(markFontSize * 1.2)}
                      fill="#ffffff"
                      stroke="rgba(0, 0, 0, 0.5)"
                      strokeWidth="0.4"
                      style={{ fontSize: markFontSize, fontWeight: 700, letterSpacing: 0.4 }}
                    >
                      {markText}
                    </text>
                  </pattern>
                  <linearGradient id={shineId} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0.35" stopColor="var(--color-gold)" stopOpacity="0" />
                    <stop offset="0.5" stopColor="var(--color-gold)" stopOpacity="0.55" />
                    <stop offset="0.65" stopColor="var(--color-gold)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <rect width="100" height="133" fill={`url(#${patternId})`} />
                {/* Gold shine sweeps the letters once — directional reveal, pure
                    transform (x), no mask-image (Safari-safe). Decorative, so
                    it is skipped under reduced motion. */}
                {!prefersReduced && (
                  <motion.rect
                    width="100"
                    height="133"
                    fill={`url(#${shineId})`}
                    initial={{ x: -100 }}
                    animate={{ x: 100 }}
                    transition={{
                      duration: motionFM.slow,
                      ease: motionFM.standardEase,
                      delay: 0.12,
                    }}
                  />
                )}
              </motion.svg>
            )}
          </AnimatePresence>

          {/* Protection pin — pops in while sealing (fade only when reduced). */}
          {isSealing && (
            <motion.span
              className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-gold)] text-[var(--color-foreground)]"
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0 }}
              animate={prefersReduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              transition={
                prefersReduced
                  ? { duration: motionFM.fast }
                  : { type: "spring", stiffness: 420, damping: 16, delay: 0.1 }
              }
            >
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            </motion.span>
          )}

          {/* Phase label crossfades Protegiendo → Subiendo (not a hard swap).
              The spinner returns for the upload phase. */}
          <span className="z-10 flex flex-col items-center gap-1">
            {!isSealing && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={busyLabel}
                initial={prefersReduced ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: motionFM.fast, ease: motionFM.standardEase }}
                className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              >
                {busyLabel}
              </motion.span>
            </AnimatePresence>
          </span>
        </span>
      )}

      {isError && (
        <button
          type="button"
          onClick={onRetry}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[var(--color-brand-highlight)]/40 text-[var(--color-surface)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
          title={item.errorMessage ?? "Reintentar subida"}
        >
          <AlertCircle className="h-5 w-5" aria-hidden />
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em]">
            <RotateCw className="h-3 w-3" aria-hidden />
            Reintentar
          </span>
        </button>
      )}

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar ${item.name}`}
        className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-foreground)]/80 text-[var(--color-surface)] opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
      >
        <X className="h-3 w-3" aria-hidden />
      </button>
    </div>
  );
}

/** Tiny count badge shown next to a multi-select legend. */
function SelectionCount({ count }: { count: number }) {
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-1.5 text-[10px] font-bold text-[var(--color-surface)]">
      {count}
    </span>
  );
}

/** Utility surfaced for the wizard's NavBar so submit can be gated. */
export function hasInFlightUploads(gallery: ReadonlyArray<GalleryItem>): boolean {
  return gallery.some(
    (g) => g.status === "queued" || g.status === "compressing" || g.status === "uploading",
  );
}

export function hasErroredUploads(gallery: ReadonlyArray<GalleryItem>): boolean {
  return gallery.some((g) => g.status === "error");
}

/** Same gates for video clips (ADR-015). */
export function hasInFlightVideoUploads(
  videos: ReadonlyArray<VideoItem>,
): boolean {
  return videos.some(
    (v) =>
      v.status === "queued" ||
      v.status === "validating" ||
      v.status === "uploading",
  );
}

export function hasErroredVideoUploads(
  videos: ReadonlyArray<VideoItem>,
): boolean {
  return videos.some((v) => v.status === "error");
}
