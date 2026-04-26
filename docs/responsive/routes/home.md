# Responsive Route Contract · Home (`/`)

Ruta: `/`
Tipo: marketing
Mobile-first aprobado: yes
Viewports auditados: 360 | 390 | 768 | 1024 | 1280 | 1440

Navegación mobile: top bar compacta con logo + drawer (icono hamburguesa). Sin mega-menú.
CTA principal en mobile: "Explorar Biringas", visible above-the-fold sin scroll. Width = 100% con padding lateral 16 px.
Hero / above-the-fold mobile: nombre Biringas + slogan + CTA. Foto/glow decorativo NO debe empujar el CTA fuera del viewport en 360 px.
Grids/cards: featured listings → 1 columna en 360/390, 2 columnas en 768, 3 en 1024+, 4 en 1440.
Forms: no hay forms en home.
Tablas/listas: n/a.
Imágenes y media: `next/image` con `priority` solo en hero; resto lazy + `sizes` correctos.
Touch targets: ≥ 44×44 px en CTA y nav.
Hover-only risks: ninguno — todos los estados clave deben tener equivalente focus / active.
Motion en mobile: glow pulse opcional cada 6–8 s. Reducido a `none` con `prefers-reduced-motion`.
Performance mobile objetivo: LCP < 2.5s, CLS < 0.1, INP < 200ms.
Problemas conocidos: ninguno.
Owner: founder.
Estado: **approved**.
