export const shadows = {
  none: "none",
  sm: "0 1px 2px rgba(27, 26, 23, 0.06)",
  md: "0 6px 20px -8px rgba(27, 26, 23, 0.12)",
  lg: "0 18px 40px -16px rgba(27, 26, 23, 0.18)",
  glowPrimary: "0 12px 32px -16px rgba(47, 93, 67, 0.45)",
  glowSecondary: "0 12px 32px -16px rgba(122, 140, 109, 0.40)",
  glowAccent: "0 12px 32px -16px rgba(229, 162, 58, 0.45)",
} as const;

export type ShadowToken = keyof typeof shadows;
