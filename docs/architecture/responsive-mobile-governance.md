# Responsive / mobile-first governance

Authoritative source: Addendum 002 §10–§13.

## Audit viewports
360, 390, 768, 1024, 1280, 1440 px (defined in `src/shared/design-system/responsive/breakpoints.ts`).

## Rules
- Mobile-first design always; scale up to tablet/desktop, never the reverse.
- Touch targets ≥ 44×44 px. No critical action depends on hover.
- Header nav must have a mobile variant (drawer / compact menu) when it doesn't fit.
- Primary CTA is reachable on mobile without horizontal scroll.
- Use `next/image` with proper `sizes` to avoid CLS.
- Tables/lists must adapt or scroll only when explicitly designed to.

## Responsive Route Contract template

```
# Responsive Route Contract

Ruta:
Tipo: marketing | landing | dashboard | auth | legal | feature-public
Mobile-first aprobado: yes | no
Viewports auditados: 360 | 390 | 768 | 1024 | 1280 | 1440
Navegación mobile:
CTA principal en mobile:
Hero / above-the-fold mobile:
Grids/cards:
Forms:
Tablas/listas:
Imágenes y media:
Touch targets:
Hover-only risks:
Motion en mobile:
Performance mobile objetivo (LCP / CLS / INP):
Problemas conocidos:
Owner:
Estado: draft | approved | implemented | audited
```

Per-route contracts live under `docs/responsive/routes/<route>.md`.
