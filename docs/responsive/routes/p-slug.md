# Responsive Route Contract · Detalle (`/p/[slug]`)

Ruta: `/p/[slug]`
Tipo: feature-public
Mobile-first aprobado: yes
Viewports auditados: 360 | 390 | 768 | 1024 | 1280 | 1440

Navegación mobile: top bar + breadcrumb compacto.
CTA principal en mobile: "Contratar". Sticky bottom-bar en 360–768; inline bajo galería en 1024+.
Hero / above-the-fold mobile: foto principal (4:5 aspect) + nombre/handle + ciudad + CTA sticky inferior.
Grids/cards: galería en swiper horizontal nativo (scroll snap) en mobile, grid 2×N en tablet+, layout 2-col (galería + bio) en desktop.
Forms: ninguno todavía. Cuando entre el flow de contratación, será modal full-screen en mobile.
Tablas/listas: detalles del servicio (idiomas, disponibilidad) como lista vertical en mobile, dos columnas en tablet+.
Imágenes y media: galería con `next/image` + `sizes` correctos. Primera foto `priority`. Aspect ratio fijo para evitar CLS.
Touch targets: CTA sticky ≥ 56 px alto. Swiper dots ≥ 44 px.
Hover-only risks: ninguno — toda info debe ser accesible sin hover.
Motion en mobile: scroll snap nativo en galería, sin animaciones JS pesadas.
Performance mobile objetivo: LCP < 2.5s, CLS < 0.1, INP < 200ms.
Problemas conocidos: la sticky CTA debe respetar `safe-area-inset-bottom` en iOS para no quedar bajo la barra del home indicator.
Owner: founder + ops review per-profile.
Estado: **approved**.
