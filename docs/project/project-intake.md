# Biringas — Project Intake

Status: **closed** for F3 purposes. Re-open if any of the locked decisions changes.

## Bloque A · Negocio
- **Producto:** marketplace de servicios de acompañamiento (compañía a eventos, viajes, salidas). Modelo conceptual cercano a fotoprepago / milerótico.
- **Alcance F3–F5:** template funcional con catálogo + detalle. Sin transacciones reales todavía.
- **Acción principal de la web:** **compra directa** (contratación) desde el detalle de cada acompañante.
- **Etapa:** greenfield, pre-launch.

## Bloque B · Audiencia
- Compradores: usuarios que buscan compañía verificada para eventos / viajes.
- Lenguaje: directo, sin eufemismos exagerados, evitando jerga vulgar en superficies SEO.
- Madurez: variada — el sitio debe ser inmediatamente comprensible.

## Bloque C · Marca
Locked: nombre = `Biringas`. Slogan = `Consigue lo que quieres en el momento que quieres`. Mood = bar neón nocturno. Paleta canónica registrada en `design-direction.md`.
Pendiente: SVG vectorizado, monocromo, OG 1200×630, tipografías oficiales.

## Bloque D · Dirección visual
- Canónico: paleta y mood del logo recibido.
- No-go: glow apilado, gradientes arcoíris, script en H1, `Vírgenes` / `Super Tabern` / `2.0` en producto final.

## Bloque E · Contenido
- Copy: el founder delega el copy SEO en este sistema. Slogan locked. El resto del copy se redacta dentro de cada SEO Route Contract y se aprueba antes de salir a indexación.
- Claims comprobables: ninguno todavía. Nada de métricas, ratings o reviews inventados.

## Bloque F · SEO / discoverability
- Idioma default: `es`. Secundario: `en`.
- Routing `[lang]` **NO** activado en foundation. Las rutas viven en raíz hasta cerrar URL strategy.
- Rutas iniciales (defaults — pueden renombrarse en review):
  - `/` — home.
  - `/explorar` — listado del catálogo de acompañantes.
  - `/p/[slug]` — detalle de cada acompañante (CTA de compra directa).
  - `/legal/terminos`, `/legal/privacidad` — pendientes de redacción legal.
- Indexabilidad por defecto: home y `/explorar` indexables; `/p/[slug]` indexable POR DEFECTO con gate per-perfil (cada perfil debe pasar review antes de salir del noindex de perfil).
- Switch global `seoConfig.indexingEnabled` permanece **false** hasta release-hardening.

## Bloque G · Localization
Política documentada en `docs/localization/i18n-routing-policy.md`. URL strategy NO decidida (subpath vs subdominio); pendiente.

## Bloque H · Conversión
- CTA principal por ruta:
  - `/` → "Explorar Biringas" → `/explorar`.
  - `/explorar` → click en card → `/p/[slug]`.
  - `/p/[slug]` → "Contratar" (compra directa).
- CTA secundario en `/p/[slug]`: "Compartir perfil".
- No hay funnel de auth ni pago wired todavía: el botón "Contratar" mostrará un estado provisional de tipo "Próximamente" hasta que se conecte el provider de pagos.

## Bloque I · Restricciones técnicas
- Hosting / dominio prod: pendiente. Dev en `localhost`.
- Integraciones críticas: NINGUNA en F3–F4. Auth, pagos, mensajería, analytics se cablearán como adapters cuando llegue el momento.
- Legal / cookies / privacidad: copy legal pendiente de redacción profesional.

## Decisiones pendientes (no bloquean F3)
1. URL definitiva del listado: ¿`/explorar`, `/biringas`, `/catalogo`?
2. URL definitiva del detalle: ¿`/p/[slug]`, `/perfil/[slug]`, `/biringas/[slug]`?
3. Indexabilidad por perfil: ¿default `index` con gate manual o default `noindex` con flip explícito por perfil verificado?
4. Dominio prod + subdomains/locale.
5. Auth provider y payment provider.

## Criterios de aceptación
- ✅ Acción principal definida (compra directa).
- ✅ Páginas iniciales tienen brief y decisión de indexabilidad.
- ✅ Cada ruta inicial tiene SEO Route Contract.
- ✅ Marca con paleta + mood + slogan documentados.
- ✅ Idiomas y URL strategy documentadas (con pendientes).
- ⏸ Logo final pendiente — no bloquea F3 porque el placeholder usa solo paleta y slogan.
