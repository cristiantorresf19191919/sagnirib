# SEO Route Contract · Detalle de biringa (`/p/[slug]`)

Ruta: `/p/[slug]` (default — pendiente confirmación final).
Tipo: feature-public.
Objetivo de negocio: convertir → CTA "Contratar".
Audiencia: usuario que ya eligió a quién quiere ver.
Search intent: navegacional / branded por handle del biringa.
Keyword principal: el handle/nombre público del biringa.
Keywords secundarias: ciudad + tipo de evento del perfil.
Title: dinámico — `${nombre} en Biringas` (vía `generateMetadata`).
Description: dinámica — bio corta aprobada del perfil + ciudad. Sin claims inventados.
Canonical: `${SITE_URL}/p/${slug}`.
metadataBase: por ambiente.
Idioma: `es` por defecto; `en` cuando el perfil tenga traducción aprobada.
Alternates / hreflang: por perfil cuando exista la traducción.
Indexabilidad: **gated**. Default `noindex, follow` por perfil. Sólo `index, follow` cuando el perfil tiene: (a) consentimiento de imagen documentado, (b) bio aprobada, (c) verificación interna marcada `true`. El switch global `seoConfig.indexingEnabled` sigue siendo prerequisito.
Sitemap: sólo perfiles con flag `indexable: true` aprobados.
Robots: allow para perfiles aprobados; disallow para drafts.
OG title: `${nombre} — Biringas`.
OG description: bio corta aprobada.
OG image: foto principal del perfil (1200×630 derivada vía `next/og` o asset). Pendiente integrar provider de imagen.
Twitter card: `summary_large_image`.
Schema JSON-LD: `Service` + `BreadcrumbList`. **Prohibido** `Person`, `Review`, `Rating` hasta que existan datos reales y verificados.
CTA principal: "Contratar" — provisional "Próximamente" hasta cablear pagos.
CTA secundario: "Compartir perfil".
Contenido mínimo requerido: foto, nombre/handle, ciudad, bio, detalles del servicio, tarifas, CTA.
Internal links requeridos: breadcrumb a `/explorar` y a `/`.
Assets requeridos: galería del perfil (3–6 fotos consentidas).
Performance objetivo: LCP < 2.5s, CLS < 0.1, INP < 200ms.
Responsive Contract: `docs/responsive/routes/p-slug.md`
Mobile CTA: "Contratar" sticky o visible en above-the-fold mobile.
Above-the-fold mobile: foto principal + nombre + ciudad + CTA.
Image strategy: `next/image` con `priority` en la primera foto y `sizes` por viewport.
Owner: founder + ops review per-profile.
Estado: **approved** (contrato de ruta). Indexación per-profile sigue gateada.
Notas: nunca emitir Review/Rating hasta tener reviews reales. Nunca exponer datos de contacto privados (teléfono, email) en HTML — flujo de contratación va por backend autenticado cuando exista.
