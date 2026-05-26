"use client";

import { compressImage, type CompressionResult } from "@/features/enrollment/lib/compress-image";

import {
  confirmKycUpload,
  requestKycUploadTicket,
} from "../actions/verify";

/**
 * Orchestrates compress → ticket → PUT → confirm for ONE KYC asset.
 * Mirrors the photo orchestrator in `@/features/enrollment/lib/upload-photo`
 * with two differences:
 *   - the ticket request takes a `kind` ('document_front' | 'document_back'
 *     | 'selfie') and a `personId` (ADR-018 — KYC is per-person, not
 *     per-account)
 *   - the server-minted path lands under `verifications/{personId}/`
 *     instead of the wizard's staging prefix
 */

export type KycUploadKind = "document_front" | "document_back" | "selfie";
export type KycUploadPhase = "compressing" | "uploading" | "confirming";

export interface KycUploadOptions {
  /** ADR-018 — the person this asset belongs to. Threaded through to
   *  the ticket + confirm Server Actions so the server can verify
   *  ownership and mint the personId-scoped path. */
  personId: string;
  kind: KycUploadKind;
  onPhase?: (phase: KycUploadPhase) => void;
  signal?: AbortSignal;
}

export interface KycUploadedAsset {
  kind: KycUploadKind;
  path: string;
  sizeBytes: number;
  contentType: string;
  originalSize: number;
  compressedSize: number;
}

export class KycUploadError extends Error {
  readonly kind:
    | "compression"
    | "ticket"
    | "transport"
    | "rejected"
    | "confirmation"
    | "aborted";
  constructor(
    kind: KycUploadError["kind"],
    message: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = "KycUploadError";
    this.kind = kind;
    if (cause !== undefined) (this as { cause?: unknown }).cause = cause;
  }
}

export async function uploadKycFile(
  file: File,
  options: KycUploadOptions,
): Promise<KycUploadedAsset> {
  if (options.signal?.aborted) {
    throw new KycUploadError("aborted", "Subida cancelada antes de empezar.");
  }

  options.onPhase?.("compressing");
  let compressed: CompressionResult;
  try {
    compressed = await compressImage(file);
  } catch (err) {
    throw new KycUploadError(
      "compression",
      err instanceof Error ? err.message : "Error al comprimir.",
      err,
    );
  }
  if (options.signal?.aborted) {
    throw new KycUploadError("aborted", "Subida cancelada después de comprimir.");
  }

  options.onPhase?.("uploading");
  const ticketRes = await requestKycUploadTicket({
    personId: options.personId,
    kind: options.kind,
    contentType: compressed.file.type,
    sizeBytes: compressed.file.size,
  });
  if (!ticketRes.ok || !ticketRes.data) {
    throw new KycUploadError(
      "ticket",
      ticketRes.error?.message ?? "El servidor rechazó el permiso de subida.",
    );
  }
  const ticket = ticketRes.data;

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
      throw new KycUploadError("aborted", "Subida cancelada.", err);
    }
    throw new KycUploadError(
      "transport",
      "No pudimos enviar el archivo. Revisa tu conexión e intenta otra vez.",
      err,
    );
  }
  if (!putRes.ok) {
    const detail =
      putRes.status === 403
        ? "El permiso de subida expiró. Vuelve a intentarlo."
        : putRes.status === 412 || putRes.status === 413
          ? "El archivo excede el límite permitido tras comprimir."
          : `Error ${putRes.status} al subir. Inténtalo de nuevo.`;
    throw new KycUploadError("rejected", detail);
  }

  options.onPhase?.("confirming");
  const confirmRes = await confirmKycUpload({
    personId: options.personId,
    path: ticket.path,
  });
  if (!confirmRes.ok || !confirmRes.data) {
    throw new KycUploadError(
      "confirmation",
      confirmRes.error?.message ??
        "Subimos el archivo pero el servidor no lo verificó. Reintenta.",
    );
  }

  return {
    kind: options.kind,
    path: confirmRes.data.path,
    sizeBytes: confirmRes.data.sizeBytes,
    contentType: confirmRes.data.contentType,
    originalSize: compressed.originalSize,
    compressedSize: compressed.compressedSize,
  };
}
