/**
 * Source of truth for color tokens.
 *
 * Direction: neón / bar nocturno. Locked against the founder-supplied logo
 * art (see docs/branding/design-direction.md). Hex values approximate the
 * glow tones in that artwork:
 *   - hot pink / magenta as primary
 *   - electric violet as secondary
 *   - cyan as accent
 *   - red as a sparing highlight
 *   - background near-black with a slight cool cast (brick wall mood)
 *
 * Do not introduce ad-hoc colors in components or features. Add a token
 * here and mirror it in src/styles/theme.css.
 */
export const colors = {
  background: "#08060C",
  backgroundElevated: "#0F0B17",
  surface: "#13101F",
  surfaceMuted: "#1B1530",
  border: "#2C2148",

  brandPrimary: "#FF2BB5",
  brandPrimaryStrong: "#FF5DCB",
  brandPrimarySoft: "#FFA3E0",

  brandSecondary: "#7A2BFF",
  brandSecondaryStrong: "#9D5BFF",

  brandAccent: "#1FA8FF",
  brandAccentStrong: "#5BC8FF",

  brandHighlight: "#FF3B5C",
  brandWarn: "#FFE45E",

  foreground: "#F6F2FF",
  textMuted: "#B5A8D6",
  textSubtle: "#7E7196",
} as const;

export type ColorToken = keyof typeof colors;
