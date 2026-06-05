# Design governance

Authoritative source: Addendum 001 §13 + Blueprint §12.

## Rules
- Tokens (colors, spacing, radius, typography, shadows, motion) live ONLY in `src/shared/design-system/tokens/`.
- Tailwind v4 `@theme` in `src/styles/theme.css` mirrors those tokens. Source of truth = TS tokens.
- Reusable components live under `src/shared/design-system/components/` or `src/shared/ui/`. Feature components must NOT duplicate them.
- Any new visual pattern must update governance or register an explicit exception.

## Registered exceptions
Narrow, explicit exceptions to "no design hardcoding". Each hardcodes values
because it paints **canvas/SVG geometry**, not CSS — so it cannot reference a
CSS variable at runtime. Brand text always comes from `brandConfig.name`,
never a magic string.

- **Anti-theft photo watermark (baked).** `src/features/enrollment/lib/compress-image.ts`
  tiles the `brandConfig.name` mark onto a `<canvas>` with literal fill `#ffffff`
  + stroke `rgba(0,0,0,0.22)` at `globalAlpha 0.12`, rotated `-24°`. Literal
  colors because `<canvas>` paints raster pixels.
- **"Sello Biringas" upload stamp.** `src/features/enrollment/components/StepDescription.tsx`
  (`GalleryCard`) renders an SVG `<pattern>` of the same mark during the
  "Protegiendo" phase, with literal `fill="#ffffff"` + `stroke="rgba(0,0,0,0.5)"`
  and `patternTransform="rotate(-24)"` so the overlay matches the baked mark in
  BOTH light and dark themes (the surface token is not white in dark). Motion
  reuses the shared `LIQUID_SPRING` (`src/features/enrollment/lib/liquid-motion.ts`)
  and the `motionFM` token adapter; the only inline spring is the shield-pin
  micro-pop.

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
