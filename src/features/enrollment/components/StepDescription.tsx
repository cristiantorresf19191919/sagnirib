"use client";

import { AlertCircle, ImagePlus, Loader2, RotateCw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { EnrollmentCatalogs } from "../lib/catalogs";
import type { DescriptionValues, GalleryItem } from "../lib/types";
import { uploadPhoto, UploadError } from "../lib/upload-photo";
import { CompressionError } from "../lib/compress-image";
import { ChipChoice, TextAreaField, ToggleSwitch } from "./FormField";
import { SectionShell } from "./SectionShell";

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
}

export function StepDescription({
  values,
  catalogs,
  onChange,
  sessionId,
  galleryMax,
}: StepDescriptionProps) {
  function update<K extends keyof DescriptionValues>(
    key: K,
    value: DescriptionValues[K],
  ) {
    onChange({ ...values, [key]: value });
  }

  function toggleService(s: string) {
    const has = values.services.includes(s);
    update(
      "services",
      has ? values.services.filter((x) => x !== s) : [...values.services, s],
    );
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

  // ----- Gallery upload pipeline ------------------------------------------
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  // Track in-flight AbortControllers per gallery item id so we can cancel
  // PUTs when the user removes a photo mid-upload.
  const inFlight = useRef<Map<string, AbortController>>(new Map());
  // Avoid double-starting an upload when React StrictMode renders twice.
  const startedIds = useRef<Set<string>>(new Set());

  // Stable reference to current gallery state so the effect that watches
  // for queued items doesn't re-fire on every keystroke elsewhere.
  const galleryRef = useRef(values.gallery);
  galleryRef.current = values.gallery;

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

  // Best-effort cleanup of blob URLs and in-flight requests on unmount.
  useEffect(() => {
    return () => {
      for (const controller of inFlight.current.values()) controller.abort();
      for (const item of galleryRef.current) {
        if (item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      }
    };
  }, []);

  function openPicker() {
    if (values.gallery.length >= galleryMax) return;
    setGalleryError(null);
    fileInputRef.current?.click();
  }

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files;
    if (!picked || picked.length === 0) return;

    const remaining = galleryMax - values.gallery.length;
    const accepted: GalleryItem[] = [];
    const errors: string[] = [];
    let consumedSlots = 0;

    for (const file of Array.from(picked)) {
      if (consumedSlots >= remaining) {
        errors.push(`Se alcanzó el máximo de ${galleryMax} fotos.`);
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

    event.target.value = "";

    if (accepted.length > 0) {
      onChange({ ...values, gallery: [...values.gallery, ...accepted] });
    }
    setGalleryError(errors.length > 0 ? errors.join(" ") : null);
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

  return (
    <SectionShell
      eyebrow="Tu historia"
      title="Lo que leerán y verán los visitantes"
      description="Una descripción honesta y unas buenas fotos triplican la respuesta. Tómate el tiempo aquí."
    >
      <TextAreaField
        label="Descripción corta"
        name="shortBio"
        rows={2}
        maxLength={120}
        placeholder="Una frase que te describa. Aparece debajo de tu foto principal."
        value={values.shortBio}
        onChange={(e) => update("shortBio", e.target.value)}
        hint={`${values.shortBio.length} / 120 caracteres`}
      />
      <TextAreaField
        label="Sobre ti"
        name="bio"
        rows={6}
        maxLength={1200}
        placeholder="Cuenta quién eres, qué disfrutas, cómo es la experiencia contigo. Sin información de contacto — la añadimos en el siguiente paso."
        value={values.bio}
        onChange={(e) => update("bio", e.target.value)}
        hint={`${values.bio.length} / 1200 caracteres · evita números de teléfono y enlaces externos.`}
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
          Servicios incluidos
        </legend>
        <p className="text-[11px] text-[var(--color-text-subtle)]">
          Selecciona los servicios que ofreces. Aparecen como chips en tu
          perfil y se conectan con los filtros del catálogo.
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          {catalogs.services.map((service) => (
            <ChipChoice
              key={service}
              label={service}
              active={values.services.includes(service)}
              onClick={() => toggleService(service)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
          Lugar de encuentro
        </legend>
        <p className="text-[11px] text-[var(--color-text-subtle)]">
          Dónde aceptas reunirte. Mostrado como filtro de búsqueda.
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          {catalogs.meetingContexts.map((place) => (
            <ChipChoice
              key={place}
              label={place}
              active={values.meetingContexts.includes(place)}
              onClick={() => togglePlace(place)}
            />
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 md:grid-cols-3">
        <ToggleSwitch
          label="Cara visible"
          description="Indica que muestras el rostro en al menos una foto."
          checked={values.faceVisible}
          onChange={(v) => update("faceVisible", v)}
        />
        <ToggleSwitch
          label="Pago con tarjeta"
          description="Tu perfil aparece en el filtro de tarjetas aceptadas."
          checked={values.paymentByCard}
          onChange={(v) => update("paymentByCard", v)}
        />
        <ToggleSwitch
          label="Disponible ahora"
          description="Activa esto cuando estés disponible — aparece como urgente."
          checked={values.availableNow}
          onChange={(v) => update("availableNow", v)}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <span className="text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]">
            Galería de fotos
          </span>
          <span className="text-[11px] text-[var(--color-text-subtle)]">
            {values.gallery.length} / {galleryMax}
            {inFlightCount > 0 ? ` · ${inFlightCount} subiendo` : null}
          </span>
        </div>
        <p className="text-[11px] text-[var(--color-text-subtle)]">
          Comprimimos cada foto antes de subirla (calidad alta, sin EXIF —
          tus metadatos quedan privados). JPG, PNG, WebP o HEIC. Hasta 40 MB
          por foto antes de comprimir; quedan ~500 KB en el servidor.
        </p>
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
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {values.gallery.map((item) => (
            <GalleryCard
              key={item.id}
              item={item}
              onRemove={() => removeFile(item)}
              onRetry={() => retry(item)}
            />
          ))}
          {values.gallery.length < galleryMax && (
            <button
              type="button"
              onClick={openPicker}
              className="flex aspect-[3/4] flex-col items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-background-elevated)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
              aria-label="Agregar foto"
            >
              <ImagePlus className="h-5 w-5" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                Subir foto
              </span>
            </button>
          )}
        </div>
        {galleryError && (
          <p
            role="alert"
            className="text-[11px] text-[var(--color-brand-highlight)]"
          >
            {galleryError}
          </p>
        )}
      </div>
    </SectionShell>
  );
}

interface GalleryCardProps {
  item: GalleryItem;
  onRemove: () => void;
  onRetry: () => void;
}

function GalleryCard({ item, onRemove, onRetry }: GalleryCardProps) {
  const isBusy = item.status === "compressing" || item.status === "uploading";
  const isError = item.status === "error";

  return (
    <div className="group relative aspect-[3/4] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.previewUrl}
        alt={item.name}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity ${
          isBusy || isError ? "opacity-50" : "opacity-100"
        }`}
      />

      {isBusy && (
        <span
          aria-live="polite"
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[var(--color-foreground)]/30 text-[var(--color-surface)]"
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
            {item.status === "compressing" ? "Comprimiendo" : "Subiendo"}
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

/** Utility surfaced for the wizard's NavBar so submit can be gated. */
export function hasInFlightUploads(gallery: ReadonlyArray<GalleryItem>): boolean {
  return gallery.some(
    (g) => g.status === "queued" || g.status === "compressing" || g.status === "uploading",
  );
}

export function hasErroredUploads(gallery: ReadonlyArray<GalleryItem>): boolean {
  return gallery.some((g) => g.status === "error");
}
