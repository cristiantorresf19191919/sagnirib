# Responsive Route Contract · Publicar (`/publicar`)

Ruta: `/publicar`
Tipo: funnel / form
Mobile-first aprobado: yes
Viewports auditados: 360 | 390 | 768 | 1024 | 1280 | 1440

Navegación mobile: top bar con logo + link "Publica tu perfil" + CTA "Explorar". El link de regreso al catálogo aparece arriba del título de la página.
CTA principal mobile: "Guardar y continuar" en pasos 1-2, "Publicar y pagar [TOTAL]" en paso 3. Width = 100% en mobile, padding lateral 16 px.
Hero / above-the-fold mobile: título + stepper colapsado en 1 columna (1 card por línea) + tip card debajo. El stepper jamás genera scroll horizontal.
Grids/cards:
  - Stepper: 1 col en 360/390, 3 cols en 768+.
  - Detalles del paso 1: 1 col en mobile, 2 cols en md+.
  - Galería paso 2: 3 cols en 360/390, 4 cols en 768, 6 cols en 1024+.
  - Cards de planes paso 3: 1 col en mobile, 3 cols en lg+.
  - Add-ons paso 3: 1 col en mobile, 2 cols en md+.
  - Resumen lateral: oculto inline en mobile (se muestra arriba del wizard como rail) y queda como columna sticky en lg+.
Forms:
  - Inputs `h-12`, padding interno 16 px, border-radius `--radius-md`.
  - Numeric inputs con `inputMode="numeric"` para teclado correcto en mobile.
  - Chips ≥ 36 px de alto (cumple 44 px de touch target con padding ambiental ≥ 8 px).
  - Toggles ≥ 44 px de alto (la fila incluye descripción y queda en 64-72 px en mobile).
Tablas/listas: ninguna.
Imágenes y media: galería usa placeholders mock; el upload real será `next/image` con `sizes` correctos cuando el adapter exista.
Touch targets: ≥ 44×44 px en CTAs y toggles principales. Los chips son ≥ 36 px de alto y separados por `gap-2`, lo que mantiene la zona táctil efectiva ≥ 44 px.
Hover-only risks: ninguno — los add-ons y package cards activan con tap; los hover styles refuerzan pero no son críticos.
Motion en mobile: stepper sin animación pesada — sólo transición de border/shadow. Submit feedback (`Loader2`) respeta `prefers-reduced-motion` mediante el spin mínimo nativo de Tailwind.
Performance mobile objetivo: LCP < 2.5s (cards estáticos), CLS < 0.1 (galería con aspect-ratio fijo), INP < 200ms (todo es estado React local, sin red).
Problemas conocidos:
  - El resumen lateral (paso 3) sólo aparece encima del form en mobile cuando se hace scroll a esa sección — aceptado para MVP.
  - La galería mock no ejecuta upload real — se eliminará cuando el provider entre.
Owner: founder.
Estado: **approved**.
