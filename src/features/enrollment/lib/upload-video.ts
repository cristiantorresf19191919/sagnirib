"use client";

import {
  confirmUpload,
  requestUploadTicket,
} from "../actions/upload";

/**
 * Orchestrates the full upload of one video clip from a user-selected
 * `File` to a confirmed staging asset (ADR-015), in four phases:
 *
 *   1. validate — read `<video>.duration` after `loadedmetadata`,
 *      ensure the clip is within [min, max] seconds. No compression
 *      step (FFmpeg.wasm is too heavy for MVP).
 *   2. requestUploadTicket Server Action → signed PUT URL
 *   3. fetch PUT against the signed URL with required headers
 *   4. confirmUpload Server Action → HEAD check + audit
 *
 * The per-clip state machine in the wizard mirrors the photo upload
 * state machine, with `compressing` replaced by `validating`.
 *
 * Any single-clip failure throws an `UploadVideoError` the caller can
 * surface with a retry button.
 */

export type UploadVideoPhase = "validating" | "uploading" | "confirming";

export interface UploadVideoOptions {
  sessionId: string;
  onPhase?: (phase: UploadVideoPhase) => void;
  /** AbortSignal — caller can cancel an in-flight upload. */
  signal?: AbortSignal;
}

export interface UploadedVideo {
  /** Canonical staging path, e.g.
   *  `users/<uid>/staging/<sessionId>/videos/<videoId>.mp4`. */
  path: string;
  sizeBytes: number;
  contentType: string;
  /** Client-measured duration in seconds (rounded). Persisted server-side. */
  durationSeconds: number;
}

export class UploadVideoError extends Error {
  readonly kind:
    | "validation"
    | "duration"
    | "ticket"
    | "transport"
    | "rejected"
    | "confirmation"
    | "aborted";
  constructor(
    kind: UploadVideoError["kind"],
    message: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = "UploadVideoError";
    this.kind = kind;
    if (cause !== undefined) {
      (this as { cause?: unknown }).cause = cause;
    }
  }
}

/**
 * Reads the duration of a video File client-side via a hidden
 * `<video>` element. Resolves with the duration in seconds (rounded
 * down) or rejects with a typed `UploadVideoError`.
 *
 * Browsers populate `.duration` on the `loadedmetadata` event;
 * downloading the actual bytes happens lazily so this is cheap. We
 * still revoke the blob URL on resolve/reject.
 */
function readDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
    };
    video.onloadedmetadata = () => {
      const duration = video.duration;
      cleanup();
      if (!Number.isFinite(duration) || duration <= 0) {
        reject(
          new UploadVideoError(
            "validation",
            "No pudimos leer la duración del video.",
          ),
        );
        return;
      }
      resolve(Math.floor(duration));
    };
    video.onerror = () => {
      cleanup();
      reject(
        new UploadVideoError(
          "validation",
          "El archivo no parece ser un video válido.",
        ),
      );
    };
    video.src = url;
  });
}

export const VIDEO_LIMITS_CLIENT = {
  maxBytes: 35 * 1024 * 1024,
  minBytes: 50 * 1024,
  maxDurationSeconds: 30,
  minDurationSeconds: 3,
  allowedMimes: ["video/mp4", "video/webm"] as const,
};

export async function uploadVideo(
  input: File,
  options: UploadVideoOptions,
): Promise<UploadedVideo> {
  if (options.signal?.aborted) {
    throw new UploadVideoError(
      "aborted",
      "Subida cancelada antes de empezar.",
    );
  }

  // Phase 1 — validate MIME, size, and duration. Done client-side
  // because the signed URL cannot inspect media content. Server still
  // re-checks MIME and size; duration is trusted at the limit set by
  // create-draft-schema.
  options.onPhase?.("validating");

  if (
    !(VIDEO_LIMITS_CLIENT.allowedMimes as ReadonlyArray<string>).includes(
      input.type,
    )
  ) {
    throw new UploadVideoError(
      "validation",
      "Formato no soportado. Usá MP4 o WebM.",
    );
  }
  if (input.size < VIDEO_LIMITS_CLIENT.minBytes) {
    throw new UploadVideoError(
      "validation",
      "El archivo es demasiado pequeño.",
    );
  }
  if (input.size > VIDEO_LIMITS_CLIENT.maxBytes) {
    throw new UploadVideoError(
      "validation",
      "El archivo supera 35 MB.",
    );
  }

  let durationSeconds: number;
  try {
    durationSeconds = await readDurationSeconds(input);
  } catch (err) {
    if (err instanceof UploadVideoError) throw err;
    throw new UploadVideoError(
      "validation",
      "No pudimos validar el video.",
      err,
    );
  }
  if (durationSeconds < VIDEO_LIMITS_CLIENT.minDurationSeconds) {
    throw new UploadVideoError(
      "duration",
      `El video debe durar al menos ${VIDEO_LIMITS_CLIENT.minDurationSeconds} segundos.`,
    );
  }
  if (durationSeconds > VIDEO_LIMITS_CLIENT.maxDurationSeconds) {
    throw new UploadVideoError(
      "duration",
      `El video supera los ${VIDEO_LIMITS_CLIENT.maxDurationSeconds} segundos permitidos. Recortalo antes de subirlo.`,
    );
  }
  if (options.signal?.aborted) {
    throw new UploadVideoError(
      "aborted",
      "Subida cancelada después de validar.",
    );
  }

  // Phase 2 — ticket
  options.onPhase?.("uploading");
  const ticketResult = await requestUploadTicket({
    kind: "video",
    sessionId: options.sessionId,
    contentType: input.type,
    sizeBytes: input.size,
  });
  if (!ticketResult.ok || !ticketResult.data) {
    throw new UploadVideoError(
      "ticket",
      ticketResult.error?.message ??
        "El servidor rechazó el permiso de subida.",
    );
  }
  const ticket = ticketResult.data;

  let putRes: Response;
  try {
    putRes = await fetch(ticket.uploadUrl, {
      method: "PUT",
      body: input,
      headers: {
        "Content-Type": ticket.contentType,
        ...ticket.requiredHeaders,
      },
      signal: options.signal,
    });
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError") {
      throw new UploadVideoError("aborted", "Subida cancelada.", err);
    }
    throw new UploadVideoError(
      "transport",
      "No pudimos subir tu video. Revisá tu conexión.",
      err,
    );
  }
  if (!putRes.ok) {
    const detail =
      putRes.status === 403
        ? "El permiso de subida expiró. Volvé a intentarlo."
        : putRes.status === 412 || putRes.status === 413
          ? "El video excede el límite permitido."
          : `Error ${putRes.status} al subir. Intentalo de nuevo.`;
    throw new UploadVideoError("rejected", detail);
  }

  // Phase 3 — confirm
  options.onPhase?.("confirming");
  const confirmRes = await confirmUpload({ path: ticket.path });
  if (!confirmRes.ok || !confirmRes.data) {
    throw new UploadVideoError(
      "confirmation",
      confirmRes.error?.message ??
        "Subimos el video pero el servidor no lo verificó. Reintentá.",
    );
  }

  return {
    path: confirmRes.data.path,
    sizeBytes: confirmRes.data.sizeBytes,
    contentType: confirmRes.data.contentType,
    durationSeconds,
  };
}
