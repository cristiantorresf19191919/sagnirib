# SEO Route Contract · Recuperar (`/recuperar`)

Ruta: `/recuperar`
Tipo: funnel / auth (recuperación de contraseña).
Objetivo de negocio: reducir abandono de cuentas existentes que olvidaron su contraseña.
Audiencia: usuarios autenticados previamente con email / password.
Search intent: navegacional desde `/ingresar`. NO target SEO orgánico.
Keyword principal: n/a — ruta de auth.
Keywords secundarias: n/a.
Title: `Recuperar contraseña`
Description: n/a — la ruta es noindex.
Canonical: `${SITE_URL}/recuperar`
metadataBase: `${NEXT_PUBLIC_SITE_URL}` por ambiente.
Idioma: `es` (default).
Alternates / hreflang: n/a — ruta no traducida en MVP.
Indexabilidad: **`noindex, nofollow` permanente.** Auth surface; nunca debe aparecer en motores.
Sitemap: **no.**
Robots: **disallow** (a futuro, si se agrega robots.txt explícito).
OG title: n/a.
OG description: n/a.
OG image: n/a.
Twitter card: n/a.
Schema JSON-LD: ninguno.
CTA principal: "Enviarme el correo".
CTA secundario: "Ingresá" → `/ingresar`.
Contenido mínimo requerido: form (email), mensaje de éxito genérico.
Internal links requeridos: `/ingresar`.
Assets requeridos: ninguno.
Performance objetivo: LCP < 2.5s, CLS < 0.1, INP < 200ms.
Responsive Contract: pendiente (ruta funnel — bajo prioridad pre-launch).
Mobile CTA: "Enviarme el correo" full-width.
Above-the-fold mobile: heading + form completo.
Image strategy: n/a.
Owner: founder.
Estado: **approved** (auth surface, copy es BRAND_HANDSHAKE_TODO).
Notas:
- Anti-enumeration: el mensaje de éxito es idéntico exista o no la cuenta. Solo `auth/invalid-email` se surface como error de UX.
- El correo de reseteo y la URL de recovery hoy son los defaults de Firebase Auth. Cuando aterrice branding, configurar templates en la consola de Firebase y / o un action handler URL custom.
- No emite audit propio en MVP (el contrato `auditLog` es stub `TODO(F5)`); Firebase ya registra el evento server-side.
