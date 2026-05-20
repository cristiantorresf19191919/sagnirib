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
CTA principal: durante MVP-gratuito = "Publicar gratis" en el paso 3; cuando se activen planes pagos = "Publicar y pagar [TOTAL]".
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
- Pricing en COP: Esencial $89.000/mes · Destacada $189.000/mes · Premium VIP $349.000/mes. Add-ons one-shot: Boost ciudad 24h $25.000, Posición #1 categoría 7d $79.000, Story banner 7d $59.000, Pack SEO $129.000, Reportaje verificado $250.000.
- **Auth gate (PR2a):** la ruta llama `getSession()` en el Server Component y redirige a `/ingresar?next=/publicar` si la sesión es anónima. La Server Action `createListingDraft` además exige `requireAuth()` server-side.
- **Persistencia (PR2a, ADR-011):** la `submit` action escribe en `listing_drafts/{auto-id}` con `status: 'pending_review'`. La modelo recibe la pantalla de éxito + audit event `biringa.draft.submitted`. La aprobación es manual (admin via consola de Firestore) hasta que llegue el panel de admin.
- **Role grant (PR2a):** en el primer draft enviado, el usuario obtiene el rol `'model'` vía Firebase Auth custom claims (merge aditivo). Drafts posteriores son no-op a nivel claims.
- **Photos (Fase 1 entregada, ADR-012):** el wizard comprime cada foto en el cliente (`browser-image-compression`, max 2048px, calidad 0.82, ~500KB, EXIF eliminado por privacidad) y la sube por **signed URL V4 server-firmada** a `users/{uid}/staging/{sessionId}/photos/...`. En submit, las fotos se copian a `listing_drafts/{draftId}/photos/...` (server-side, Admin SDK). El client nunca sostiene credenciales de Storage; las Storage Rules son deny-all para todo el tráfico cliente. Galería sigue siendo opcional (admin la complementa en aprobación si falta).
- **Planes (MVP-gratuito, founder decision 2026-05-19):** durante el lanzamiento los 3 planes (Esencial / Destacada / Premium) se ven en el paso 3 pero están deshabilitados con badge "Próximamente". El flag central `PLANS_ENABLED` en `src/features/enrollment/lib/pricing.ts` controla el toggle; cuando se conecte el provider de pagos, flip a `true` en la misma PR. El payload server-side hardcodea `packageId: 'esencial'`, `addOnIds: []`, `billing: 'monthly'` mientras el flag esté en false (defense in depth — no se confía solo en el UI).
- **Pagos (futuro):** cuando se conecte el provider (Stripe / Wompi), un segundo Server Action `chargeForPlan` correrá tras `createListingDraft`. Hasta entonces el draft queda registrado y la admin lo aprueba sin step de pago.
- **Video (Fase 1b pendiente):** los planes Destacada / Premium prometen video pero el slot está oculto en el wizard hasta que llegue un pipeline de transcoding decente. Compresión de video en browser es prohibitiva (FFmpeg.wasm 25MB); preferimos transcoding server-side post-upload.
- Verificación humana del perfil (KYC) sigue siendo paso obligatorio antes de publicar al catálogo — la pantalla de éxito ya lo comunica.
