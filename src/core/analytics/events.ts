/**
 * Analytics event names live here so feature components reference symbols,
 * not string literals. Keeping naming centralised mirrors the Observer
 * boundary defined in Addendum 002 §8.
 */
export const analyticsEvents = {
  pageView: "page_view",
  ctaClick: "cta_click",
} as const;

export type AnalyticsEvent =
  (typeof analyticsEvents)[keyof typeof analyticsEvents];
