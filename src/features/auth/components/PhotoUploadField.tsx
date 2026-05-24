"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Camera, ImagePlus, ShieldCheck, X } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";

export interface PhotoUploadFieldProps {
  /** Currently picked photos. Parent owns the state. */
  files: ReadonlyArray<File>;
  onChange: (files: ReadonlyArray<File>) => void;
  /** Minimum required photos for the form to consider this valid. */
  min?: number;
  /** Hard cap on the number of photos the picker accepts. */
  max?: number;
  /** Validation message from the parent form. */
  error?: string;
  /** Disables interaction (e.g. while submitting). */
  disabled?: boolean;
}

const DEFAULT_MIN = 2;
const DEFAULT_MAX = 10;
const ACCEPTED = "image/png, image/jpeg, image/webp";
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB per photo — visual hint, server is truth

/**
 * Visual photo picker for the publisher profile step.
 *
 * Drag-and-drop or click-to-pick. Renders a 3-column preview grid with
 * per-thumbnail remove buttons and an animated "spot remaining" counter.
 * Enforces a min/max count and per-file size at the UI layer — the
 * authoritative validation still lives server-side once
 * `PHOTO_VERIFICATION_ENABLED` flips on.
 *
 * Generates object URLs for previews and revokes them on unmount /
 * replacement so the page does not leak blob handles.
 */
export function PhotoUploadField({
  files,
  onChange,
  min = DEFAULT_MIN,
  max = DEFAULT_MAX,
  error,
  disabled,
}: Readonly<PhotoUploadFieldProps>) {
  const locale = useActiveLocale();
  const reducedMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [innerError, setInnerError] = useState<string | null>(null);

  // Derive preview URLs synchronously from `files` instead of mirroring
  // them to local state. `useMemo` recomputes only when the file list
  // changes; the matching `useEffect` below revokes the previous batch on
  // unmount / when the memo recomputes, preventing blob-handle leaks.
  const previews = useMemo(
    () => files.map((f) => URL.createObjectURL(f)),
    [files],
  );
  useEffect(() => {
    return () => {
      for (const url of previews) URL.revokeObjectURL(url);
    };
  }, [previews]);

  const slotsLeft = max - files.length;
  const hasMin = files.length >= min;
  const displayError = error ?? innerError ?? null;

  function pick(incoming: FileList | File[] | null) {
    setInnerError(null);
    if (!incoming) return;
    const arr = Array.from(incoming);
    if (arr.length === 0) return;
    const filtered: File[] = [];
    for (const f of arr) {
      if (!ACCEPTED.split(",").map((s) => s.trim()).includes(f.type)) {
        setInnerError(t(locale, "rbac.publisher.photos.error.format"));
        continue;
      }
      if (f.size > MAX_BYTES) {
        setInnerError(
          t(locale, "rbac.publisher.photos.error.size", {
            mb: Math.floor(MAX_BYTES / 1024 / 1024),
          }),
        );
        continue;
      }
      filtered.push(f);
    }
    if (filtered.length === 0) return;
    const merged = [...files, ...filtered].slice(0, max);
    if (merged.length > max) {
      setInnerError(t(locale, "rbac.publisher.photos.error.max", { max }));
    }
    onChange(merged);
  }

  function removeAt(index: number) {
    if (disabled) return;
    onChange(files.filter((_, i) => i !== index));
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    pick(event.target.files);
    // Allow re-picking the same file by clearing the input value.
    event.target.value = "";
  }

  function onDragOver(event: DragEvent<HTMLDivElement>) {
    if (disabled) return;
    event.preventDefault();
    setDragging(true);
  }

  function onDragLeave() {
    setDragging(false);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    if (disabled) return;
    event.preventDefault();
    setDragging(false);
    pick(event.dataTransfer.files);
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED}
        onChange={onFileChange}
        disabled={disabled}
        className="sr-only"
        aria-label={t(locale, "rbac.publisher.profile.section.photos")}
      />

      <motion.div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        animate={
          reducedMotion
            ? undefined
            : dragging
              ? { scale: 1.01, borderColor: "var(--color-brand-primary)" }
              : { scale: 1 }
        }
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-[var(--radius-xl)] border-2 border-dashed px-4 py-8 text-center transition-colors ${
          displayError
            ? "border-[var(--color-brand-highlight)]/50 bg-[var(--color-brand-highlight)]/6"
            : dragging
              ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/6"
              : "border-[var(--color-border)] bg-[var(--color-background-elevated)]/60"
        }`}
      >
        <motion.span
          aria-hidden
          animate={
            reducedMotion ? undefined : dragging ? { y: -4 } : { y: 0 }
          }
          transition={{ duration: 0.25 }}
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/25"
        >
          <ImagePlus className="h-5 w-5" aria-hidden />
        </motion.span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || slotsLeft <= 0}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--color-brand-primary)] px-4 text-xs font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,transform] hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Camera className="h-3.5 w-3.5" aria-hidden />
          {t(locale, "rbac.publisher.photos.choose")}
        </button>
        <p className="max-w-xs text-[11px] leading-relaxed text-[var(--color-text-muted)]">
          {t(locale, "rbac.publisher.photos.dragHint")}
        </p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
          {t(locale, "rbac.publisher.photos.counter", {
            count: files.length,
            min,
            max,
          })}
        </p>
      </motion.div>

      <AnimatePresence>
        {files.length > 0 ? (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-3 gap-2 overflow-hidden"
          >
            {files.map((file, i) => (
              <motion.li
                key={`${file.name}-${file.size}-${i}`}
                layout
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="group relative aspect-square overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background-elevated)]"
              >
                {previews[i] ? (
                  // Object URL previews — never indexed, intentionally <img>.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previews[i]}
                    alt={file.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                ) : null}
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label={t(locale, "rbac.publisher.photos.remove")}
                  className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-background)]/90 text-[var(--color-foreground)] shadow-[var(--shadow-sm)] backdrop-blur-sm transition-[background,transform] duration-200 hover:scale-105 hover:bg-[var(--color-brand-highlight)] hover:text-[var(--color-surface)]"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
                {i === 0 ? (
                  <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-primary)]/85 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--color-surface)] shadow-[var(--shadow-sm)] backdrop-blur-sm">
                    <ShieldCheck className="h-2.5 w-2.5" aria-hidden />
                    {t(locale, "rbac.publisher.photos.coverBadge")}
                  </span>
                ) : null}
              </motion.li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span
          className={`inline-flex items-center gap-1.5 ${
            hasMin
              ? "text-[var(--color-brand-primary)]"
              : "text-[var(--color-text-muted)]"
          }`}
        >
          <ShieldCheck className="h-3 w-3" aria-hidden />
          {hasMin
            ? t(locale, "rbac.publisher.photos.ok")
            : t(locale, "rbac.publisher.photos.minHint", { min })}
        </span>
        {slotsLeft > 0 ? (
          <span className="font-mono text-[10px] text-[var(--color-text-subtle)]">
            {t(locale, "rbac.publisher.photos.remaining", { count: slotsLeft })}
          </span>
        ) : null}
      </div>

      <AnimatePresence>
        {displayError ? (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="text-[11px] text-[var(--color-brand-highlight)]"
          >
            {displayError}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
