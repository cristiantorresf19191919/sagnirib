# SEO Route Contract · Home (`/`)

Ruta: `/`
Tipo: marketing
Objetivo de negocio: explicar Biringas y enviar al catálogo.
Audiencia: usuarios buscando servicios de acompañamiento para eventos / viajes.
Search intent: branded ("biringas") + informational ("acompañantes para eventos").
Keyword principal: `biringas`.
Keywords secundarias: `acompañantes para eventos`, `compañía para viajes`.
Title: `Biringas — Consigue lo que quieres en el momento que quieres`
Description: `Marketplace de Biringas para reservar compañía verificada para eventos, viajes y salidas. Explora perfiles y contrata directo.`
Canonical: `${SITE_URL}/`
metadataBase: `${NEXT_PUBLIC_SITE_URL}` por ambiente.
Idioma: `es` (default). `en` vendrá vía `[lang]` cuando se active.
Alternates / hreflang: pendiente — se cablea junto con activación de `[lang]`.
Indexabilidad: `index, follow` cuando `seoConfig.indexingEnabled === true`.
Sitemap: yes.
Robots: allow.
OG title: `Biringas — Consigue lo que quieres en el momento que quieres`
OG description: igual a description.
OG image: `/brand/og-default.png` (pendiente — fallback `/favicon.ico` no apto para OG).
Twitter card: `summary_large_image`.
Schema JSON-LD: `Organization` + `WebSite` (en `<head>` del root layout).
CTA principal: "Explorar Biringas" → `/explorar`.
CTA secundario: scroll a "Cómo funciona".
Contenido mínimo requerido: hero, cómo funciona, featured listings, footer legal.
Internal links requeridos: `/explorar`, futuros `/legal/*`.
Assets requeridos: logo (pendiente SVG), OG 1200×630 (pendiente).
Performance objetivo: LCP < 2.5s, CLS < 0.1, INP < 200ms.
Responsive Contract: `docs/responsive/routes/home.md`
Mobile CTA: "Explorar Biringas", visible above-the-fold mobile sin scroll.
Above-the-fold mobile: nombre Biringas + slogan + CTA primario.
Image strategy: `next/image` con `priority` solo en hero; resto lazy + `sizes` correctos.
Owner: founder.
Estado: **approved**.
Notas:
- Bloqueada para indexación hasta release-hardening (switch global). El OG image queda como gap conocido.
- **Split restaurado (PR3, 2026-05-12).** Home dejó de embeber el catálogo; ahora vive sólo en `/explorar`. Home queda como surface de marketing: `EditorialHero` (con search form que submitea a `/explorar`), `FeaturedStrip` (4 perfiles destacados desde `listFeatured()`), CTA "Explorar todo el catálogo" → `/explorar`, y `HowItWorks`. La página NO acepta search params — los filtros viven en `/explorar`.
