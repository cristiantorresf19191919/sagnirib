/**
 * Source of truth for color tokens.
 *
 * Direction: spa / warm minimal — cream paper background, deep forest green
 * primary for actions, honey gold for ratings, soft sage for secondary.
 * Replaces the prior neon/bar-nocturno direction (2026-04-29 founder review).
 *
 * Do not introduce ad-hoc colors in components or features. Add a token
 * here and mirror it in src/styles/theme.css.
 */
export const colors = {
  background: "#F4EFE3",
  backgroundElevated: "#FBF7EC",
  surface: "#FFFFFF",
  surfaceMuted: "#EDE6D4",
  border: "#E2D9C4",

  brandPrimary: "#2F5D43",
  brandPrimaryStrong: "#3A7152",
  brandPrimarySoft: "#A9C2B2",

  brandSecondary: "#7A8C6D",
  brandSecondaryStrong: "#5C6E51",

  brandAccent: "#E5A23A",
  brandAccentStrong: "#C8862A",

  brandHighlight: "#C4514B",
  brandWarn: "#E5A23A",

  foreground: "#1B1A17",
  textMuted: "#6B6258",
  textSubtle: "#9A9189",
} as const;

export type ColorToken = keyof typeof colors;
