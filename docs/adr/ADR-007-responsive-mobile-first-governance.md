# ADR-007 · Responsive / mobile-first governance

- Status: accepted
- Date: 2026-04-25

## Decision
- Mobile-first is mandatory. Audit viewports: 360, 390, 768, 1024, 1280, 1440 (per Addendum 002 §10).
- Every public route or visible feature requires a Responsive Route Contract under `docs/responsive/routes/<route>.md` before being approved as final.
- Touch targets ≥ 44×44px. No critical action depends on hover. Primary CTA must be reachable on mobile.
- Playwright project `responsive` runs `*.responsive.spec.ts` across all six viewports.

## Consequences
- Routes that cannot be validated on mobile cannot ship as final.
