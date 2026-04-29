# PR #1 — Foundation: visible home (mock-only)

Status: **approved by founder** (sesión 2026-04-28). Decisión explícita: aplicar cambios automáticamente, target branch `dev`.

## Objetivo

Cerrar el primer slice vertical: una home visible, polished, server-rendered, anclada al contrato SEO/Responsive ya aprobado y al intake cerrado. Resto de rutas (`/explorar`, `/p/[slug]`) entran como stubs no indexables para no romper navegación. Sin Firebase. Mock-only behind un puerto que la futura adapter de Firebase reemplazará sin tocar features.

## Fuera de alcance (PR #1)

- Interactividad de filtros (`/explorar` real → PR #3).
- Detalle de perfil (`/p/[slug]` real → PR #2).
- Auth, publish, dashboard, pagos.
- Server Actions con efectos (no hay mutaciones todavía).
- Firebase / cualquier SDK externo.
- Logo SVG final / OG image (gaps conocidos en `brand-intake.md`).

## Decisiones locked

### Posicionamiento
Confirmed Option A en intake conversation: marketplace de acompañamiento (compañía a eventos, viajes, salidas). Modelo conceptual cercano a fotoprepago / milerótico, ya documentado en `docs/project/project-intake.md` Bloque A. **No** se enmarca como "masajes" — el old app usaba ese envoltorio; aquí dejamos la categoría real.

### Routing y URLs
Locked en `seo-routes.ts`. No se renombran en F3:
- `/` — home, indexable cuando el switch global se prenda.
- `/explorar` — stub "Próximamente" (noindex per-page) hasta PR #3.
- `/p/[slug]` — stub "Próximamente" (noindex) hasta PR #2.

Slug-based, **no** numeric id. El old app usaba `/ad/[id]`; descartado.

### Modelo de datos
Adaptado del old `mockData.ts` con cambios obligados por intake:
- `id` → además se agrega `slug` (URL handle).
- `services` reframed: del set "técnicas de masaje" al set companion/eventos/viajes. Justificación: el founder en `brand-config.ts` dice "servicios para eventos y viajes" — ese es el catálogo, no técnicas terapéuticas.
- `meetingPlaces` → `meetingContexts`: cenas, eventos sociales, eventos corporativos, viajes nacionales/internacionales, hoteles.
- Se omite el campo `pubis` del old data — no aporta a la card/home y suma riesgo sin upside. Si PR #3 lo reintroduce explícitamente para filtros, se reabre.
- `phone` / `whatsapp` siguen en el data shape pero **nunca** se renderizan en HTML (per `docs/seo/routes/p-slug.md`: contacto sólo vía backend autenticado cuando exista).
- Se mantienen: nombre, edad (≥18), ciudad, barrio, precio, galería, video/audio, verified, tags, attributes (sin `pubis`), reputation, idiomas/disponibilidad, coords, timestamps.

### Mock storage / capa de datos
- Vive en `src/server/mocks/biringas/` con `import "server-only"` en cada archivo.
- API pública: `listAll(filters)`, `listFeatured(limit)`, `findBySlug(slug)`, `listCities()`, `listServiceCatalog()`.
- Storage: const module-scope, no fetch, no IO. Latencia se simula con `await Promise.resolve()` para mantener el shape `async` del puerto.
- **Cuando entre Firebase**, el reemplazo es 1:1 — esta misma firma vive en `src/server/adapters/firebase/biringas/`. Features siguen importando desde `@/server/biringas` (a definir como barrel) — el switch ocurre en una capa.

### Brand copy
`brandCopy` en `src/core/branding/brand-copy.ts` tiene slots vacíos (homeHeroTitle, homeHeroSubtitle, primaryCta, secondaryCta). El intake delega copy SEO a este sistema y los valores aprobados ya viven en `docs/seo/routes/home.md`. Se transfieren:
- `homeHeroTitle: "Biringas"` (display lockup; el slogan se renderiza separado).
- `homeHeroSubtitle: "Consigue lo que quieres en el momento que quieres"` (slogan, founder-confirmed).
- `primaryCta: "Explorar Biringas"`.
- `secondaryCta: "Cómo funciona"`.

### Edad / age gate
Adult content sin gate explícito = no aceptable. Spec:
- Cookie `biringas_age_ack=1`, scope `/`, `Max-Age=31536000` (1 año), `SameSite=Lax`, `Secure` en prod.
- Server-side: layout reads cookie. Si falta → render `AgeGate` full-page (sin Header/Footer); si presente → render normal.
- Client component minimo (`'use client'`) para handler "Soy mayor de 18" → sets cookie + reload. Botón "Salir" → `window.location = "https://www.google.com"`.
- Texto y CTAs del gate viven hardcoded por ahora (eventualmente brand-copy.ts cuando se redacte el copy legal).

### Tipografía
`brand-intake.md` deja tipografía como pendiente pero `design-direction.md` lista Geist Sans como aceptable. Decisión: Geist Sans + Geist Mono via `next/font/google`, expuestos como `--font-sans` / `--font-mono`. `--font-display` queda apuntando a `--font-sans` con peso 700 hasta que se elija un display real (decisión deferida — no bloquea F3).

### Componentes nuevos creados en este PR
- `src/shared/design-system/components/Button.tsx` — primary/secondary/ghost variants + glow flag.
- `src/shared/design-system/components/Container.tsx` — max-width + padding consistente.
- `src/shared/design-system/components/Logo.tsx` — wordmark text fallback (PNG opcional via `brandAssets.hasAsset`).
- `src/shared/design-system/components/VerifiedBadge.tsx`.
- `src/shared/design-system/components/NeonGlow.tsx` — wrapper decorativo (one-glow-per-element regla).
- `src/shared/ui/Tag.tsx` — tag pill.
- `src/shared/layout/Header.tsx` — top bar + drawer mobile (`<details>` para no requerir JS).
- `src/shared/layout/Footer.tsx` — footer legal placeholder + brand mark.
- `src/shared/layout/AgeGate.tsx` (server) + `src/shared/layout/age-gate-actions.tsx` (`'use client'`) + `src/shared/layout/age-gate-cookie.ts` (server-only helper).
- `src/features/biringas/components/BiringaCard.tsx`.
- `src/features/biringas/components/FeaturedBiringas.tsx`.

### Páginas tocadas
- `src/app/layout.tsx` — wire fonts, conditional age gate.
- `src/app/page.tsx` — replace placeholder with full home (Hero + Cómo funciona + Featured + Footer).
- `src/app/explorar/page.tsx` — nuevo, stub.
- `src/app/p/[slug]/page.tsx` — nuevo, stub.

### Performance / responsive
- LCP target: hero el componente con texto + CTA (no imagen). `next/image` `priority` en la primera card del featured grid (es lo que entra above-the-fold en mobile a 360 px).
- Images: Unsplash mock URLs (mismas que old app) hasta integrar provider.
- Touch targets ≥ 44 px en CTA y nav.
- `prefers-reduced-motion`: glow pulse OFF.

### Tests
- `tests/unit/server/mocks/biringas.test.ts` — `listAll`, `listFeatured`, `findBySlug`, edge cases (no match, slug colision).
- `tests/unit/features/biringas/BiringaCard.test.tsx` — renders nombre, ciudad, precio formateado, badge verified.
- `tests/e2e/home.responsive.spec.ts` — al menos un viewport (360) en project responsive: visit `/`, accept gate, hero CTA visible above fold, featured grid renders ≥ 4 cards.

### Audits
Documentary scripts (`seo:audit`, `design:audit`, `responsive:audit`, `security:audit`, `patterns:audit`) son stubs documentales hoy — pasan si los docs de governance existen. No se les agrega lógica AST en este PR.

### Out of governance: lo que NO cambia
- `seoConfig.indexingEnabled` queda **false**. Toda la home renderiza con `noindex` hasta release-hardening.
- `proxy.ts` permanece no-op (auth/i18n no entra en F3).
- `instrumentation.ts` queda igual.
- ADRs no se modifican.

## Riesgos conocidos
- **Imágenes Unsplash**: hot-linkeadas a Unsplash. En producción real necesitamos provider (Cloudinary/Imgix) + consentimiento documentado por foto. Para PR #1 usamos las mismas URLs del old mock — tracked como gap.
- **OG image** sigue pendiente — home contract lo lista como "OG image: `/brand/og-default.png` (pendiente)". No bloquea F3.
- **Logo SVG**: `brandAssets.logoSvg` vacío. `Logo` componente cae al wordmark text. Trade-off: peor textura visual, pero válido per intake.

## Plan de PRs subsiguientes (referencia, no parte de este PR)
- PR #2: `/p/[slug]` real con galería + CTA "Contratar (Próximamente)".
- PR #3: `/explorar` real con filtros server-driven (search params).
- PR #4: i18n `[lang]` activado.
- PR #5: Firebase adapter (sustituye los mocks sin tocar features).
- PR #6+: auth, publish, dashboard, pagos.
