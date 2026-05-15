# SEO Route Contract · Catálogo (`/explorar`)

Ruta: `/explorar` (default — pendiente confirmación final).
Tipo: feature-public.
Objetivo de negocio: máxima discoverability del catálogo y entrada al detalle.
Audiencia: usuarios buscando catálogo de acompañantes.
Search intent: comercial / navegacional.
Keyword principal: `biringas disponibles`.
Keywords secundarias: `acompañantes [ciudad]`, `compañía para [evento]`.
Title: `Explorar Biringas — Catálogo de acompañantes`
Description: `Encuentra y contrata acompañantes verificados para eventos, viajes y salidas. Filtra por ciudad, idioma y disponibilidad.`
Canonical: `${SITE_URL}/explorar` (siempre apuntando a la versión sin paginación).
metadataBase: por ambiente.
Idioma: `es`.
Alternates / hreflang: pendiente activación de `[lang]`.
Indexabilidad: `index, follow` para `/explorar`. Para `/explorar?page=N` con `N > 1` → `noindex, follow` (canonical sigue apuntando a `/explorar`).
Sitemap: yes (sólo `/explorar`, no las páginas paginadas).
Robots: allow.
OG title: igual a title.
OG description: igual a description.
OG image: `/brand/og-default.png` (pendiente). Fallback: OG image generada con `next/og` mostrando paleta + slogan.
Twitter card: `summary_large_image`.
Schema JSON-LD: `BreadcrumbList`. Opcional `ItemList` cuando el catálogo tenga datos reales aprobados.
CTA principal: card → `/p/[slug]`.
CTA secundario: filtros (server-driven via search params).
Contenido mínimo requerido: título, filtros mínimos, grilla de cards con foto consentida, paginación SSR.
Internal links requeridos: cada card → `/p/[slug]`; breadcrumb a `/`.
Assets requeridos: foto principal por listing (con consentimiento documentado).
Performance objetivo: LCP < 2.5s, CLS < 0.1, INP < 200ms.
Responsive Contract: `docs/responsive/routes/explorar.md`
Mobile CTA: card tap-area completa.
Above-the-fold mobile: filtros colapsables + primeras 2 cards visibles.
Image strategy: `next/image` con `sizes` por viewport; sólo el primer card con `priority`.
Owner: founder.
Estado: **approved**.
Notas:
- La paginación NO se incluye en sitemap. Los filtros generan params, no rutas indexables nuevas.
- **Restaurada como página propia (PR3, 2026-05-12).** Reemplazó el redirect previo a `/`. Toda la UI de filtros + grilla + paginación vive aquí. El `Header` se renderiza con `hideCatalogCta` porque ya estamos en el destino del CTA "Explorar".
