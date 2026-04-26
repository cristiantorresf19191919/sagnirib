import type { AnalyticsEvent } from "./events";

/**
 * Client-side stub. Real analytics provider (PostHog / Plausible / GA4)
 * is wired only after the intake locks one in. Until then, this is a no-op
 * so call sites can be added without leaking PII.
 */
export function trackEvent(
  _event: AnalyticsEvent,
  _payload?: Record<string, unknown>,
): void {
  // intentional no-op
}
