# SEO Route Contract · Publicar (`/publicar`)

Ruta: `/publicar`
Tipo: funnel / conversión (no marketing público).
Objetivo de negocio: capturar nuevas modelos verificadas y convertirlas a un plan recurrente (Esencial / Destacada / Premium VIP).
Audiencia: modelos / acompañantes interesadas en publicar perfil en Biringas.
Search intent: navegacional desde Header CTA y campañas. NO target SEO orgánico.
Keyword principal: n/a — esta ruta no compite por keywords públicas.
Keywords secundarias: n/a.
Title: `Publica tu perfil — Biringas`
Description: `Crea tu anuncio en Biringas: detalles, descripción y plan de publicación. Verificación humana antes de salir al catálogo.`
Canonical: `${SITE_URL}/publicar`
metadataBase: `${NEXT_PUBLIC_SITE_URL}` por ambiente.
Idioma: `es` (default).
Alternates / hreflang: n/a — ruta no traducida en MVP.
Indexabilidad: **`noindex, nofollow` permanente.** Esta es una ruta de funnel; no debe aparecer en motores. `buildPageMetadata({ indexable: false })` lo fuerza incluso cuando `seoConfig.indexingEnabled` está en `true`.
Sitemap: **no.**
Robots: **disallow** (a futuro, si se agrega un robots.txt explícito).
OG title: `Publica tu perfil — Biringas`
OG description: igual a description.
OG image: `/brand/og-default.png` (pendiente — fallback `/favicon.ico` no apto).
Twitter card: `summary_large_image`.
Schema JSON-LD: ninguno. Esta ruta no genera rich results.
CTA principal: "Publicar y pagar [TOTAL]" en el paso 3.
CTA secundario: "Volver al catálogo".
Contenido mínimo requerido: stepper visible, paso actual, panel "Consejo útil", resumen de borrador / orden.
Internal links requeridos: `/` (link de regreso al catálogo).
Assets requeridos: ninguno crítico — la página depende de iconografía (lucide).
Performance objetivo: LCP < 2.5s, CLS < 0.1, INP < 200ms (form interactivo, vigilar INP).
Responsive Contract: `docs/responsive/routes/publicar.md`
Mobile CTA: "Guardar y continuar" / "Publicar y pagar", visible al final de cada sección sin scroll lateral.
Above-the-fold mobile: título + stepper compacto + tip card.
Image strategy: la galería usa placeholders mock (no `next/image` aún — la subida real entra cuando el adapter de storage exista).
Owner: founder.
Estado: **approved**.
Notas:
- Mock-only en este PR. La submission solo simula el guardado (`setTimeout`).
- Pricing en COP: Esencial $89.000/mes · Destacada $189.000/mes · Premium VIP $349.000/mes. Add-ons one-shot: Boost ciudad 24h $25.000, Posición #1 categoría 7d $79.000, Story banner 7d $59.000, Pack SEO $129.000, Reportaje verificado $250.000.
- Cuando se conecte el provider de pagos (Stripe / Wompi), la `submit` action vivirá detrás de `src/server/adapters/<provider>/` y será un Server Action `'use server'` con validación + auth + autorización (regla `next-architecture` + `integration-adapters`).
- Verificación humana del perfil (KYC) sigue siendo paso obligatorio antes de publicar al catálogo — la pantalla de éxito ya lo comunica.
