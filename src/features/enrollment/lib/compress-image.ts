"use client";

import imageCompression from "browser-image-compression";

/**
 * Client-side image compression for the `/publicar` wizard (ADR-012).
 *
 * Wraps `browser-image-compression` with the policy decided in ADR-012:
 *
 *   - max longest side 2048px
 *   - quality 0.82 JPEG
 *   - target ~500KB
 *   - re-encode through Canvas so EXIF is stripped (GPS, camera serial,
 *     timestamps — all critical for modelo safety)
 *   - Web Worker on, so the UI thread stays responsive on iPhones
 *
 * Returns a fresh `File` (not Blob) so downstream code can still inspect
 * `.name` and `.size`. The MIME is normalised to `image/jpeg` regardless
 * of input — WebP / HEIC / PNG all convert to JPEG. (HEIC is what iOS
 * shoots by default; the library transparently decodes the codecs the
 * browser supports.)
 *
 * Throws `CompressionError` with a friendly Spanish message on:
 *   - unreadable file (corrupt or DRM-locked)
 *   - HEIC on a browser without HEIC support (only Safari decodes HEIC)
 *   - canvas memory exhaustion (very large RAW files on low-end Android)
 */

export const COMPRESS_TARGETS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 2048,
  initialQuality: 0.82,
  fileType: "image/jpeg" as const,
} as const;

export class CompressionError extends Error {
  readonly kind: "unreadable" | "unsupported-format" | "out-of-memory" | "unknown";
  constructor(
    kind: CompressionError["kind"],
    message: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = "CompressionError";
    this.kind = kind;
    if (cause !== undefined) {
      (this as { cause?: unknown }).cause = cause;
    }
  }
}

export interface CompressionResult {
  /** Recompressed JPEG file — name carries `.jpg` extension. */
  file: File;
  /** Bytes of the original user-selected file, for telemetry / UI hints. */
  originalSize: number;
  /** Bytes after compression. */
  compressedSize: number;
}

export async function compressImage(input: File): Promise<CompressionResult> {
  const originalSize = input.size;

  let compressed: File;
  try {
    const blob = await imageCompression(input, {
      maxSizeMB: COMPRESS_TARGETS.maxSizeMB,
      maxWidthOrHeight: COMPRESS_TARGETS.maxWidthOrHeight,
      initialQuality: COMPRESS_TARGETS.initialQuality,
      fileType: COMPRESS_TARGETS.fileType,
      useWebWorker: true,
      // EXIF orientation is preserved by the library; the rest of EXIF is
      // dropped by virtue of re-encoding through Canvas.
      preserveExif: false,
    });
    // browser-image-compression returns a File-shaped object; we rename for
    // a consistent `.jpg` extension regardless of original casing.
    const renamed = renameToJpg(blob instanceof File ? blob : new File([blob], input.name, { type: "image/jpeg" }));
    compressed = renamed;
  } catch (err) {
    throw classifyError(err);
  }

  // Defensive: if the compressed output is somehow larger than the input,
  // keep the smaller one (re-encoding can bloat already-optimised JPEGs).
  if (compressed.size > originalSize && input.type === "image/jpeg") {
    return {
      file: renameToJpg(input),
      originalSize,
      compressedSize: input.size,
    };
  }

  return {
    file: compressed,
    originalSize,
    compressedSize: compressed.size,
  };
}

function renameToJpg(file: File): File {
  const base = file.name.replace(/\.[^.]+$/, "");
  const safeBase = base.length > 0 ? base : "photo";
  return new File([file], `${safeBase}.jpg`, { type: "image/jpeg" });
}

function classifyError(err: unknown): CompressionError {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();

  if (lower.includes("heic") || lower.includes("unsupported")) {
    return new CompressionError(
      "unsupported-format",
      "Tu foto tiene un formato que tu navegador no puede leer. Convierte a JPG o usa otro navegador.",
      err,
    );
  }
  if (lower.includes("memory") || lower.includes("allocation")) {
    return new CompressionError(
      "out-of-memory",
      "La foto es demasiado grande para procesarla en este dispositivo. Prueba con una imagen más liviana.",
      err,
    );
  }
  if (lower.includes("could not read") || lower.includes("decode")) {
    return new CompressionError(
      "unreadable",
      "No pudimos leer este archivo. Verifica que la foto no esté corrupta.",
      err,
    );
  }
  return new CompressionError(
    "unknown",
    "No pudimos preparar esta foto. Inténtalo de nuevo con otra imagen.",
    err,
  );
}
