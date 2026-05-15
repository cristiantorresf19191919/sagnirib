# SEO Route Contract · Registrarse (`/registrarse`)

Ruta: `/registrarse`
Tipo: funnel / auth (creación de cuenta).
Objetivo de negocio: permitir que modelos y compradores creen cuenta para acceder a flujos gated (publicar, dejar reseñas, contratar).
Audiencia: usuarios sin cuenta.
Search intent: navegacional desde Header / `/ingresar`. NO target SEO orgánico.
Keyword principal: n/a — ruta de auth.
Keywords secundarias: n/a.
Title: `Crear cuenta`
Description: n/a — la ruta es noindex.
Canonical: `${SITE_URL}/registrarse`
metadataBase: `${NEXT_PUBLIC_SITE_URL}` por ambiente.
Idioma: `es` (default).
Alternates / hreflang: n/a — ruta no traducida en MVP.
Indexabilidad: **`noindex, nofollow` permanente.** Auth surface; nunca debe aparecer en motores.
Sitemap: **no.**
Robots: **disallow** (a futuro, si se agrega robots.txt explícito).
OG title: n/a — ruta no compartible.
OG description: n/a.
OG image: n/a.
Twitter card: n/a.
Schema JSON-LD: ninguno.
CTA principal: "Crear cuenta".
CTA secundario: "Ingresá" → `/ingresar`.
Contenido mínimo requerido: form (email, password, confirmar, checkbox términos), enlace a `/ingresar`.
Internal links requeridos: `/ingresar`.
Assets requeridos: ninguno.
Performance objetivo: LCP < 2.5s, CLS < 0.1, INP < 200ms.
Responsive Contract: pendiente (ruta funnel — bajo prioridad pre-launch).
Mobile CTA: "Crear cuenta" full-width al final del form.
Above-the-fold mobile: heading + form completo.
Image strategy: n/a.
Owner: founder.
Estado: **approved** (auth surface, copy es BRAND_HANDSHAKE_TODO).
Notas:
- Pareja con `/ingresar` y `/recuperar`. Si el usuario está autenticado, el form muestra "Ya tenés sesión iniciada" en vez del formulario.
- Doble audit en signup intencional: `auth.signup` (Server Action explícita) + `auth.login` (listener `onIdTokenChanged`).
- Email de verificación se dispara best-effort tras el `createUserWithEmailAndPassword`; no bloquea el flujo en MVP.
- Roles se otorgan vía Firebase Auth custom claims; en signup el usuario queda con `roles: []`. El rol `model` se asigna al publicar el primer listing (PR2).
