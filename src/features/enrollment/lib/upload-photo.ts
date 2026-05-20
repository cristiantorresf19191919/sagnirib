"use client";

import {
  confirmUpload,
  requestUploadTicket,
} from "../actions/upload";
import { compressImage, type CompressionResult } from "./compress-image";

/**
 * Orchestrates the full upload of one photo from a user-selected `File` to
 * a confirmed staging asset, in four phases:
 *
 *   1. compress (browser-image-compression — WebWorker, EXIF-stripped)
 *   2. requestUploadTicket Server Action → signed PUT URL
 *   3. fetch PUT against the signed URL with required headers
 *   4. confirmUpload Server Action → HEAD check + audit
 *
 * Each phase reports progress through `onPhase` so the wizard can switch
 * the per-photo card state machine (`compressing → uploading → ready`).
 *
 * Any single-photo failure throws an `UploadError` the caller can surface
 * with a "Reintentar" button next to the failed thumbnail. Failures here
 * never poison the wizard's overall state — only the individual photo's.
 */

export type UploadPhase = "compressing" | "uploading" | "confirming";

export interface UploadOptions {
  sessionId: string;
  onPhase?: (phase: UploadPhase) => void;
  /** AbortSignal lets the wizard cancel an in-flight upload if the user
   *  removes the thumbnail before it finishes. The compress step is not
   *  abortable (the worker has no cancel API); the fetch PUT is. */
  signal?: AbortSignal;
}

export interface UploadedPhoto {
  /** Canonical bucket path, e.g.
   *  `users/<uid>/staging/<sessionId>/photos/<photoId>.jpg`. */
  path: string;
  /** Effective bytes stored. */
  sizeBytes: number;
  /** MIME the server confirmed. */
  contentType: string;
  /** Bytes of the original user-selected file, for telemetry / UI hints. */
  originalSize: number;
  /** Bytes after client-side compression. */
  compressedSize: number;
}

export class UploadError extends Error {
  readonly kind:
    | "compression"
    | "ticket"
    | "transport"
    | "rejected"
    | "confirmation"
    | "aborted";
  constructor(
    kind: UploadError["kind"],
    message: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = "UploadError";
    this.kind = kind;
    if (cause !== undefined) {
      (this as { cause?: unknown }).cause = cause;
    }
  }
}

export async function uploadPhoto(
  input: File,
  options: UploadOptions,
): Promise<UploadedPhoto> {
  if (options.signal?.aborted) {
    throw new UploadError("aborted", "Subida cancelada antes de empezar.");
  }

  options.onPhase?.("compressing");
  let compressed: CompressionResult;
  try {
    compressed = await compressImage(input);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al comprimir.";
    throw new UploadError("compression", message, err);
  }
  if (options.signal?.aborted) {
    throw new UploadError("aborted", "Subida cancelada después de comprimir.");
  }

  options.onPhase?.("uploading");
  const ticketResult = await requestUploadTicket({
    kind: "photo",
    sessionId: options.sessionId,
    contentType: compressed.file.type,
    sizeBytes: compressed.file.size,
  });
  if (!ticketResult.ok || !ticketResult.data) {
    throw new UploadError(
      "ticket",
      ticketResult.error?.message ??
        "El servidor rechazó el permiso de subida para esta foto.",
    );
  }
  const ticket = ticketResult.data;

  let putRes: Response;
  try {
    putRes = await fetch(ticket.uploadUrl, {
      method: "PUT",
      body: compressed.file,
      headers: {
        "Content-Type": ticket.contentType,
        ...ticket.requiredHeaders,
      },
      signal: options.signal,
    });
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError") {
      throw new UploadError("aborted", "Subida cancelada.", err);
    }
    throw new UploadError(
      "transport",
      "No pudimos enviar tu foto. Revisa tu conexión e intenta otra vez.",
      err,
    );
  }
  if (!putRes.ok) {
    // GCS returns 403 on signature mismatch, 412 on precondition (e.g. size
    // outside the signed range), 5xx on transient failures.
    const detail =
      putRes.status === 403
        ? "El permiso de subida expiró. Vuelve a intentarlo."
        : putRes.status === 412 || putRes.status === 413
          ? "La foto excede el límite permitido tras comprimir."
          : `Error ${putRes.status} al subir. Inténtalo de nuevo.`;
    throw new UploadError("rejected", detail);
  }

  options.onPhase?.("confirming");
  const confirmRes = await confirmUpload({ path: ticket.path });
  if (!confirmRes.ok || !confirmRes.data) {
    throw new UploadError(
      "confirmation",
      confirmRes.error?.message ??
        "Subimos la foto pero el servidor no la verificó. Reintenta.",
    );
  }

  return {
    path: confirmRes.data.path,
    sizeBytes: confirmRes.data.sizeBytes,
    contentType: confirmRes.data.contentType,
    originalSize: compressed.originalSize,
    compressedSize: compressed.compressedSize,
  };
}
