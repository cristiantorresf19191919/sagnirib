# Design governance

Authoritative source: Addendum 001 §13 + Blueprint §12.

## Rules
- Tokens (colors, spacing, radius, typography, shadows, motion) live ONLY in `src/shared/design-system/tokens/`.
- Tailwind v4 `@theme` in `src/styles/theme.css` mirrors those tokens. Source of truth = TS tokens.
- Reusable components live under `src/shared/design-system/components/` or `src/shared/ui/`. Feature components must NOT duplicate them.
- Any new visual pattern must update governance or register an explicit exception.

## Design Governance Contract
```
Brand mood:
Paleta oficial:
Colores prohibidos:
Tipografías:
Escala de spacing:
Escala de radius:
Escala de sombras:
Estilo de iconos:
Estilo de imágenes/ilustraciones:
Motion permitido:
Motion prohibido:
Densidad de componentes:
Tono de copy:
Referencias canónicas:
Referencias solo inspiración:
No-go visuales:
Componentes base obligatorios:
Pendientes de assets:
Owner:
Estado:
```

## Status
Foundation phase. Contract values pending Brand Handshake (`brand-intake.md`).
