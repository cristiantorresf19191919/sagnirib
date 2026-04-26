# Public pages brief

## `/` — Home
- **Goal:** explicar qué es Biringas en menos de 3 segundos y enviar al catálogo.
- **Above-the-fold:** logotipo + slogan ("Consigue lo que quieres en el momento que quieres") + CTA principal ("Explorar Biringas") + visual neón.
- **Secciones:**
  1. Hero con CTA a `/explorar`.
  2. "Cómo funciona" (3 pasos: explora · elige · contrata).
  3. Featured listings (carrusel server-rendered, 6–8 cards top).
  4. Garantías / qué hace Biringas distinto (sin métricas inventadas).
  5. Footer con links legales (placeholder), idioma, redes (placeholder).
- **Indexable:** sí (cuando flip global).
- **Cache:** prerender + revalidate cada N min cuando featured listings cambien.

## `/explorar` — Catálogo
- **Goal:** mostrar todos los biringas disponibles con filtros mínimos.
- **Above-the-fold:** título + filtros (ciudad, tipo de evento, disponibilidad), grilla de cards.
- **Card del listing:** foto principal (con consentimiento), nombre/handle, ciudad, tagline corto, badge si está verificado, CTA implícito "Ver perfil".
- **Paginación:** server-driven (URL `?page=`), no infinite scroll en F3.
- **Indexable:** sí. La página `?page=N` con N>1 → `noindex, follow` o canonical a `/explorar` para evitar dilución.
- **Cache:** SSR con revalidate por evento de listing.

## `/p/[slug]` — Detalle de biringa
- **Goal:** entregar toda la info necesaria para decidir + CTA de compra directa.
- **Above-the-fold mobile:** foto principal + nombre/handle + ciudad + CTA "Contratar".
- **Secciones:**
  1. Galería (3–6 fotos, `next/image`).
  2. Bio breve aprobada.
  3. Detalles del servicio (tipos de evento, idiomas, disponibilidad).
  4. Tarifas o rango de tarifas.
  5. CTA principal "Contratar" (provisional "Próximamente" en F3).
  6. CTA secundario "Compartir perfil".
- **Indexable:** **gated**. Default `noindex`; cada perfil debe pasar review (foto consentida, copy aprobado) antes de flip a `index` per-profile.
- **Cache:** SSR con revalidate por evento `listing.updated`.
- **Legal:** sin reviews/ratings hasta que existan reales.

## `/legal/terminos`, `/legal/privacidad`
- Pendientes de redacción legal. Marcadas como `noindex` hasta tener texto definitivo.
