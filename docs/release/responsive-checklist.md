# Responsive release checklist

Run for every public route or visible feature before approval.

- [ ] Reviewed at 360, 390, 768, 1024, 1280, 1440 px.
- [ ] Primary CTA visible and usable on mobile.
- [ ] Header / nav has a working mobile variant.
- [ ] No accidental horizontal overflow.
- [ ] Cards / grids / tables / forms adapt without breaking hierarchy.
- [ ] Touch targets ≥ 44×44 px.
- [ ] Images use `next/image` with proper `sizes`; no obvious CLS.
- [ ] Motion is light on mobile and never blocks content / CTA.
- [ ] Playwright `*.responsive.spec.ts` covers the route.
- [ ] Responsive Route Contract approved in `docs/responsive/routes/<route>.md`.
