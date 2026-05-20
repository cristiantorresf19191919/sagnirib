/**
 * Working brand config — values to be locked during the Brand Handshake
 * (see docs/branding/brand-intake.md and docs/branding/design-direction.md).
 *
 * Until the handshake closes, do NOT use these strings as final copy on
 * indexable pages. They exist so SEO/metadata helpers and structured-data
 * builders have a single source to read from.
 */
export const brandConfig = {
  name: "Biringas",
  legalName: "Biringas",
  tagline: "Consigue lo que quieres en el momento que quieres",
  description:
    "Marketplace donde acompañantes ofrecen servicios para eventos y viajes.",
  defaultLocale: "es",
  supportedLocales: ["es", "en", "pt"] as const,
  social: {
    twitter: "",
    instagram: "",
  },
  contact: {
    email: "",
  },
} as const;

export type SupportedLocale = (typeof brandConfig.supportedLocales)[number];
