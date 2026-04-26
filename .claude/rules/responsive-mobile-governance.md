# Rule: Responsive / mobile-first governance

1. Mobile-first. Audit at 360, 390, 768, 1024, 1280, 1440 px.
2. Public routes / visible features need a Responsive Route Contract under `docs/responsive/routes/<route>.md`.
3. Touch targets ≥ 44×44 px. No hover-only critical actions.
4. Primary CTA reachable on mobile.
5. Use `next/image` with `sizes` to avoid CLS.

Reference: ADR-007, docs/architecture/responsive-mobile-governance.md.
