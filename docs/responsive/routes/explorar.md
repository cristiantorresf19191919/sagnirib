# Responsive Route Contract · Catálogo (`/explorar`)

Ruta: `/explorar`
Tipo: feature-public
Mobile-first aprobado: yes
Viewports auditados: 360 | 390 | 768 | 1024 | 1280 | 1440

Navegación mobile: misma top bar de home. Filtros en bloque colapsable.
CTA principal en mobile: card tap-area completa (no botón aparte). Tap en card → `/p/[slug]`.
Hero / above-the-fold mobile: título + filtros colapsables + 2 cards visibles parcialmente.
Grids/cards: 1 col / 360–390, 2 col / 768, 3 col / 1024–1280, 4 col / 1440.
Forms: filtros como `<form>` server-driven; submit nativo, no JS bloqueante. Inputs con `inputmode` correcto.
Tablas/listas: n/a (grilla).
Imágenes y media: `next/image` con `sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"`. Sólo la primera card con `priority`.
Touch targets: tap-area completa de card ≥ 44 px de alto. Botones de filtro ≥ 44×44 px.
Hover-only risks: cards muestran outline/elevation en hover, pero el clic completo sin hover funciona.
Motion en mobile: micro-elevation en tap, sin parallax.
Performance mobile objetivo: LCP < 2.5s, CLS < 0.1, INP < 200ms.
Problemas conocidos: paginación SSR — confirmar que el botón "Página siguiente" no genera CLS al recargar.
Owner: founder.
Estado: **approved**.
