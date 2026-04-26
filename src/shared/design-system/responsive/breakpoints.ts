/**
 * Mandatory audit viewports per Addendum 002 §10.
 * Every public route must be reviewed at each of these widths before approval.
 */
export const breakpoints = {
  mobileMin: 360,
  mobileBase: 390,
  tablet: 768,
  laptop: 1024,
  desktopBase: 1280,
  desktopWide: 1440,
} as const;

export type BreakpointToken = keyof typeof breakpoints;

export const auditViewports: ReadonlyArray<{ name: BreakpointToken; width: number }> = [
  { name: "mobileMin", width: 360 },
  { name: "mobileBase", width: 390 },
  { name: "tablet", width: 768 },
  { name: "laptop", width: 1024 },
  { name: "desktopBase", width: 1280 },
  { name: "desktopWide", width: 1440 },
];
