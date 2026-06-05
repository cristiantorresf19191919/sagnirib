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

export interface CompressOptions {
  /**
   * When true, bake a tiled "Biringas" watermark into the final JPEG before
   * returning it (anti-theft). Enabled for public gallery photos; left OFF for
   * KYC/verification uploads (an ID or selfie must NOT be defaced — the
   * reviewer needs the untouched image).
   */
  watermark?: boolean;
}

export async function compressImage(
  input: File,
  options: CompressOptions = {},
): Promise<CompressionResult> {
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

  // Pick the smaller of compressed vs original (re-encoding can bloat an
  // already-optimised JPEG).
  let finalFile =
    compressed.size > originalSize && input.type === "image/jpeg"
      ? renameToJpg(input)
      : compressed;

  // Anti-theft watermark — baked in on the client so the stolen copy always
  // carries the mark. Best-effort: a watermark failure must never block an
  // upload, so we fall back to the un-watermarked (but still compressed) file.
  if (options.watermark) {
    finalFile = await watermarkImage(finalFile).catch(() => finalFile);
  }

  return {
    file: finalFile,
    originalSize,
    compressedSize: finalFile.size,
  };
}

/** The brand mark tiled across protected photos. */
const WATERMARK_TEXT = "Biringas";

/**
 * Bake a repeating, diagonal "Biringas" watermark into a JPEG, client-side.
 *
 * Draws the image to a canvas, then tiles the brand text across it at a low
 * opacity and a slight rotation — the classic anti-theft pattern (think the
 * faint repeated stamp on stock previews). White fill + a thin dark stroke
 * keeps it legible over both bright and dark areas without overpowering the
 * photo. Re-exports as JPEG at a quality close to the compression target so
 * the file stays within the storage budget.
 *
 * Runs only in the browser (Canvas). Any failure rejects so the caller can
 * fall back to the original file — the upload must never break over a mark.
 */
async function watermarkImage(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    if (!width || !height) return file;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, width, height);

    // Scale the type to the photo so the mark reads the same on any size.
    const fontSize = Math.min(64, Math.max(16, Math.round(Math.min(width, height) * 0.05)));
    ctx.font = `700 ${fontSize}px "Helvetica Neue", Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const textWidth = ctx.measureText(WATERMARK_TEXT).width;
    const stepX = textWidth + fontSize * 2.6;
    const stepY = fontSize * 4.2;
    const diag = Math.ceil(Math.hypot(width, height));

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((-24 * Math.PI) / 180);
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.22)";
    ctx.lineWidth = Math.max(1, fontSize / 16);
    let row = 0;
    for (let y = -diag; y <= diag; y += stepY) {
      // Brick-offset alternate rows so the grid never lines up into columns.
      const offset = row % 2 === 0 ? 0 : stepX / 2;
      for (let x = -diag; x <= diag; x += stepX) {
        ctx.strokeText(WATERMARK_TEXT, x + offset, y);
        ctx.fillText(WATERMARK_TEXT, x + offset, y);
      }
      row += 1;
    }
    ctx.restore();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", COMPRESS_TARGETS.initialQuality),
    );
    if (!blob) return file;
    return renameToJpg(new File([blob], file.name, { type: "image/jpeg" }));
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("watermark: image decode failed"));
    img.src = src;
  });
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
