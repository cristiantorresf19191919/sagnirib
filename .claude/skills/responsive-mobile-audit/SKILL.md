# Skill · responsive-mobile-audit

## Entrada
Ruta pública o feature visible.

## Pasos
1. Cargar la ruta en los 6 viewports.
2. Verificar CTA mobile, nav, overflow, grids, cards, forms, tablas, imágenes, motion, touch targets.
3. Comparar contra `docs/responsive/routes/<route>.md`.
4. Correr Playwright `responsive` projects.

## Output esperado
Reporte por viewport con go / no-go y bugs.

## Checklist
- [ ] Sin overflow horizontal accidental.
- [ ] CTA mobile usable.
- [ ] Touch targets ≥ 44 px.
- [ ] Sin hover-only crítico.
