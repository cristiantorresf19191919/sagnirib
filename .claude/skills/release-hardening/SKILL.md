# Skill · release-hardening

## Entrada
Producto listo para abrir indexación.

## Pasos
1. Correr todos los gates: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e`, `pnpm build`, `pnpm seo:audit`, `pnpm design:audit`, `pnpm security:audit`, `pnpm patterns:audit`, `pnpm responsive:audit`.
2. Verificar SEO release checklist completo.
3. Verificar Responsive release checklist por ruta.
4. Verificar seguridad: Server Actions, webhooks, secrets.
5. Performance check (LCP, CLS, INP) en rutas clave.
6. Cuando todo pase, flip `seoConfig.indexingEnabled` a `true`.

## Output esperado
Sistema listo para producción.

## Checklist
- [ ] Todos los gates verdes.
- [ ] Indexación abierta sólo después de checklists.
- [ ] Runbooks listos.
