# Skill · bootstrap-next-greenfield

## Entrada
Repositorio nuevo o casi nuevo (resultado de `create-next-app` o equivalente).

## Pasos
1. Leer Blueprint Maestro + Intake + Addendum 001 + Addendum 002.
2. Confirmar versión de Next y consultar `node_modules/next/dist/docs/`.
3. Migrar a `src/` si no existe; ajustar `tsconfig` (`@/*` → `./src/*`).
4. Crear `AGENTS.md` extendido, `CLAUDE.md`, `.mcp.json`, `.claude/{rules,skills,subagents}`.
5. Crear ADRs 001–009.
6. Crear estructura `src/{app,core,shared,features,server}` mínima.
7. Crear tokens del design system y `theme.css`.
8. Crear helpers SEO (`build-page-metadata`, `seo-routes`, `sitemap.ts`, `robots.ts`).
9. Crear `instrumentation.ts` y `proxy.ts` (Next 16).
10. Configurar Vitest + Playwright + scripts de gates.

## Output esperado
Repo con foundation completa, `pnpm typecheck && pnpm lint && pnpm build` verdes, sin features finales.

## Checklist de verificación
- [ ] AGENTS.md menciona orden de lectura y `node_modules/next/dist/docs/`.
- [ ] `src/` configurado y `@/*` apunta a `./src/*`.
- [ ] 9 ADRs presentes.
- [ ] Tokens en TS + theme.css espejado.
- [ ] `seoConfig.indexingEnabled === false`.
- [ ] `proxy.ts` (no middleware.ts).
- [ ] Scripts de gates registrados en package.json.
