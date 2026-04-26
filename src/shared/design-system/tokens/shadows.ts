export const shadows = {
  none: "none",
  sm: "0 1px 2px rgba(0, 0, 0, 0.45)",
  md: "0 4px 14px rgba(0, 0, 0, 0.5)",
  lg: "0 14px 36px rgba(0, 0, 0, 0.6)",
  glowPrimary: "0 0 24px rgba(255, 43, 181, 0.55), 0 0 56px rgba(255, 43, 181, 0.25)",
  glowSecondary: "0 0 24px rgba(122, 43, 255, 0.5), 0 0 56px rgba(122, 43, 255, 0.22)",
  glowAccent: "0 0 24px rgba(31, 168, 255, 0.5), 0 0 56px rgba(31, 168, 255, 0.22)",
} as const;

export type ShadowToken = keyof typeof shadows;
