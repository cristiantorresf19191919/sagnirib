import type { CreateListingDraftInput } from "@/server/biringas";

import { MVP_LOCKED_PACKAGE_ID, PLANS_ENABLED } from "./pricing";
import type { EnrollmentDraft } from "./types";

/**
 * Maps the wizard's UI-shaped `EnrollmentDraft` (with string-typed numeric
 * fields and readonly arrays) into the server's `CreateListingDraftInput`
 * (with proper number / writable array shapes and the canonical storage
 * paths for the gallery).
 *
 * Trim is best-effort here — the server schema trims again as the
 * source of truth.
 *
 * `sessionId` is the wizard-side stable upload session id (generated once
 * when the wizard mounts). It must match the `users/<uid>/staging/<sessionId>/`
 * prefix of every gallery `uploadedPath`. The server cross-checks this.
 */
export function toServerPayload(
  draft: EnrollmentDraft,
  sessionId: string,
): CreateListingDraftInput {
  return {
    sessionId,
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
        // Only photos that finished the upload + confirm round-trip have an
        // `uploadedPath`; anything still queued is silently dropped. The
        // wizard validator separately refuses to submit while an upload is
        // in flight, so this filter is belt-and-suspenders.
        gallery: draft.description.gallery
          .filter((g): g is typeof g & { uploadedPath: string } => Boolean(g.uploadedPath))
          .map((g) => ({ path: g.uploadedPath })),
        // Same shape as gallery — only successfully-confirmed clips
        // make it through. The wizard validator gates submit while a
        // clip is still uploading.
        videos: draft.description.videos
          .filter(
            (v): v is typeof v & { uploadedPath: string; durationSeconds: number } =>
              Boolean(v.uploadedPath) && typeof v.durationSeconds === "number",
          )
          .map((v) => ({
            path: v.uploadedPath,
            durationSeconds: v.durationSeconds,
          })),
      },
      attributes: {
        ethnicity: draft.attributes.ethnicity.trim(),
        hair: draft.attributes.hair.trim(),
        height: draft.attributes.height.trim(),
        body: draft.attributes.body.trim(),
        breast: draft.attributes.breast.trim(),
        // `pubis` is optional UI-side; collapse `""` to undefined so the
        // schema's required-vs-optional shape stays clean and Firestore
        // doesn't persist an empty string.
        pubis: draft.attributes.pubis.trim() || undefined,
        country: draft.attributes.country.trim(),
        languages: [...draft.attributes.languages],
      },
      // MVP launch: server-side guarantee that the payload always reflects
      // the free tier regardless of what UI state held. The cards in the UI
      // are disabled so this should already be the case, but force it
      // anyway — defense in depth (the wizard's onChange could be bypassed
      // by a savvy user).
      publish: PLANS_ENABLED
        ? {
            packageId: draft.publish.packageId,
            addOnIds: [...draft.publish.addOnIds],
            billing: draft.publish.billing,
            acceptsTerms: draft.publish.acceptsTerms,
            acceptsAdult: draft.publish.acceptsAdult,
          }
        : {
            packageId: MVP_LOCKED_PACKAGE_ID,
            addOnIds: [],
            billing: "monthly",
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
    case "permission-denied":
      return "Una o más fotos del borrador no son tuyas. Vuelve al paso de descripción y resubelas.";
    case "invalid-argument":
    case "validation":
      // The slug-conflict messages are user-facing as-is ("slug ... is
      // already taken by a published profile" / "... is already in another
      // draft awaiting review"). Convert them to Spanish here so the
      // banner reads naturally.
      if (error.message.includes("is already taken by a published profile")) {
        return "Ya hay un perfil publicado con esa URL. Elige otra URL preferida.";
      }
      if (error.message.includes("is already in another draft awaiting review")) {
        return "Otro borrador en revisión ya pidió esta URL. Elige una distinta.";
      }
      return error.message ?? "Revisa los campos del formulario.";
    default:
      return error.message ?? "No se pudo enviar tu borrador.";
  }
}
