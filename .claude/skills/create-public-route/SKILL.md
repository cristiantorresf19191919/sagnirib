# Skill · create-public-route

## Entrada
Necesidad de una ruta pública nueva (marketing / landing / detalle).

## Pasos
1. Crear `docs/seo/routes/<route>.md` desde el template.
2. Aprobar contrato (status `approved`).
3. Crear `docs/responsive/routes/<route>.md` si la ruta es visible.
4. Registrar la ruta en `src/core/seo/seo-routes.ts`.
5. Implementar `src/app/<route>/page.tsx` usando `buildPageMetadata`.
6. Si requiere JSON-LD, llamar a un builder en `src/core/seo/structured-data.ts`.
7. Agregar `*.responsive.spec.ts` en `tests/e2e/`.
8. Correr `pnpm seo:audit && pnpm responsive:audit && pnpm test:e2e`.

## Output esperado
Ruta navegable, indexable cuando proceda, con tests responsive.

## Checklist de verificación
- [ ] Contrato SEO `approved`.
- [ ] Contrato responsive `approved` si aplica.
- [ ] Metadata via factory.
- [ ] Sin lógica pesada en page.tsx.
- [ ] Test responsive verde en los 6 viewports.
