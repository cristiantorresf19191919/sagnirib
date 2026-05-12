import type { ListingDraftPayload } from "@/server/biringas";

import type { EnrollmentDraft } from "./types";

/**
 * Maps the wizard's UI-shaped `EnrollmentDraft` (with string-typed numeric
 * fields and readonly arrays) into the server's `ListingDraftPayload`
 * (with proper number / writable array shapes).
 *
 * Trim is best-effort here — the server schema trims again as the
 * source of truth.
 */
export function toServerPayload(draft: EnrollmentDraft): {
  payload: ListingDraftPayload;
} {
  return {
    payload: {
      details: {
        displayName: draft.details.displayName.trim(),
        age: Number(draft.details.age),
        city: draft.details.city.trim(),
        // The wizard exposes "" as a sentinel for "not selected"; the
        // server schema rejects that. Validation in the wizard prevents
        // submission with empty category, so this cast is safe at call
        // time. Server still re-validates.
        category: draft.details.category as Exclude<
          EnrollmentDraft["details"]["category"],
          ""
        >,
        phone: draft.details.phone.trim(),
        preferredSlug: draft.details.preferredSlug.trim(),
        pricePerHour: Number(draft.details.pricePerHour),
        attention: [...draft.details.attention],
        contactChannels: [...draft.details.contactChannels],
      },
      description: {
        shortBio: draft.description.shortBio.trim(),
        bio: draft.description.bio.trim(),
        services: [...draft.description.services],
        meetingContexts: [...draft.description.meetingContexts],
        faceVisible: draft.description.faceVisible,
        paymentByCard: draft.description.paymentByCard,
        availableNow: draft.description.availableNow,
        gallery: [...draft.description.galleryFileNames],
      },
      publish: {
        packageId: draft.publish.packageId,
        addOnIds: [...draft.publish.addOnIds],
        billing: draft.publish.billing,
        acceptsTerms: draft.publish.acceptsTerms,
        acceptsAdult: draft.publish.acceptsAdult,
      },
    },
  };
}

/**
 * Maps an `ActionResult.error` shape to a friendly Spanish banner string.
 * The server returns `kind: 'no-session' | 'validation' | 'invalid-argument'
 * | 'not-configured' | ...` — we surface the common ones explicitly and
 * fall back to the raw message.
 */
export function humanizeDraftError(
  error: { kind: string; message: string } | undefined,
): string {
  if (!error) return "No se pudo enviar tu borrador. Intenta de nuevo.";
  switch (error.kind) {
    case "no-session":
      return "Tu sesión expiró. Vuelve a ingresar para enviar tu borrador.";
    case "not-configured":
      return "El backend no está configurado en este ambiente.";
    case "invalid-argument":
    case "validation":
      return error.message ?? "Revisa los campos del formulario.";
    default:
      return error.message ?? "No se pudo enviar tu borrador.";
  }
}
